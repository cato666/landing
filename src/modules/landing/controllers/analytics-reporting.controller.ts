import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsReportingService } from '../services/analytics-reporting.service';

@Controller('analytics')
export class AnalyticsReportingController {
  constructor(private readonly analyticsReportingService: AnalyticsReportingService) {}

  @Get('metrics')
  getMetricTotals(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsReportingService.getMetricTotals(this.buildRangeQuery(from, to));
  }

  @Get('metrics/:metricName')
  getMetricSeries(
    @Param('metricName') metricName: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsReportingService.getMetricSeries(metricName, this.buildRangeQuery(from, to));
  }

  private buildRangeQuery(from?: string, to?: string): { from?: string; to?: string } {
    const query: { from?: string; to?: string } = {};

    if (from !== undefined) {
      query.from = from;
    }

    if (to !== undefined) {
      query.to = to;
    }

    return query;
  }
}