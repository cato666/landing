import { BadRequestException, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { RenderBatchDto } from '../dtos/render-batch.dto';
import { RenderLandingDto } from '../dtos/render-landing.dto';
import { TrackEventDto } from '../dtos/track-event.dto';

const renderLandingSchema = z.object({
  templateCode: z.string().min(1),
  templateVersion: z.string().min(1).optional(),
  data: z.record(z.string(), z.unknown()),
});

const renderBatchSchema = z.object({
  items: z.array(renderLandingSchema).min(1),
});

const trackEventSchema = z.object({
  type: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.string().datetime().optional(),
});

@Injectable()
export class JsonValidationService {
  validateRenderRequest(input: unknown): RenderLandingDto {
    const parsed = renderLandingSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Render request invalido',
        issues: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }

  validateRenderBatchRequest(input: unknown): RenderBatchDto {
    const parsed = renderBatchSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Render batch request invalido',
        issues: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }

  validateTrackEventRequest(input: unknown): TrackEventDto {
    const parsed = trackEventSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Evento invalido',
        issues: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }
}
