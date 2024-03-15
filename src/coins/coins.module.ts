import { Module, forwardRef } from '@nestjs/common';
import { CoinsService } from './coins.service';
import { CoinsController } from './coins.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Coin, CoinSchema } from './schema/coins.schema';
import { ChartService } from 'src/chart/chart.service';
import { ChartModule } from 'src/chart/chart.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Coin.name, schema: CoinSchema }]),
    forwardRef(() => ChartModule),
  ],
  providers: [CoinsService, ChartService],
  controllers: [CoinsController],
  exports: [MongooseModule, CoinsService],
})
export class CoinsModule {}
