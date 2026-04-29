import { BadRequestException, Injectable } from '@nestjs/common';
import { PublicationAnalyticsRepository } from '../repositories/publication-analytics.repository';

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

@Injectable()
export class AnalyticsReportingService {
  constructor(private readonly analyticsRepository: PublicationAnalyticsRepository) {}

  async getMetricTotals(query?: { from?: string; to?: string }) {
    const range = this.resolveRange(query);
    const status = await this.analyticsRepository.getReportingStatus();
    const items = await this.analyticsRepository.listMetricTotals(range);

    return {
      enabled: status.enabled,
      backend: status.backend,
      from: toIsoDate(range.from),
      to: toIsoDate(range.to),
      items,
    };
  }

  async getMetricSeries(metricName: string, query?: { from?: string; to?: string }) {
    const normalizedMetricName = metricName.trim();
    if (!normalizedMetricName) {
      throw new BadRequestException('metricName es obligatorio');
    }

    const range = this.resolveRange(query);
    const status = await this.analyticsRepository.getReportingStatus();
    const points = await this.analyticsRepository.getMetricSeries(normalizedMetricName, range);

    return {
      enabled: status.enabled,
      backend: status.backend,
      metricName: normalizedMetricName,
      from: toIsoDate(range.from),
      to: toIsoDate(range.to),
      points,
    };
  }

  private resolveRange(query?: { from?: string; to?: string }) {
    const today = startOfUtcDay(new Date());
    const defaultFrom = new Date(today);
    defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 29);

    const from = query?.from ? this.parseDate(query.from, 'from') : defaultFrom;
    const to = query?.to ? this.parseDate(query.to, 'to') : today;

    if (from.getTime() > to.getTime()) {
      throw new BadRequestException('from no puede ser mayor que to');
    }

    return { from, to };
  }

  private parseDate(value: string, fieldName: 'from' | 'to'): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName} debe ser una fecha ISO valida`);
    }

    return startOfUtcDay(parsed);
  }
}