import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor
} from "@nestjs/common";
import type { Request, Response } from "express";
import { map, tap, type Observable } from "rxjs";
import { getRequestId } from "./request-context.js";

export interface ApiSuccessResponse<T> {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
  success: true;
}

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  private readonly logger = new Logger("HTTP");

  public intercept(
    context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<ApiSuccessResponse<T>> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const requestId = getRequestId(request);
    const startedAt = performance.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log({
          durationMs: Math.round(performance.now() - startedAt),
          method: request.method,
          path: request.originalUrl,
          requestId,
          statusCode: response.statusCode
        });
      }),
      map((data) => ({
        data,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        },
        success: true as const
      }))
    );
  }
}
