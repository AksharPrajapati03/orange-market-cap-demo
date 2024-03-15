import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CoinsModule } from './coins/coins.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ContentModule } from './content/content.module';
import { ExchangesModule } from './exchanges/exchanges.module';
import { ChartModule } from './chart/chart.module';
import { BlockCypherModule } from './block-cypher/block-cypher.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes environment variables globally available
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('MONGO_URI'),
        dbName: configService.get('DB_NAME'),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    CoinsModule,
    ContentModule,
    ExchangesModule,
    ChartModule,
    BlockCypherModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
