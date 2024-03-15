import { Controller, Delete, Get, Patch, Post, Query } from '@nestjs/common';
import { ChartService } from './chart.service';

@Controller('chart')
export class ChartController {
  constructor(private readonly chartService: ChartService) {}

  // @Post()
  // async postChartData(): Promise<any> {
  //   return await this.chartService.postChartData();
  // }

  @Get()
  async getData(
    @Query('slug') slug?: string,
    @Query('period') period?: string,
  ): Promise<any> {
    return await this.chartService.getChartData(slug, period);
  }

  // @Delete('delete')
  // async deleteData(): Promise<any> {
  //   return await this.chartService.bulkDeleteDocuments();
  // }

  @Patch('update')
  async updateData(): Promise<any> {
    return await this.chartService.handleDataAtMidnight();
  }
}
