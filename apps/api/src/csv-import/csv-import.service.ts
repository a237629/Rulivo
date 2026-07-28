import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../database/prisma.service.js";
import { calculateTrade } from "../trades/trade-calculator.js";
import { groupExecutions } from "../trades/execution-grouper.js";
import { CsvParseError, parseCsv } from "./csv-parser.js";
import { detectCsvPreset, findCsvPreset, listCsvPresets, resolveCsvPreset } from "./csv-presets.js";
import {
  normalizedCsvRowSchema,
  normalizeCsvRow,
  type CsvMapping,
  type CsvMappingOptions
} from "./csv-validation.js";

const MAX_FILE_SIZE_BYTES = 1_048_576;
const PREVIEW_ROWS = 20;
const ERROR_PREVIEW_ROWS = 100;

interface UploadCsvInput {
  content: string;
  fileName: string;
  tradingAccountId: string;
}

interface ApplyMappingInput {
  mapping: CsvMapping;
  options: CsvMappingOptions;
  saveTemplate?: { name: string } | undefined;
}

function jsonValueToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  return JSON.stringify(value);
}

@Injectable()
export class CsvImportService {
  public constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  public listPresets() {
    return listCsvPresets();
  }

  public async detectPreset(userId: string, batchId: string) {
    const batch = await this.getOwnedBatch(userId, batchId);
    const detected = detectCsvPreset(this.readHeaders(batch.headers));
    if (detected === undefined) {
      return { detected: false, preset: null };
    }
    return {
      detected: true,
      preset: {
        id: detected.preset.id,
        label: detected.preset.label,
        mapping: detected.result.mapping,
        options: detected.preset.options
      }
    };
  }

  public async applyPreset(userId: string, batchId: string, presetId: string) {
    const preset = findCsvPreset(presetId);
    if (preset === undefined) throw new BadRequestException("Unknown CSV preset");
    const batch = await this.getOwnedBatch(userId, batchId);
    const resolved = resolveCsvPreset(preset, this.readHeaders(batch.headers));
    if (resolved.mapping === null) {
      throw new BadRequestException({
        details: { missingFields: resolved.missingFields, presetId },
        message: "CSV headers do not satisfy this preset"
      });
    }
    return this.applyMapping(
      userId,
      batchId,
      { mapping: resolved.mapping, options: preset.options },
      preset.id
    );
  }

  public async upload(userId: string, input: UploadCsvInput) {
    const size = Buffer.byteLength(input.content, "utf8");
    if (size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException("CSV exceeds the 1 MiB upload limit");
    }
    const account = await this.prisma.tradingAccount.findFirst({
      select: { id: true },
      where: { id: input.tradingAccountId, userId }
    });
    if (account === null) throw new NotFoundException("Trading account was not found");

    let parsed;
    try {
      parsed = parseCsv(input.content);
    } catch (error) {
      if (error instanceof CsvParseError) throw new BadRequestException(error.message);
      throw error;
    }

    const contentHash = createHash("sha256").update(input.content, "utf8").digest("hex");
    const duplicate = await this.prisma.csvImportBatch.findUnique({
      select: { id: true, status: true },
      where: { userId_contentHash: { contentHash, userId } }
    });
    if (duplicate !== null) {
      throw new ConflictException({
        details: {
          duplicateBatchId: duplicate.id,
          status: duplicate.status
        },
        message: "This CSV file has already been uploaded"
      });
    }

    const batch = await this.prisma.csvImportBatch.create({
      data: {
        contentHash,
        fileName: input.fileName,
        fileSizeBytes: size,
        headers: parsed.headers,
        totalRows: parsed.rows.length,
        tradingAccountId: input.tradingAccountId,
        userId,
        rows: {
          createMany: {
            data: parsed.rows.map((rawData, index) => ({
              rawData,
              rowNumber: index + 2
            }))
          }
        }
      },
      select: { id: true }
    });
    return this.get(userId, batch.id);
  }

  public async get(userId: string, batchId: string) {
    const batch = await this.prisma.csvImportBatch.findFirst({
      where: { id: batchId, userId }
    });
    if (batch === null) throw new NotFoundException("CSV import batch was not found");
    const [preview, errors] = await Promise.all([
      this.prisma.csvImportRow.findMany({
        orderBy: { rowNumber: "asc" },
        take: PREVIEW_ROWS,
        where: { batchId }
      }),
      this.prisma.csvImportRow.findMany({
        orderBy: { rowNumber: "asc" },
        take: ERROR_PREVIEW_ROWS,
        where: { batchId, isValid: false }
      })
    ]);
    return {
      ...batch,
      errorPreview: errors.filter((row) => row.validationErrors !== null),
      preview
    };
  }

