import { Module } from '@nestjs/common';
import { BlockCypherController } from './block-cypher.controller';
import { BlockCypherService } from './block-cypher.service';

@Module({
  controllers: [BlockCypherController],
  providers: [BlockCypherService],
})
export class BlockCypherModule {}
