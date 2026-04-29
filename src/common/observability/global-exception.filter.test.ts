import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { RequestContextService } from './request-context.service';

test('GlobalExceptionFilter agrega correlationId al body de error', () => {
  const requestContext = new RequestContextService();
  const filter = new GlobalExceptionFilter(requestContext);
  let statusCode = 0;
  let responseBody: any = null;

  requestContext.run({ correlationId: 'corr-1' }, () => {
    filter.catch(
      new BadRequestException({ message: 'Render request invalido' }),
      {
        switchToHttp: () => ({
          getRequest: () => ({ method: 'POST', originalUrl: '/api/v1/landings/render' }),
          getResponse: () => ({
            status: (value: number) => {
              statusCode = value;
              return {
                json: (payload: Record<string, unknown>) => {
                  responseBody = payload;
                },
              };
            },
          }),
        }),
      } as never,
    );
  });

  assert.equal(statusCode, 400);
  assert.ok(responseBody);
  assert.equal(responseBody.correlationId, 'corr-1');
  assert.equal(responseBody.path, '/api/v1/landings/render');
});