import { Module } from '@nestjs/common';
import { KarateService } from './karate.service';
import { KarateController } from './karate.controller';

@Module({
  controllers: [KarateController],
  providers: [KarateService],
})
export class KarateModule {}
