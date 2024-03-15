import { Injectable } from '@nestjs/common';
import { Content } from './schema/content.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Coin } from 'src/coins/schema/coins.schema';

async function getContentLatestData(symbol: string) {
  const response = await fetch(
    `https://pro-api.coinmarketcap.com/v1/content/posts/latest?symbol=${symbol}`,
    {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': process.env.X_CMC_PRO_API_KEY,
      },
    },
  );
  const responseData = await response.json();
  return {
    data: responseData.data,
    type: 'latest',
  };
}

async function getContentTopData(symbol: string) {
  const response = await fetch(
    `https://pro-api.coinmarketcap.com/v1/content/posts/top?symbol=${symbol}`,
    {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': process.env.X_CMC_PRO_API_KEY,
      },
    },
  );
  const responseData = await response.json();

  return {
    data: responseData.data,
    type: 'top',
  };
}

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(Content.name) private readonly contentModel: Model<Content>,
    @InjectModel(Coin.name) private readonly coinModel: Model<Coin>,
  ) {}
  async postContentMasterData(): Promise<any> {
    const allCoins = await this.coinModel.find().exec();
    let apiCallCount = 0;

    for (const coin of allCoins) {
      const symbol = coin.symbol; // Adjust according to the actual structure

      try {
        const topPostData = await getContentTopData(symbol);
        apiCallCount++;

        const latestPostData = await getContentLatestData(symbol);
        apiCallCount++;

        topPostData.data.list.map(async (post: any) => {
          const document = {
            post_id: post.post_id,
            symbol: symbol,
            slug: coin.slug,
            owner: {
              nickname: post.owner.nickname,
              avatar_url: post.owner.avatar_url,
            },
            text_content: post.text_content,
            photos: post.photos,
            comment_count: parseInt(post.comment_count), // Ensure numeric value
            like_count: parseInt(post.like_count), // Ensure numeric value
            post_time: post.post_time,
            language_code: post.language_code,
            post_type: 'top', // or 'top', depending on your logic to differentiate
          };

          console.log(symbol, coin.rank, apiCallCount);

          await this.contentModel.findOneAndUpdate(
            { post_id: post.post_id },
            document,
            {
              upsert: true,
              new: true,
            },
          );
        });

        latestPostData.data.list.map(async (post: any) => {
          const document = {
            post_id: post.post_id,
            symbol: symbol,
            slug: coin.slug,
            owner: {
              nickname: post.owner.nickname,
              avatar_url: post.owner.avatar_url,
            },
            text_content: post.text_content,
            photos: post.photos,
            comment_count: parseInt(post.comment_count), // Ensure numeric value
            like_count: parseInt(post.like_count), // Ensure numeric value
            post_time: post.post_time,
            language_code: post.language_code,
            post_type: 'latest', // or 'top', depending on your logic to differentiate
          };

          await this.contentModel.findOneAndUpdate(
            { post_id: post.post_id },
            document,
            {
              upsert: true,
              new: true,
            },
          );
        });

        if (apiCallCount >= 56) {
          // Wait for the remainder of the minute before continuing
          console.log('Rate limit approached, pausing for 40 seconds...');
          await new Promise((resolve) => setTimeout(resolve, 40000)); // 60 seconds wait
          apiCallCount = 0; // Reset the counter after waiting
        }
      } catch (error) {
        console.error(`Failed to process data for symbol ${symbol}: ${error}`);
      }
    }
  }

  async getData(
    post_type?: string,
    symbol?: string,
    start?: number,
    limit?: number,
  ): Promise<Content[]> {
    return await this.contentModel
      .find({ post_type, symbol })
      .skip(start)
      .limit(limit)
      .exec();
  }

  @Cron(CronExpression.EVERY_3_HOURS)
  async updateContentMasterData(): Promise<any> {
    const allCoins = await this.coinModel.find().exec();
    let apiCallCount = 0;

    for (const coin of allCoins) {
      const symbol = coin.symbol; // Adjust according to the actual structure

      try {
        const topPostData = await getContentTopData(symbol);
        apiCallCount++;

        const latestPostData = await getContentLatestData(symbol);
        apiCallCount++;

        console.log('Content', symbol, coin.rank, apiCallCount);

        topPostData.data.list.map(async (post: any) => {
          const document = {
            post_id: post.post_id,
            symbol: symbol,
            slug: coin.slug,
            owner: {
              nickname: post.owner.nickname,
              avatar_url: post.owner.avatar_url,
            },
            text_content: post.text_content,
            photos: post.photos,
            comment_count: parseInt(post.comment_count), // Ensure numeric value
            like_count: parseInt(post.like_count), // Ensure numeric value
            post_time: post.post_time,
            language_code: post.language_code,
            post_type: 'top', // or 'top', depending on your logic to differentiate
          };

          await this.contentModel.findOneAndUpdate(
            { post_id: post.post_id },
            document,
            {
              upsert: true,
              new: true,
            },
          );
        });

        latestPostData.data.list.map(async (post: any) => {
          const document = {
            post_id: post.post_id,
            symbol: symbol,
            slug: coin.slug,
            owner: {
              nickname: post.owner.nickname,
              avatar_url: post.owner.avatar_url,
            },
            text_content: post.text_content,
            photos: post.photos,
            comment_count: parseInt(post.comment_count), // Ensure numeric value
            like_count: parseInt(post.like_count), // Ensure numeric value
            post_time: post.post_time,
            language_code: post.language_code,
            post_type: 'latest', // or 'top', depending on your logic to differentiate
          };

          await this.contentModel.findOneAndUpdate(
            { post_id: post.post_id },
            document,
            {
              upsert: true,
              new: true,
            },
          );
        });

        if (apiCallCount >= 16) {
          // Wait for the remainder of the minute before continuing
          console.log('Rate limit approached, pausing for 60 seconds...');
          await new Promise((resolve) => setTimeout(resolve, 60000)); // 60 seconds wait
          apiCallCount = 0; // Reset the counter after waiting
        }
      } catch (error) {
        console.error(`Failed to process data for symbol ${symbol}: ${error}`);
      }
    }
  }
}
