import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import { LandingEvent, RenderMetadata } from '../types/render-metadata.type';

@Injectable()
export class OutputRepositoryService {
  private readonly outputsRoot = path.resolve(process.cwd(), 'outputs');

  async persistRenderArtifacts(params: {
    renderId: string;
    input: Record<string, unknown>;
    canonical: object;
    html: string;
    metadata: RenderMetadata;
  }): Promise<void> {
    const renderDir = this.getRenderDir(params.renderId);
    await fs.ensureDir(renderDir);

    await Promise.all([
      fs.writeJson(path.join(renderDir, 'input.json'), params.input, { spaces: 2 }),
      fs.writeJson(path.join(renderDir, 'canonical.json'), params.canonical, { spaces: 2 }),
      fs.writeFile(path.join(renderDir, 'landing.html'), params.html, 'utf8'),
      fs.writeJson(path.join(renderDir, 'metadata.json'), params.metadata, { spaces: 2 }),
      fs.writeJson(path.join(renderDir, 'events.json'), [], { spaces: 2 }),
    ]);
  }

  async readMetadataByToken(token: string): Promise<RenderMetadata> {
    await fs.ensureDir(this.outputsRoot);
    const renderIds = await fs.readdir(this.outputsRoot);

    for (const renderId of renderIds) {
      const metadataPath = path.join(this.outputsRoot, renderId, 'metadata.json');
      if (!(await fs.pathExists(metadataPath))) {
        continue;
      }

      const metadata = await fs.readJson(metadataPath) as RenderMetadata;
      if (metadata.token === token) {
        return metadata;
      }
    }

    throw new NotFoundException(`Token no encontrado: ${token}`);
  }

  async readLandingHtml(renderId: string): Promise<string> {
    const htmlPath = path.join(this.getRenderDir(renderId), 'landing.html');
    if (!(await fs.pathExists(htmlPath))) {
      throw new NotFoundException(`Landing no encontrada para renderId ${renderId}`);
    }

    return fs.readFile(htmlPath, 'utf8');
  }

  async appendEvent(renderId: string, event: LandingEvent): Promise<LandingEvent[]> {
    const eventsPath = path.join(this.getRenderDir(renderId), 'events.json');
    const currentEvents = (await fs.readJson(eventsPath)) as LandingEvent[];
    currentEvents.push(event);
    await fs.writeJson(eventsPath, currentEvents, { spaces: 2 });
    return currentEvents;
  }

  private getRenderDir(renderId: string): string {
    return path.join(this.outputsRoot, renderId);
  }
}
