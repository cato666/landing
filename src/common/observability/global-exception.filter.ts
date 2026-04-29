import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RequestContextService } from './request-context.service';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly requestContext: RequestContextService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const correlationId = this.requestContext.getCorrelationId();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
    const message = exception instanceof Error ? exception.message : 'Internal server error';

    this.logger.error(
      JSON.stringify({
        event: 'http_error',
        correlationId,
        method: request.method,
        path: request.originalUrl,
        statusCode: status,
        message,
      }),
      exception instanceof Error ? exception.stack : undefined,
    );

    const baseBody = typeof exceptionResponse === 'object' && exceptionResponse !== null
      ? (exceptionResponse as Record<string, unknown>)
      : { message: exceptionResponse ?? message };

    response.status(status).json({
      ...baseBody,
      correlationId,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }
}