import { BadRequestException, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { RenderBatchDto } from '../dtos/render-batch.dto';
import { RenderLandingDto } from '../dtos/render-landing.dto';
import { TrackEventDto } from '../dtos/track-event.dto';

type ValidationSchema = z.ZodType<unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getNestedRecord(data: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = data[key];
  return isRecord(value) ? value : {};
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : typeof value === 'number';
}

function isValidDateString(value: unknown): boolean {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

function hasUsefulCoverageItems(data: Record<string, unknown>): boolean {
  const coberturas = data.coberturas;
  if (!Array.isArray(coberturas)) {
    return false;
  }

  return coberturas.some((item) => {
    if (!isRecord(item)) {
      return false;
    }

    return hasNonEmptyString(item.titulo ?? item.nombre);
  });
}

function hasUsefulPaymentItems(data: Record<string, unknown>): boolean {
  const pagos = getNestedRecord(data, 'pagos');
  const cuotas = pagos.cuotas ?? pagos.parcelas;
  if (!Array.isArray(cuotas)) {
    return false;
  }

  return cuotas.some((item) => {
    if (!isRecord(item)) {
      return false;
    }

    return hasNonEmptyString(item.vencimiento ?? item.fecha) || item.valor !== undefined || item.monto !== undefined;
  });
}

const renderLandingSchema = z.object({
  templateCode: z.string().min(1),
  templateVersion: z.string().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
  data: z.record(z.string(), z.unknown()).superRefine((data, ctx) => {
    const cliente = getNestedRecord(data, 'cliente');
    const poliza = getNestedRecord(data, 'poliza');
    const vehiculo = getNestedRecord(data, 'vehiculo');

    if (!hasNonEmptyString(cliente.nome)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'cliente.nome es obligatorio',
        path: ['cliente', 'nome'],
      });
    }

    if (!hasNonEmptyString(poliza.numero)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'poliza.numero es obligatorio',
        path: ['poliza', 'numero'],
      });
    }

    if (!isValidDateString(poliza.vigenciaDesde ?? poliza.vigencia_inicio)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'poliza.vigenciaDesde debe ser una fecha valida',
        path: ['poliza', 'vigenciaDesde'],
      });
    }

    if (!isValidDateString(poliza.vigenciaHasta ?? poliza.vigencia_fin)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'poliza.vigenciaHasta debe ser una fecha valida',
        path: ['poliza', 'vigenciaHasta'],
      });
    }

    if (!hasNonEmptyString(vehiculo.modelo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'vehiculo.modelo es obligatorio',
        path: ['vehiculo', 'modelo'],
      });
    }

    if (!hasNonEmptyString(vehiculo.patente ?? vehiculo.placa)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'vehiculo.patente o vehiculo.placa es obligatorio',
        path: ['vehiculo', 'patente'],
      });
    }

    if (!hasUsefulCoverageItems(data) && !hasUsefulPaymentItems(data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe existir al menos una cobertura o una cuota de pago util',
        path: ['data'],
      });
    }
  }),
}).superRefine((input, ctx) => {
  if (!input.expiresAt) {
    return;
  }

  const expiresAt = new Date(input.expiresAt);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'expiresAt debe ser una fecha futura valida',
      path: ['expiresAt'],
    });
  }
});

const renderBatchSchema = z.object({
  items: z.array(renderLandingSchema).min(1),
});

const trackEventSchema = z.object({
  type: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.string().datetime().optional(),
});

function formatIssuePath(path: PropertyKey[]): string {
  return path.length > 0 ? path.join('.') : 'root';
}

function buildValidationPayload(message: string, error: z.ZodError) {
  const issues = error.issues.map((issue) => ({
    path: formatIssuePath(issue.path),
    message: issue.message,
    code: issue.code,
  }));

  return {
    message,
    issues,
    invalidFields: [...new Set(issues.map((issue) => issue.path))],
  };
}

@Injectable()
export class JsonValidationService {
  validateRenderRequest(input: unknown): RenderLandingDto {
    return this.parseOrThrow<RenderLandingDto>(renderLandingSchema, input, 'Render request invalido');
  }

  validateRenderBatchRequest(input: unknown): RenderBatchDto {
    return this.parseOrThrow<RenderBatchDto>(renderBatchSchema, input, 'Render batch request invalido');
  }

  validateTrackEventRequest(input: unknown): TrackEventDto {
    return this.parseOrThrow<TrackEventDto>(trackEventSchema, input, 'Evento invalido');
  }

  private parseOrThrow<T>(schema: ValidationSchema, input: unknown, message: string): T {
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException(buildValidationPayload(message, parsed.error));
    }

    return parsed.data as T;
  }
}
