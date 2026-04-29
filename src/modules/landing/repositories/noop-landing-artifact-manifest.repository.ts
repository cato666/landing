import { Injectable } from '@nestjs/common';
import { LandingArtifactManifestRepository } from './landing-artifact-manifest.repository';
import { RenderMetadata } from '../types/render-metadata.type';

@Injectable()
export class NoopLandingArtifactManifestRepository implements LandingArtifactManifestRepository {
  async saveArtifactManifest(_metadata: RenderMetadata): Promise<void> {
    return;
  }
}