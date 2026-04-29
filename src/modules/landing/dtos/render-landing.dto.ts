export interface RenderLandingDto {
  templateCode: string;
  templateVersion?: string | undefined;
  expiresAt?: string | undefined;
  data: Record<string, unknown>;
}
