export interface RenderLandingDto {
  templateCode: string;
  templateVersion?: string | undefined;
  data: Record<string, unknown>;
}
