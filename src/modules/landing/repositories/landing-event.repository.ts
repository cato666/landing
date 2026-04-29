import { LandingEvent } from '../types/render-metadata.type';

export abstract class LandingEventRepository {
  abstract appendEvent(renderId: string, event: LandingEvent): Promise<LandingEvent[]>;
}