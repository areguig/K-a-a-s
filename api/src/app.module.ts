import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KarateModule } from './karate/karate.module';

@Module({
  imports: [KarateModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
