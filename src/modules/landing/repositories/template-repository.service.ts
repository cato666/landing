import { Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import { resolveTemplatesRoot } from '../../../common/config/path-config';
import { StorageService } from '../../../common/storage/storage.service';
import { ResolvedTemplate } from '../types/template.type';

@Injectable()
export class TemplateRepositoryService {
  private readonly templatesRoot = resolveTemplatesRoot();

  constructor(private readonly storageService: StorageService) {}

  async getTemplate(templateCode: string, templateVersion?: string): Promise<ResolvedTemplate> {
    const candidates = templateVersion
      ? [
          {
            path: path.join(this.templatesRoot, `${templateCode}.${templateVersion}.hbs`),
            version: templateVersion,
          },
          {
            path: path.join(this.templatesRoot, `${templateCode}.hbs`),
            version: templateVersion,
          },
        ]
      : [
          {
            path: path.join(this.templatesRoot, `${templateCode}.hbs`),
            version: 'v1',
          },
        ];

    for (const candidate of candidates) {
      if (await this.storageService.pathExists(candidate.path)) {
        return {
          code: templateCode,
          version: candidate.version,
          content: await this.storageService.readFile(candidate.path, 'utf8'),
        };
      }
    }

    throw new NotFoundException(
      `Template no encontrado para ${templateCode}${templateVersion ? ` version ${templateVersion}` : ''}`,
    );
  }
}
