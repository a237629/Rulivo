import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter
} from "@nestjs/common";
import type { Request, Response } from "express";
import { getRequestId } from "./request-context.js";

export interface ApiErrorResponse {
  error: {
    code: string;
    details?: unknown;
    message: string;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
  success: false;
}

const statusCodes: Readonly<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: "BAD_REQUEST",
  [HttpStatus.UNAUTHORIZED]: "UNAUTHORIZED",
  [HttpStatus.FORBIDDEN]: "FORBIDDEN",
  [HttpStatus.NOT_FOUND]: "NOT_FOUND",
  [HttpStatus.CONFLICT]: "CONFLICT",
  [HttpStatus.TOO_MANY_REQUESTS]: "TOO_MANY_REQUESTS",
  [HttpStatus.SERVICE_UNAVAILABLE]: "SERVICE_UNAVAILABLE"
};

function exceptionMessage(exception: HttpException): { details?: unknown; message: string } {
  const response = exception.getResponse();
  if (typeof response === "string") return { message: response };
  const body = response as { message?: string | string[] };
  if (Array.isArray(body.message)) {
    return { details: body.message, message: "Request validation failed" };
  }
  return { message: body.message ?? exception.message };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const requestId = getRequestId(request);
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttpException
      ? exceptionMessage(exception)
      : { message: "An unexpected error occurred" };
    const body: ApiErrorResponse = {
      error: {
        code: statusCodes[status] ?? "INTERNAL_ERROR",
        ...message
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString()
      },
      success: false
    };

    if (!isHttpException) {
      this.logger.error({ exception, requestId });
    } else {
      this.logger.warn({
        method: request.method,
        path: request.originalUrl,
        requestId,
        statusCode: status
      });
    }
    response.status(status).json(body);
  }
}
