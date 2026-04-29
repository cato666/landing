import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/config/prisma.service';
import { LandingEventRepository } from './landing-event.repository';
import { LandingEvent } from '../types/render-metadata.type';

@Injectable()
export class PrismaLandingEventRepository implements LandingEventRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async appendEvent(renderId: string, event: LandingEvent): Promise<LandingEvent[]> {
    await this.prismaService.landingEvent.create({
      data: {
        renderId,
        type: event.type,
        occurredAt: new Date(event.occurredAt),
        payload: event.payload as Prisma.InputJsonValue,
      },
    });

    const events = await this.prismaService.landingEvent.findMany({
      where: { renderId },
      orderBy: { occurredAt: 'asc' },
    });

    return events.map((item) => ({
      type: item.type,
      occurredAt: item.occurredAt.toISOString(),
      payload: item.payload as Record<string, unknown>,
    }));
  }
}