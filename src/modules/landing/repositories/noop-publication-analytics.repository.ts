import { Injectable } from '@nestjs/common';
import { PublicationAnalyticsRepository } from './publication-analytics.repository';

@Injectable()
export class NoopPublicationAnalyticsRepository implements PublicationAnalyticsRepository {
  async recordPublicationAccess(): Promise<void> {
    return;
  }

  async incrementAggregateMetric(): Promise<void> {
    return;
  }

  async getReportingStatus() {
    return {
      enabled: false,
      backend: 'noop' as const,
    };
  }

  async listMetricTotals(): Promise<[]> {
    return [];
  }

  async getMetricSeries(): Promise<[]> {
    return [];
  }
}
