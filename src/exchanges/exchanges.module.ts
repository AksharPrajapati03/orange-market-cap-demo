import { Module } from '@nestjs/common';
import { ExchangesService } from './exchanges.service';
import { ExchangesController } from './exchanges.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Exchange, ExchangeSchema } from './schema/exchange.schema';
import { CoinsModule } from 'src/coins/coins.module';
import { ChartModule } from 'src/chart/chart.module';
import { CoinsService } from 'src/coins/coins.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exchange.name, schema: ExchangeSchema },
    ]),
    CoinsModule,
    ChartModule,
  ],
  providers: [ExchangesService, CoinsService],
  controllers: [ExchangesController],
})
export class ExchangesModule {}
