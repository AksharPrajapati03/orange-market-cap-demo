import { Controller, Get, Query } from '@nestjs/common';
import { BlockCypherService } from './block-cypher.service';

@Controller('block-cypher')
export class BlockCypherController {
  constructor(private readonly blockCypherService: BlockCypherService) {}

  @Get('latest-transactions')
  async getData(@Query('limit') limit?: number): Promise<any> {
    return await this.blockCypherService.getBlockCypherData(limit);
  }
}
