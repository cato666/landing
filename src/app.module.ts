import { Module } from '@nestjs/common';
import { LandingModule } from './modules/landing/landing.module';

@Module({
  imports: [LandingModule],
})
export class AppModule {}