  public async applyMapping(
    userId: string,
    batchId: string,
    input: ApplyMappingInput,
    presetId: string | null = null
  ) {
    const batch = await this.prisma.csvImportBatch.findFirst({
      include: { rows: { orderBy: { rowNumber: "asc" } } },
      where: { id: batchId, userId }
    });
    if (batch === null) throw new NotFoundException("CSV import batch was not found");
    if (batch.status === "CONFIRMED") {
      throw new ConflictException("A confirmed import cannot be remapped");
    }

    const headers = new Set(
      Array.isArray(batch.headers)
        ? batch.headers.filter((item): item is string => typeof item === "string")
        : []
    );
    const missingColumns = Object.values(input.mapping).filter(
      (column) => column !== undefined && !headers.has(column)
    );
    if (missingColumns.length > 0) {
      throw new BadRequestException(`Mapped columns do not exist: ${missingColumns.join(", ")}`);
    }

    const rows = batch.rows.map((row) => {
      const raw =
        typeof row.rawData === "object" && row.rawData !== null && !Array.isArray(row.rawData)
          ? Object.fromEntries(
              Object.entries(row.rawData).map(([key, value]) => [key, jsonValueToString(value)])
            )
          : {};
      const result = normalizeCsvRow(raw, input.mapping, input.options);
      return {
        errors: result.errors,
        normalized: result.normalized,
        raw,
        rowNumber: row.rowNumber
      };
    });
    const validRows = rows.filter((row) => row.normalized !== null).length;
    const errorRows = rows.length - validRows;

    await this.prisma.$transaction(async (transaction) => {
      await transaction.csvImportRow.deleteMany({ where: { batchId } });
      await transaction.csvImportRow.createMany({
        data: rows.map((row) => ({
          batchId,
          isValid: row.normalized !== null,
          rawData: row.raw,
          rowNumber: row.rowNumber,
          ...(row.normalized === null ? {} : { normalizedData: { ...row.normalized } }),
          ...(row.errors.length === 0
            ? {}
            : { validationErrors: row.errors.map((error) => ({ ...error })) })
        }))
      });
      await transaction.csvImportBatch.update({
        data: {
          errorRows,
          mapping: input.mapping,
          mappingOptions: input.options,
          presetId,
          status: "MAPPED",
          validRows
        },
        where: { id: batchId }
      });
      if (input.saveTemplate !== undefined) {
        await transaction.csvMappingTemplate.upsert({
          create: {
            mapping: input.mapping,
            name: input.saveTemplate.name,
            options: input.options,
            userId
          },
          update: { mapping: input.mapping, options: input.options },
          where: { userId_name: { name: input.saveTemplate.name, userId } }
        });
      }
    });
    return this.get(userId, batchId);
  }

  public async confirm(userId: string, batchId: string) {
    const confirmedAt = new Date();
    const result = await this.prisma.csvImportBatch.updateMany({
      data: { confirmedAt, status: "CONFIRMED" },
      where: { id: batchId, status: "MAPPED", userId, validRows: { gt: 0 } }
    });
    if (result.count === 0) {
      const batch = await this.prisma.csvImportBatch.findFirst({
        select: { status: true, validRows: true },
        where: { id: batchId, userId }
      });
      if (batch === null) throw new NotFoundException("CSV import batch was not found");
      if (batch.status === "CONFIRMED")
        throw new ConflictException("CSV import is already confirmed");
      if (batch.status !== "MAPPED")
        throw new BadRequestException("CSV mapping must be applied first");
      throw new BadRequestException("CSV import has no valid rows to confirm");
    }
    return this.get(userId, batchId);
  }

