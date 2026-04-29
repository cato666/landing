import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/config/prisma.service';
import {
  AnalyticsMetricPoint,
  AnalyticsMetricTotal,
  PublicationAnalyticsRepository,
} from './publication-analytics.repository';

function getMetricBucketDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getMetricKey(metricName: string): string {
  return `${metricName}:${getMetricBucketDate()}`;
}

@Injectable()
export class PrismaPublicationAnalyticsRepository implements PublicationAnalyticsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async recordPublicationAccess(params: {
    renderId: string;
    token: string;
    accessType: 'landing_view' | 'pdf_request' | 'tracking_event';
  }): Promise<void> {
    await this.prismaService.landingPublicationAccess.create({
      data: {
        renderId: params.renderId,
        token: params.token,
        accessType: params.accessType,
        occurredAt: new Date(),
      },
    });
  }

  async incrementAggregateMetric(metricName: string, amount = 1): Promise<void> {
    const bucketDate = getMetricBucketDate();
    await this.prismaService.landingMetricAggregate.upsert({
      where: { key: getMetricKey(metricName) },
      update: {
        value: {
          increment: amount,
        },
      },
      create: {
        key: getMetricKey(metricName),
        metricName,
        bucketDate: new Date(`${bucketDate}T00:00:00.000Z`),
        value: amount,
      },
    });
  }

  async getReportingStatus() {
    return {
      enabled: true,
      backend: 'prisma' as const,
    };
  }

  async listMetricTotals(params: { from: Date; to: Date }): Promise<AnalyticsMetricTotal[]> {
    const rows = await this.prismaService.landingMetricAggregate.findMany({
      where: {
        bucketDate: {
          gte: params.from,
          lte: params.to,
        },
      },
      orderBy: [
        { metricName: 'asc' },
        { bucketDate: 'asc' },
      ],
    });

    const grouped = new Map<string, AnalyticsMetricTotal>();

    for (const row of rows) {
      const bucketDate = row.bucketDate.toISOString().slice(0, 10);
      const current = grouped.get(row.metricName);

      if (!current) {
        grouped.set(row.metricName, {
          metricName: row.metricName,
          total: row.value,
          buckets: 1,
          lastBucketDate: bucketDate,
        });
        continue;
      }

      current.total += row.value;
      current.buckets += 1;
      current.lastBucketDate = bucketDate;
    }

    return Array.from(grouped.values());
  }

  async getMetricSeries(metricName: string, params: { from: Date; to: Date }): Promise<AnalyticsMetricPoint[]> {
    const rows = await this.prismaService.landingMetricAggregate.findMany({
      where: {
        metricName,
        bucketDate: {
          gte: params.from,
          lte: params.to,
        },
      },
      orderBy: {
        bucketDate: 'asc',
      },
    });

    return rows.map((row) => ({
      bucketDate: row.bucketDate.toISOString().slice(0, 10),
      value: row.value,
    }));
  }
}
