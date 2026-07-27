import type { Request } from "express";

export const REQUEST_ID_HEADER = "x-request-id";
export const REQUEST_ID_PROPERTY = "requestId";

export type RequestWithId = Request & {
  [REQUEST_ID_PROPERTY]: string;
};

export function getRequestId(request: Request): string {
  const candidate = (request as Partial<RequestWithId>)[REQUEST_ID_PROPERTY];
  return typeof candidate === "string" ? candidate : "unknown";
}
