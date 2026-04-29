export interface AnalyticsMetricTotal {
  metricName: string;
  total: number;
  buckets: number;
  lastBucketDate: string | null;
}

export interface AnalyticsMetricPoint {
  bucketDate: string;
  value: number;
}

export interface AnalyticsReportingStatus {
  enabled: boolean;
  backend: 'prisma' | 'noop';
}

export abstract class PublicationAnalyticsRepository {
  abstract recordPublicationAccess(params: {
    renderId: string;
    token: string;
    accessType: 'landing_view' | 'pdf_request' | 'tracking_event';
  }): Promise<void>;

  abstract incrementAggregateMetric(metricName: string, amount?: number): Promise<void>;

  abstract getReportingStatus(): Promise<AnalyticsReportingStatus>;

  abstract listMetricTotals(params: {
    from: Date;
    to: Date;
  }): Promise<AnalyticsMetricTotal[]>;

  abstract getMetricSeries(metricName: string, params: {
    from: Date;
    to: Date;
  }): Promise<AnalyticsMetricPoint[]>;
}