  public async group(userId: string, batchId: string) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT "id" FROM "csv_import_batches" WHERE "id" = ${batchId}::uuid FOR UPDATE`;
      const batch = await transaction.csvImportBatch.findFirst({
        include: {
          rows: {
            orderBy: { rowNumber: "asc" },
            where: { isValid: true }
          },
          trades: { select: { id: true } }
        },
        where: { id: batchId, userId }
      });
      if (batch === null) throw new NotFoundException("CSV import batch was not found");
      if (batch.status !== "CONFIRMED") {
        throw new BadRequestException("CSV import must be confirmed before grouping");
      }
      if (batch.groupedAt !== null) {
        return {
          alreadyGrouped: true,
          batchId,
          groupedAt: batch.groupedAt,
          tradeCount: batch.trades.length
        };
      }

      const executions = batch.rows.map((row) => {
        const parsed = normalizedCsvRowSchema.safeParse(row.normalizedData);
        if (!parsed.success) {
          throw new BadRequestException(`Normalized CSV row ${String(row.rowNumber)} is invalid`);
        }
        const { externalId, ...normalized } = parsed.data;
        return {
          ...normalized,
          ...(externalId === undefined ? {} : { externalId }),
          rowId: row.id,
          rowNumber: row.rowNumber
        };
      });
      const grouped = groupExecutions(executions);
      const priceScale =
        typeof batch.mappingOptions === "object" &&
        batch.mappingOptions !== null &&
        !Array.isArray(batch.mappingOptions) &&
        typeof (batch.mappingOptions as { priceScale?: unknown }).priceScale === "number"
          ? (batch.mappingOptions as { priceScale: number }).priceScale
          : 2;

      for (const group of grouped) {
        const firstExecution = group.executions[0];
        const lastExecution = group.executions.at(-1);
        if (firstExecution === undefined || lastExecution === undefined) {
          throw new BadRequestException("Grouped trade has no executions");
        }
        const calculation = calculateTrade(
          group.side,
          group.executions.map((execution) => ({
            action: execution.action,
            feesMinor: [execution.feeMinor],
            priceMinor: execution.priceMinor,
            quantity: execution.quantity
          }))
        );
        const instrument = await transaction.instrument.upsert({
          create: {
            currency: group.currency,
            market: group.market,
            priceScale,
            symbol: group.symbol
          },
          update: {},
          where: { market_symbol: { market: group.market, symbol: group.symbol } }
        });
        const trade = await transaction.trade.create({
          data: {
            closedAt: calculation.status === "CLOSED" ? new Date(lastExecution.executedAt) : null,
            currency: group.currency,
            entryPriceMinor: calculation.averageEntryPriceMinor,
            exitPriceMinor: calculation.averageExitPriceMinor,
            importBatchId: batch.id,
            instrumentId: instrument.id,
            market: group.market,
            openedAt: new Date(firstExecution.executedAt),
            quantity: calculation.openedQuantity,
            side: group.side,
            source: "CSV",
            status: calculation.status,
            symbol: group.symbol,
            tradingAccountId: batch.tradingAccountId,
            userId
          }
        });

        for (const [index, execution] of group.executions.entries()) {
          const created = await transaction.execution.create({
            data: {
              action: execution.action,
              executedAt: new Date(execution.executedAt),
              ...(execution.externalId === undefined ? {} : { externalId: execution.externalId }),
              priceMinor: execution.priceMinor,
              quantity: execution.quantity,
              sequence: index + 1,
              tradeId: trade.id
            }
          });
          if (execution.feeMinor > 0n) {
            await transaction.fee.create({
              data: {
                amountMinor: execution.feeMinor,
                currency: group.currency,
                executionId: created.id,
                tradeId: trade.id,
                type: "COMMISSION"
              }
            });
          }
          await transaction.csvImportExecutionSource.create({
            data: {
              allocatedFeeMinor: execution.feeMinor,
              allocatedQuantity: execution.quantity,
              csvImportRowId: execution.rowId,
              executionId: created.id
            }
          });
        }
      }

      const groupedAt = new Date();
      await transaction.csvImportBatch.update({
        data: { groupedAt },
        where: { id: batch.id }
      });
      return {
        alreadyGrouped: false,
        batchId,
        executionCount: grouped.reduce((sum, trade) => sum + trade.executions.length, 0),
        groupedAt,
        tradeCount: grouped.length
      };
    });
  }

  public async listTemplates(userId: string) {
    return this.prisma.csvMappingTemplate.findMany({
      orderBy: { updatedAt: "desc" },
      where: { userId }
    });
  }

  private async getOwnedBatch(userId: string, batchId: string) {
    const batch = await this.prisma.csvImportBatch.findFirst({
      select: { headers: true, status: true },
      where: { id: batchId, userId }
    });
    if (batch === null) throw new NotFoundException("CSV import batch was not found");
    if (batch.status === "CONFIRMED") {
      throw new ConflictException("A confirmed import cannot be remapped");
    }
    return batch;
  }

  private readHeaders(headers: unknown): string[] {
    return Array.isArray(headers)
      ? headers.filter((header): header is string => typeof header === "string")
      : [];
  }
}
