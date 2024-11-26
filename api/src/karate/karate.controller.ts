import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { KarateService, KarateExecutionRequest, KarateExecutionResponse } from './karate.service';

@ApiTags('karate')
@Controller('karate')
export class KarateController {
  constructor(private readonly karateService: KarateService) {}

  @Get('versions')
  async getVersions() {
    return this.karateService.getVersions();
  }

  @Post('execute')
  @ApiOperation({ summary: 'Execute a Karate feature' })
  @ApiResponse({ status: 200, description: 'Feature executed successfully or failed with test failures' })
  async executeFeature(@Body() request: KarateExecutionRequest): Promise<KarateExecutionResponse> {
    return this.karateService.execute(request);
  }
}
