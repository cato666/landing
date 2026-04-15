import { Injectable } from '@nestjs/common';
import { OutputRepositoryService } from '../repositories/output-repository.service';

@Injectable()
export class PublicLandingService {
  constructor(private readonly outputRepository: OutputRepositoryService) {}

  async getLandingByToken(token: string): Promise<string> {
    const metadata = await this.outputRepository.readMetadataByToken(token);
    return this.outputRepository.readLandingHtml(metadata.renderId);
  }

  async getMetadataByToken(token: string) {
    return this.outputRepository.readMetadataByToken(token);
  }
}
