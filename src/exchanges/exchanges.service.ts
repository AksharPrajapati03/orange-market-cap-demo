import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Exchange } from './schema/exchange.schema';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Coin } from 'src/coins/schema/coins.schema';

async function getMarketPairsData(symbol: string) {
  const response = await fetch(
    `https://pro-api.coinmarketcap.com/v2/cryptocurrency/market-pairs/latest?start=1&limit=200&symbol=${symbol}`,
    {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': process.env.X_CMC_PRO_API_KEY,
      },
    },
  );
  const responseData = await response.json();

  return responseData.data;
}

async function getMarketPairsMetaData(slug: string) {
  const response = await fetch(
    `https://pro-api.coinmarketcap.com/v1/exchange/info?slug=${slug}`,
    {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': process.env.X_CMC_PRO_API_KEY,
      },
    },
  );
  const responseData = await response.json();

  return responseData.data;
}

@Injectable()
export class ExchangesService {
  constructor(
    @InjectModel(Exchange.name) private readonly exchangeModel: Model<Exchange>,
    @InjectModel(Coin.name) private readonly coinModel: Model<Coin>,
  ) {}

  private apiCallCount = 0;
  private readonly MAX_API_CALLS_BEFORE_PAUSE = 10;
  private readonly PAUSE_DURATION_MS = 30000; // 40 seconds
  private Count = 0;

  async postExchangeMasterData(): Promise<void> {
    const allCoins = await this.coinModel.find().exec();

    for (const coin of allCoins) {
      const symbol = coin.symbol; // Adjust according to the actual structure

      try {
        await this.processCoin(symbol);
      } catch (error) {
        console.error(`Failed to process data for symbol ${symbol}: ${error}`);
      }
    }
  }

  private async processCoin(symbol: string): Promise<void> {
    const marketPairData = await this.rateLimitedApiCall(() =>
      getMarketPairsData(symbol),
    );

    for (const pairData of marketPairData) {
      for (const marketPair of pairData.market_pairs) {
        await this.processMarketPair(pairData, marketPair);
      }
    }
  }

  private async processMarketPair(
    pairData: any,
    marketPair: any,
  ): Promise<void> {
    const metaData = await this.rateLimitedApiCall(() =>
      getMarketPairsMetaData(marketPair.exchange.slug),
    );

    const document = {
      name: pairData?.name,
      symbol: pairData?.symbol,
      exchange: marketPair?.exchange,
      market_pair: marketPair.market_pair,
      price: marketPair.quote?.['USD']?.price,
      depth_negative_two: marketPair.quote?.['USD']?.depth_negative_two,
      depth_positive_two: marketPair.quote?.['USD']?.depth_positive_two,
      volume_24h: marketPair.quote?.['USD']?.volume_24h,
      last_updated: marketPair.quote?.['USD']?.last_updated,
      market_id: marketPair.market_id,
      category: marketPair.category,
      fee_type: marketPair.fee_type,
      logo: metaData?.[marketPair?.exchange.slug]?.logo,
    };

    await this.exchangeModel.findOneAndUpdate(
      { market_id: marketPair.market_id },
      document,
      {
        upsert: true,
        new: true,
      },
    );
  }

  private async rateLimitedApiCall(apiCall: () => Promise<any>): Promise<any> {
    if (this.apiCallCount >= this.MAX_API_CALLS_BEFORE_PAUSE) {
      console.log('Rate limit approached, pausing...', this.Count++);
      await new Promise((resolve) =>
        setTimeout(resolve, this.PAUSE_DURATION_MS),
      );
      this.apiCallCount = 0; // Reset the counter after waiting
    }

    this.apiCallCount++;
    return await apiCall();
  }

  async getData(
    start?: number,
    limit?: number,
    symbol?: string,
    category?: string,
  ): Promise<Exchange[]> {
    const query = { symbol };

    // If category is "perpetual", include it in the query
    if (category && category === 'perpetual') {
      query['category'] = 'derivatives';
    } else {
      if (category) {
        query['category'] = category;
      }
    }

    return await this.exchangeModel.find(query).skip(start).limit(limit).exec();
  }

  async getUniqueSymbols(): Promise<any> {
    const uniqueSymbols = await this.exchangeModel.aggregate([
      {
        $group: {
          _id: '$symbol', // Group by the symbol field
        },
      },
      {
        $project: {
          _id: 0, // Exclude the _id field from the results
          symbol: '$_id', // Set the unique symbol as the symbol field in the output
        },
      },
    ]);

    return uniqueSymbols;
  }

  private async updateMarketPair(symbol: string): Promise<void> {
    const marketPairData = await this.rateLimitedApiCall(() =>
      getMarketPairsData(symbol),
    );

    for (const pairData of marketPairData) {
      for (const marketPair of pairData.market_pairs) {
        const document = {
          price: marketPair.quote?.['USD']?.price,
          depth_negative_two: marketPair.quote?.['USD']?.depth_negative_two,
          depth_positive_two: marketPair.quote?.['USD']?.depth_positive_two,
          volume_24h: marketPair.quote?.['USD']?.volume_24h,
          last_updated: marketPair.quote?.['USD']?.last_updated,
        };

        await this.exchangeModel.findOneAndUpdate(
          { market_id: marketPair.market_id },
          document,
          {
            upsert: true,
            new: true,
          },
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async updateExchangeMasterData(): Promise<void> {
    const allCoins = await this.coinModel.find().exec();

    for (const coin of allCoins) {
      const symbol = coin.symbol; // Adjust according to the actual structure
      console.log('Content', symbol, coin.rank);

      try {
        await this.updateMarketPair(symbol);
      } catch (error) {
        console.error(`Failed to process data for symbol ${symbol}: ${error}`);
      }
    }
  }
}
