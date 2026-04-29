import { RenderMetadata } from '../types/render-metadata.type';

export abstract class LandingArtifactManifestRepository {
  abstract saveArtifactManifest(metadata: RenderMetadata): Promise<void>;
}