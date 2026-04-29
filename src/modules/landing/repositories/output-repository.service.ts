import { Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import { resolveOutputsRoot } from '../../../common/config/path-config';
import { ArtifactStorageService } from '../../../common/storage/artifact-storage.service';
import { LandingArtifactRepository } from './landing-artifact.repository';
import { LandingEventRepository } from './landing-event.repository';
import { LandingMetadataRepository } from './landing-metadata.repository';
import { LandingEvent, RenderMetadata } from '../types/render-metadata.type';

@Injectable()
export class OutputRepositoryService implements LandingArtifactRepository, LandingMetadataRepository, LandingEventRepository {
  private readonly outputsRoot = resolveOutputsRoot();
  private readonly tokenIndexPath = path.join(this.outputsRoot, 'token-index.json');

  constructor(private readonly storageService: ArtifactStorageService) {}

  async persistRenderArtifacts(params: {
    renderId: string;
    input: Record<string, unknown>;
    canonical: object;
    html: string;
    metadata: RenderMetadata;
  }): Promise<void> {
    const renderDir = this.getRenderDir(params.renderId);
    await this.storageService.ensureDir(renderDir);

    await Promise.all([
      this.storageService.writeJson(path.join(renderDir, 'input.json'), params.input),
      this.storageService.writeJson(path.join(renderDir, 'canonical.json'), params.canonical),
      this.storageService.writeFile(path.join(renderDir, 'landing.html'), params.html, 'utf8'),
      this.storageService.writeJson(path.join(renderDir, 'metadata.json'), params.metadata),
      this.storageService.writeJson(path.join(renderDir, 'events.json'), []),
    ]);

    await this.updateTokenIndex(params.metadata.token, params.renderId);
  }

  async persistPdf(renderId: string, pdf: Buffer): Promise<string> {
    const pdfPath = path.join(this.getRenderDir(renderId), 'landing.pdf');
    await this.storageService.writeFile(pdfPath, pdf);

    const metadata = await this.readRequiredMetadataByRenderId(renderId);
    metadata.artifacts.pdf = `outputs/${renderId}/landing.pdf`;
    await this.storageService.writeJson(path.join(this.getRenderDir(renderId), 'metadata.json'), metadata);

    return pdfPath;
  }

  async readMetadataByToken(token: string): Promise<RenderMetadata> {
    await this.storageService.ensureDir(this.outputsRoot);
    const indexedRenderId = await this.readIndexedRenderId(token);

    if (indexedRenderId) {
      const indexedMetadata = await this.readMetadataByRenderId(indexedRenderId);
      if (indexedMetadata && indexedMetadata.token === token) {
        return indexedMetadata;
      }
    }

    const renderIds = await this.storageService.readdir(this.outputsRoot);

    for (const renderId of renderIds) {
      const metadata = await this.readMetadataByRenderId(renderId);
      if (!metadata) {
        continue;
      }

      if (metadata.token === token) {
        await this.updateTokenIndex(token, renderId);
        return metadata;
      }
    }

    throw new NotFoundException(`Token no encontrado: ${token}`);
  }

  async saveMetadata(metadata: RenderMetadata): Promise<void> {
    await this.storageService.writeJson(path.join(this.getRenderDir(metadata.renderId), 'metadata.json'), metadata);
    await this.updateTokenIndex(metadata.token, metadata.renderId);
  }

  async readLandingHtml(renderId: string): Promise<string> {
    const htmlPath = path.join(this.getRenderDir(renderId), 'landing.html');
    if (!(await this.storageService.pathExists(htmlPath))) {
      throw new NotFoundException(`Landing no encontrada para renderId ${renderId}`);
    }

    return this.storageService.readFile(htmlPath, 'utf8');
  }

  async readPdf(renderId: string): Promise<Buffer | null> {
    const pdfPath = path.join(this.getRenderDir(renderId), 'landing.pdf');
    if (!(await this.storageService.pathExists(pdfPath))) {
      return null;
    }

    return this.storageService.readBuffer(pdfPath);
  }

  async appendEvent(renderId: string, event: LandingEvent): Promise<LandingEvent[]> {
    const eventsPath = path.join(this.getRenderDir(renderId), 'events.json');
    const currentEvents = await this.storageService.readJson<LandingEvent[]>(eventsPath);
    currentEvents.push(event);
    await this.storageService.writeJson(eventsPath, currentEvents);
    return currentEvents;
  }

  private getRenderDir(renderId: string): string {
    return path.join(this.outputsRoot, renderId);
  }

  private async readMetadataByRenderId(renderId: string): Promise<RenderMetadata | null> {
    const metadataPath = path.join(this.getRenderDir(renderId), 'metadata.json');
    if (!(await this.storageService.pathExists(metadataPath))) {
      return null;
    }

    return this.storageService.readJson<RenderMetadata>(metadataPath);
  }

  private async readRequiredMetadataByRenderId(renderId: string): Promise<RenderMetadata> {
    const metadata = await this.readMetadataByRenderId(renderId);
    if (!metadata) {
      throw new NotFoundException(`Metadata no encontrada para renderId ${renderId}`);
    }

    return metadata;
  }

  private async readIndexedRenderId(token: string): Promise<string | null> {
    const index = await this.readTokenIndex();
    return index[token] ?? null;
  }

  private async updateTokenIndex(token: string, renderId: string): Promise<void> {
    const index = await this.readTokenIndex();
    index[token] = renderId;
    await this.storageService.writeJson(this.tokenIndexPath, index);
  }

  private async readTokenIndex(): Promise<Record<string, string>> {
    if (!(await this.storageService.pathExists(this.tokenIndexPath))) {
      return {};
    }

    const index = await this.storageService.readJson<unknown>(this.tokenIndexPath);
    if (!index || typeof index !== 'object' || Array.isArray(index)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(index as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string',
      ),
    );
  }
}
