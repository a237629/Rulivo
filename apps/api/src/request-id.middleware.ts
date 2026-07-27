import { randomUUID } from "node:crypto";
import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { REQUEST_ID_HEADER, REQUEST_ID_PROPERTY, type RequestWithId } from "./request-context.js";

const MAX_REQUEST_ID_LENGTH = 128;

function selectRequestId(request: Request): string {
  const header = request.header(REQUEST_ID_HEADER);
  if (header === undefined) return randomUUID();
  const trimmed = header.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_REQUEST_ID_LENGTH ? trimmed : randomUUID();
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  public use(request: Request, response: Response, next: NextFunction): void {
    const requestId = selectRequestId(request);
    (request as RequestWithId)[REQUEST_ID_PROPERTY] = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  }
}
