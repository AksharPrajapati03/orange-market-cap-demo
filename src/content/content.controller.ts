import { Controller, Get, Post, Query, Patch } from '@nestjs/common';
import { ContentService } from './content.service';
import { Content } from './schema/content.schema';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  async getData(
    @Query('post_type') post_type?: string,
    @Query('symbol') symbol?: string,
    @Query('start') start?: number,
    @Query('limit') limit?: number,
  ): Promise<Content[]> {
    return await this.contentService.getData(post_type, symbol, start, limit);
  }

  // @Post('postContentMasterData')
  // async postContentData(): Promise<void> {
  //   return await this.contentService.postContentMasterData();
  // }

  @Patch('updatecontent')
  async patchCoinData(): Promise<void> {
    return await this.contentService.updateContentMasterData();
  }
}
