import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema()
export class Coin extends Document {
  @Prop()
  rank: number;

  @Prop()
  name: string;

  @Prop()
  icon_url: string;

  @Prop()
  price: number;

  @Prop()
  symbol: string;

  @Prop()
  slug: string;

  @Prop()
  num_market_pairs: number;

  @Prop()
  tags: string[];

  @Prop()
  max_supply: number;

  @Prop()
  circulating_supply: number;

  @Prop()
  total_supply: number;

  @Prop()
  percent_change_1h: string;

  @Prop()
  percent_change_24h: string;

  @Prop()
  percent_change_7d: string;

  @Prop()
  volume_24h: number;

  @Prop()
  volume_change_24h: string;

  @Prop()
  volume_24h_coin_value: number;

  @Prop()
  market_cap: number;

  @Prop()
  date_added: string;

  @Prop()
  day_open: number;

  @Prop()
  day_high: number;

  @Prop()
  day_low: number;

  @Prop()
  btc_price: number;

  @Prop()
  btc_percentage: number;

  @Prop()
  eth_price: number;

  @Prop()
  eth_percentage: number;

  @Prop()
  coin_description: string;

  @Prop()
  urls: [
    website: { type: [string]; default: [] },
    twitter: { type: [string]; default: [] },
    message_board: { type: [string]; default: [] },
    chat: { type: [string]; default: [] },
    facebook: { type: [string]; default: [] },
    explorer: { type: [string]; default: [] },
    reddit: { type: [string]; default: [] },
    technical_doc: { type: [string]; default: [] },
    source_code: { type: [string]; default: [] },
    announcement: { type: [string]; default: [] },
  ];

  @Prop()
  contracts: [
    {
      contract_address: { type: string };
      platform: {
        name: { type: string };
        coin: {
          id: { type: string };
          name: { type: string };
          symbol: { type: string };
          slug: { type: string };
        };
      };
    },
  ];
}
export const CoinSchema = SchemaFactory.createForClass(Coin);
