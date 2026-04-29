import { Controller, Get, Header } from '@nestjs/common';
import { HealthService } from './health.service';
import { MetricsService } from '../observability/metrics.service';

@Controller()
export class HealthController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly healthService: HealthService,
  ) {}

  @Get('live')
  getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      metrics: this.metricsService.snapshot(),
    };
  }

  @Get('ready')
  async getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetrics(): string {
    return this.metricsService.toPrometheus();
  }
}