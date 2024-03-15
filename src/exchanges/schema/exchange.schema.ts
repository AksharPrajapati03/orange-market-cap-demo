import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema()
export class Exchange extends Document {
  @Prop()
  name: string;

  @Prop()
  symbol: string;

  @Prop({ required: true, type: { name: String, slug: String } })
  exchange: Record<string, string>;

  @Prop()
  market_pair: string;

  @Prop()
  price: number;

  @Prop()
  depth_negative_two: number;

  @Prop()
  depth_positive_two: number;

  @Prop()
  volume_24h: number;

  @Prop()
  last_updated: string;

  @Prop()
  market_id: number;

  @Prop()
  category: string;

  @Prop()
  fee_type: string;

  @Prop()
  logo: string;
}
export const ExchangeSchema = SchemaFactory.createForClass(Exchange);
