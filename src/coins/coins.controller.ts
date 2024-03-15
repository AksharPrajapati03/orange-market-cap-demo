import { Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { CoinsService } from './coins.service';
import { Coin } from './schema/coins.schema';

@Controller('coins1')
export class CoinsController {
  constructor(private readonly coinService: CoinsService) {}

  @Get()
  async getData(
    @Query('tag') tag?: string,
    @Query('start') start?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('symbol') symbol?: string,
  ): Promise<Coin[]> {
    return await this.coinService.getData(tag, start, limit, search, symbol);
  }

  // @Post('postCoinMasterData')
  // async postData(): Promise<void> {
  //   return await this.coinService.postCoinMasterData();
  // }

  @Patch('updatecoins')
  async patchCoinData(): Promise<void> {
    return await this.coinService.updateCoins();
  }

  @Patch('updateOHLCData')
  async pathcData(): Promise<void> {
    return await this.coinService.updateOHLCData();
  }
}
