import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema()
export class Chart extends Document {
  @Prop()
  symbol: string;

  @Prop()
  slug: string;

  @Prop()
  price: number;

  @Prop()
  volume_24h: number;

  @Prop()
  market_cap: number;

  @Prop()
  timestamp: Date;
}
export const ChartSchema = SchemaFactory.createForClass(Chart);
