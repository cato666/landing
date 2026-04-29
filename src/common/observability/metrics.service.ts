import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private readonly counters = {
    renderRequests: 0,
    publicLandingViews: 0,
    trackingEvents: 0,
    pdfRequests: 0,
  };

  incrementRenderRequests(): void {
    this.counters.renderRequests += 1;
  }

  incrementPublicLandingViews(): void {
    this.counters.publicLandingViews += 1;
  }

  incrementTrackingEvents(): void {
    this.counters.trackingEvents += 1;
  }

  incrementPdfRequests(): void {
    this.counters.pdfRequests += 1;
  }

  snapshot() {
    return { ...this.counters };
  }

  toPrometheus(): string {
    return [
      '# HELP porto_render_requests_total Total render requests processed',
      '# TYPE porto_render_requests_total counter',
      `porto_render_requests_total ${this.counters.renderRequests}`,
      '# HELP porto_public_landing_views_total Total public landing views',
      '# TYPE porto_public_landing_views_total counter',
      `porto_public_landing_views_total ${this.counters.publicLandingViews}`,
      '# HELP porto_tracking_events_total Total tracking events persisted',
      '# TYPE porto_tracking_events_total counter',
      `porto_tracking_events_total ${this.counters.trackingEvents}`,
      '# HELP porto_pdf_requests_total Total PDF requests served',
      '# TYPE porto_pdf_requests_total counter',
      `porto_pdf_requests_total ${this.counters.pdfRequests}`,
    ].join('\n');
  }
}