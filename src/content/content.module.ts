import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Content, ContentSchema } from './schema/content.schema';
import { CoinsModule } from 'src/coins/coins.module';
import { CoinsService } from 'src/coins/coins.service';
import { ChartModule } from 'src/chart/chart.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Content.name, schema: ContentSchema }]),
    CoinsModule,
    ChartModule,
  ],
  controllers: [ContentController],
  providers: [ContentService, CoinsService],
})
export class ContentModule {}
