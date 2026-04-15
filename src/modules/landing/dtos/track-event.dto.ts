export interface TrackEventDto {
  type: string;
  payload?: Record<string, unknown> | undefined;
  occurredAt?: string | undefined;
}
