import { RenderMetadata } from '../types/render-metadata.type';

export abstract class LandingMetadataRepository {
  abstract readMetadataByToken(token: string): Promise<RenderMetadata>;
  abstract saveMetadata(metadata: RenderMetadata): Promise<void>;
}