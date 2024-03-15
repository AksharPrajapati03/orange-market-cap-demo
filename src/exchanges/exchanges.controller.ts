import { Controller, Get, Post, Query, Patch } from '@nestjs/common';
import { ExchangesService } from './exchanges.service';
import { Exchange } from './schema/exchange.schema';

@Controller('exchanges')
export class ExchangesController {
  constructor(private readonly exchangeService: ExchangesService) {}

  @Get()
  async getData(
    @Query('start') start?: number,
    @Query('limit') limit?: number,
    @Query('symbol') symbol?: string,
    @Query('category') category?: string,
  ): Promise<Exchange[]> {
    return await this.exchangeService.getData(start, limit, symbol, category);
  }

  @Get('unique')
  async getUniqueSymbolData(): Promise<Exchange[]> {
    return await this.exchangeService.getUniqueSymbols();
  }

  // @Post('postExchangeMasterData')
  // async postExchangeData(): Promise<void> {
  //   return await this.exchangeService.postExchangeMasterData();
  // }

  @Patch('updateExchange')
  async patchExhangeData(): Promise<void> {
    return await this.exchangeService.updateExchangeMasterData();
  }
}
