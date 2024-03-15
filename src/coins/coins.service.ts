import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Coin } from './schema/coins.schema';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Chart } from 'src/chart/schema/chart.schema';

export async function getLatestListingData(id) {
  const response = await fetch(
    `https://pro-api.coinmarketcap.com/v1/cryptocurrency/category?id=${id}`,
    {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': process.env.X_CMC_PRO_API_KEY,
      },
    },
  );
  const responseData = await response.json();
  return responseData.data.coins;
}

async function getCoinMetaData(symbol: string) {
  const response = await fetch(
    `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?symbol=${symbol}`,
    {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': process.env.X_CMC_PRO_API_KEY,
      },
    },
  );
  const responseData = await response.json();
  return responseData;
}

async function getOHLCData(symbol: string) {
  const response = await fetch(
    `https://pro-api.coinmarketcap.com/v2/cryptocurrency/ohlcv/latest?symbol=${symbol}`,
    {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': process.env.X_CMC_PRO_API_KEY,
      },
    },
  );
  const responseData = await response.json();
  return responseData;
}

@Injectable()
export class CoinsService {
  constructor(
    @InjectModel(Coin.name) private readonly coinModel: Model<Coin>,
    @InjectModel(Chart.name) private readonly chartModel: Model<Chart>,
  ) {}

  async getData(
    tag?: string,
    start?: number,
    limit?: number,
    search?: string,
    symbol?: string,
  ): Promise<Coin[]> {
    const query: any = {};

    // Filter by tag if not 'all'
    if (tag && tag !== 'all') {
      query.tags = tag;
    }

    // Search by coin name if searchName is provided
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    if (symbol) {
      query.symbol = symbol;
    }
    return await this.coinModel
      .find(query)
      .sort({ rank: 1 })
      .where('rank')
      .ne(null)
      .skip(start)
      .limit(limit)
      .exec();
  }

