import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema()
export class Content extends Document {
  @Prop()
  post_id: string;

  @Prop()
  symbol: string;

  @Prop()
  slug: string;

  @Prop({ required: true, type: { nickname: String, avatar_url: String } })
  owner: Record<string, any>;

  @Prop()
  text_content: string;

  @Prop()
  photos: string[];

  @Prop()
  comment_count: number;

  @Prop()
  like_count: number;

  @Prop()
  post_time: string;

  @Prop()
  language_code: string;

  @Prop()
  post_type: string;
}
export const ContentSchema = SchemaFactory.createForClass(Content);
