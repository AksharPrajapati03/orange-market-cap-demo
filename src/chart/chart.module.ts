import { Module, forwardRef } from '@nestjs/common';
import { ChartService } from './chart.service';
import { ChartController } from './chart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Chart, ChartSchema } from './schema/chart.schema';
import { CoinsModule } from 'src/coins/coins.module';
import { CoinsService } from 'src/coins/coins.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chart.name, schema: ChartSchema }]),
    forwardRef(() => CoinsModule),
  ],
  providers: [ChartService, CoinsService],
  controllers: [ChartController],
  exports: [MongooseModule, ChartModule, ChartService],
})
export class ChartModule {}