  async postCoinMasterData(): Promise<any> {
    const BTCCoinData = await getLatestListingData('63feda8ad0a19758f3bde124');
    const BRC20CoinData = await getLatestListingData(
      '654a0c87ba37f269c8016129',
    );

    const allCoins = [...BTCCoinData, ...BRC20CoinData];

    let apiCallCount = 0;

    for (const coin of allCoins) {
      const symbol = coin.symbol; // Adjust according to the actual structure

      try {
        const metadata = await getCoinMetaData(symbol);
        apiCallCount++;

        const ohlc = await getOHLCData(symbol);
        apiCallCount++;

        // Use optional chaining and nullish coalescing to handle missing data more gracefully
        const coinData = {
          rank: coin?.cmc_rank,
          name: coin?.name,
          icon_url: metadata?.data[symbol]?.[0]?.logo ?? '',
          price: coin?.quote?.USD.price,
          symbol: coin?.symbol,
          slug: coin?.slug,
          num_market_pairs: coin?.num_market_pairs,
          tags: coin?.tags,
          max_supply: coin?.max_supply,
          circulating_supply: coin?.circulating_supply,
          total_supply: coin?.total_supply,
          percent_change_1h: coin?.quote?.USD.percent_change_1h ?? '',
          percent_change_24h: coin?.quote?.USD.percent_change_24h ?? '',
          percent_change_7d: coin?.quote?.USD.percent_change_7d ?? '',
          volume_24h: coin?.quote?.USD.volume_24h ?? 0,
          volume_change_24h: coin?.quote?.USD.volume_change_24h ?? '',
          volume_24h_coin_value:
            coin?.quote?.USD.price === null
              ? 0
              : coin?.quote?.USD.volume_24h / coin?.quote?.USD.price,
          market_cap: coin?.quote?.USD.market_cap,
          date_added: coin?.date_added,
          day_open: ohlc?.data[symbol]?.[0]?.quote?.USD?.open ?? '',
          day_high: ohlc?.data[symbol]?.[0]?.quote?.USD?.high ?? '',
          day_low: ohlc?.data[symbol]?.[0]?.quote?.USD?.low ?? '',
          btc_price: '',
          btc_percentage: '',
          eth_price: '',
          eth_percentage: '',
          coin_description: metadata?.data[symbol]?.[0]?.description ?? '',
          urls: metadata?.data[symbol]?.[0]?.urls ?? '',
          contracts: metadata?.data[symbol]?.[0]?.contract_address ?? '',
        };

        console.log(symbol, apiCallCount, coin.cmc_rank);

        // Update the database with the coin data, handling upserts gracefully
        await this.coinModel.findOneAndUpdate({ symbol }, coinData, {
          upsert: true,
          new: true,
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

  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateCoins(): Promise<void> {
    const BTCCoinData = await getLatestListingData('63feda8ad0a19758f3bde124');
    const BRC20CoinData = await getLatestListingData(
      '654a0c87ba37f269c8016129',
    );

    const allCoins = [...BTCCoinData, ...BRC20CoinData];

    for (const coin of allCoins) {
      const symbol = coin.symbol; // Adjust according to the actual structure
      const existingCoin = await this.coinModel.findOne({
        symbol: coin.symbol,
      });

      try {
        if (existingCoin) {
          const coinData = {
            rank: coin?.cmc_rank,
            price: coin?.quote?.USD.price,
            num_market_pairs: coin?.num_market_pairs,
            max_supply: coin?.max_supply,
            circulating_supply: coin?.circulating_supply,
            total_supply: coin?.total_supply,
            percent_change_1h: coin?.quote?.USD.percent_change_1h ?? '',
            percent_change_24h: coin?.quote?.USD.percent_change_24h ?? '',
            percent_change_7d: coin?.quote?.USD.percent_change_7d ?? '',
            volume_24h: coin?.quote?.USD.volume_24h ?? 0,
            volume_change_24h: coin?.quote?.USD.volume_change_24h ?? '',
            volume_24h_coin_value:
              coin?.quote?.USD.price === null
                ? 0
                : coin?.quote?.USD.volume_24h / coin?.quote?.USD.price,
            market_cap: coin?.quote?.USD.market_cap,
            btc_price: '',
            btc_percentage: '',
            eth_price: '',
            eth_percentage: '',
          };

          await this.coinModel.findOneAndUpdate({ symbol }, coinData, {
            upsert: true,
            new: true,
          });

          const chartCoinData = {
            symbol: symbol,
            slug: coin.slug,
            price: coin?.quote?.USD.price,
            volume_24h: coin?.quote?.USD.volume_24h ?? 0,
            market_cap: coin?.quote?.USD.market_cap,
            timestamp: new Date().toISOString(),
          };

          await this.chartModel.insertMany(chartCoinData);
        }
      } catch (error) {
        console.error(`Failed to process data for symbol ${symbol}: ${error}`);
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async updateOHLCData(): Promise<void> {
    const allCoins = await this.coinModel.find().exec();

    let apiCallCount = 0;

    for (const coin of allCoins) {
      const symbol = coin.symbol; // Adjust according to the actual structure

      try {
        const existingCoin = await this.coinModel.findOne({
          symbol: coin.symbol,
        });

        if (existingCoin) {
          const ohlc = await getOHLCData(symbol);
          apiCallCount++;

          const coinData = {
            day_open: ohlc?.data[symbol]?.[0]?.quote?.USD?.open ?? '',
            day_high: ohlc?.data[symbol]?.[0]?.quote?.USD?.high ?? '',
            day_low: ohlc?.data[symbol]?.[0]?.quote?.USD?.low ?? '',
          };

          console.log('OHLC', symbol, coin.rank, apiCallCount);

          // Update the database with the coin data, handling upserts gracefully
          await this.coinModel.findOneAndUpdate({ symbol }, coinData, {
            upsert: true,
            new: true,
          });

          if (apiCallCount >= 7) {
            // Wait for the remainder of the minute before continuing
            console.log('Rate limit approached, pausing for 60 seconds...');
            await new Promise((resolve) => setTimeout(resolve, 60000)); // 60 seconds wait
            apiCallCount = 0; // Reset the counter after waiting
          }
        }
      } catch (error) {
        console.error(`Failed to process data for symbol ${symbol}: ${error}`);
      }
    }
  }
}
