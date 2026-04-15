import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ResolvedTemplate } from '../types/template.type';

@Injectable()
export class TemplateRepositoryService {
  private readonly templatesRoot = path.resolve(process.cwd(), 'templates');

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
      if (await fs.pathExists(candidate.path)) {
        return {
          code: templateCode,
          version: candidate.version,
          content: await fs.readFile(candidate.path, 'utf8'),
        };
      }
    }

    throw new NotFoundException(
      `Template no encontrado para ${templateCode}${templateVersion ? ` version ${templateVersion}` : ''}`,
    );
  }
}
