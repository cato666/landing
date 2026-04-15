export interface RenderMetadata {
  renderId: string;
  token: string;
  templateCode: string;
  templateVersion: string;
  createdAt: string;
  status: 'generated';
  artifacts: {
    input: string;
    canonical: string;
    html: string;
    metadata: string;
    events: string;
    pdf: string | null;
  };
}

export interface LandingEvent {
  type: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}
