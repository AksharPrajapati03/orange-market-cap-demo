import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Chart } from './schema/chart.schema';
import { Model } from 'mongoose';
import * as moment from 'moment';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Coin } from 'src/coins/schema/coins.schema';

export async function getHistoricalQuoteData(
  symbol,
  start_time,
  end_time,
  period,
) {
  const response = await fetch(
    `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/historical?count=10000&symbol=${symbol}&time_start=${start_time}&time_end=${end_time}&interval=${period}`,
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
export class ChartService {
  constructor(
    @InjectModel(Chart.name) private readonly chartModel: Model<Chart>,
    @InjectModel(Coin.name) private readonly coinModel: Model<Coin>,
  ) {}

  async postChartData(): Promise<void> {
    const allCoins = await this.coinModel.find().exec();

    let apiCallCount = 0;

    const startDate = '2024-02-15T00:00:00.000Z';
    const endDate = '2024-02-20T23:59:59.000Z';

    const interval = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds

    const currentStartDate = new Date(startDate);

    while (currentStartDate.getTime() <= new Date(endDate).getTime()) {
      const currentEndDate = new Date(
        currentStartDate.getTime() + interval - 1,
      );
      if (currentEndDate.getTime() > new Date(endDate).getTime()) {
        currentEndDate.setTime(new Date(endDate).getTime() + 1); // Ensure the last interval ends at the end date
      }

      console.log(currentStartDate.toISOString(), currentEndDate.toISOString());

      for (const coin of allCoins) {
        const symbol = coin.symbol; // Adjust according to the actual structure

        try {
          if (apiCallCount >= 25) {
            console.log('Rate limit approached, pausing for 80 seconds...');
            await new Promise((resolve) => setTimeout(resolve, 80000)); // 80 seconds wait
            apiCallCount = 0; // Reset the counter after waiting
          }
          const allCoinsData = await getHistoricalQuoteData(
            symbol,
            currentStartDate.toISOString(),
            currentEndDate.toISOString(),
            '1h',
          );
          apiCallCount++;
          console.log(symbol, coin.rank, apiCallCount);
          if (
            !allCoinsData ||
            !allCoinsData[symbol] ||
            !allCoinsData[symbol][0]
          ) {
            console.error(`No data found for symbol ${symbol}`);
            continue; // Skip to the next coin
          }
          const data = allCoinsData[symbol][0].quotes.map((item) => ({
            symbol: symbol,
            slug: coin.slug,
            timestamp: item.timestamp,
            price: item?.quote?.USD?.price,
            volume_24h: item?.quote?.USD?.volume_24h,
            market_cap: item?.quote?.USD?.market_cap,
          }));
          await this.chartModel.insertMany(data);
        } catch (error) {
          console.error(
            `Failed to process data for symbol ${symbol}: ${error}`,
          );
        }
      }

      // Move to the next interval
      currentStartDate.setTime(currentEndDate.getTime() + 1); // Move to the next day
    }
  }

  async getChartData(slug: string, period: string): Promise<any> {
    const { startDate, endDate } = this.getDateRange(period);

    const rawData = await this.chartModel
      .find({
        slug,
        timestamp: {
          $gte: startDate.toISOString().split('T')[0] + 'T00:00:00.000Z',
          $lte: endDate,
        },
      })
      .sort({ timestamp: 1 })
      .exec();

    return this.aggregateData(rawData, period);
  }

  private getDateRange(timeRange: string): { startDate: Date; endDate: Date } {
    const baseDate = moment.utc(); // February 19th of the current year, months are 0-indexed
    let startDate: moment.Moment;
    const endDate = baseDate.clone().endOf('day'); // Using February 17th as the end date

    switch (timeRange) {
      case '7D':
        startDate = baseDate.clone().subtract(7, 'days');
        break;
      case '1M':
        startDate = baseDate.clone().subtract(1, 'months');
        break;
      case '3M':
        startDate = baseDate.clone().subtract(3, 'months');
        break;
      case '1D':
        startDate = baseDate.clone();
        break;
      default:
        // Handle default case or throw an error
        startDate = baseDate; // This would effectively make the range just the day of February 17th
        break;
    }

    return { startDate: startDate.toDate(), endDate: endDate.toDate() };
  }

  private aggregateData(data: any[], period: string): any[] {
    switch (period) {
      case '7D':
        return this.aggregateByHour(data, 1);
      case '1M':
      case '3M':
        return this.aggregateByDay(data, 7);
      default:
        return data;
    }
  }

  private aggregateByHour(data: any[], daysBack: number): any[] {
    return this.aggregate(
      data,
      daysBack,
      'hour',
      'YYYY-MM-DDTHH',
      ':00:00.000Z',
    );
  }

  private aggregateByDay(data: any[], daysBack: number): any[] {
    return this.aggregate(
      data,
      daysBack,
      'day',
      'YYYY-MM-DD',
      'T00:00:00.000Z',
    );
  }

  private aggregate(
    data: any[],
    daysBack: number,
    unit: moment.unitOfTime.StartOf,
    format: string,
    timestampSuffix: string,
  ): any[] {
    const startOfPeriod = moment.utc().subtract(daysBack, 'days').startOf(unit);
    const relevantData = data.filter((d) =>
      moment.utc(d.timestamp).isSameOrAfter(startOfPeriod),
    );
    const aggregatedData = {};

    relevantData.forEach((item) => {
      const key = moment.utc(item.timestamp).format(format);
      if (!aggregatedData[key]) {
        aggregatedData[key] = { ...item, count: 1 };
      } else {
        aggregatedData[key].price += item.price;
        aggregatedData[key].count += 1;
      }
    });

    const aggregatedArray = Object.entries(aggregatedData).map(
      ([key, value]: any) => ({
        ...value,
        price: value.price / value.count,
        timestamp: `${key}${timestampSuffix}`,
        count: undefined,
      }),
    );

    const previousData = data.filter((d) =>
      moment.utc(d.timestamp).isBefore(startOfPeriod),
    );
    return [...previousData, ...aggregatedArray].map(
      this.mapFinalDataStructure,
    );
  }

  private mapFinalDataStructure(item: any) {
    return {
      _id: item._id || item['_doc']?._id,
      symbol: item.symbol || item['_doc']?.symbol,
      slug: item.slug || item['_doc']?.slug,
      price: item.price || item['_doc']?.price,
      volume_24h: item.volume_24h || item['_doc']?.volume_24h,
      market_cap: item.market_cap || item['_doc']?.market_cap,
      timestamp: item.timestamp || item['_doc']?.timestamp,
    };
  }

  async bulkDeleteDocuments(): Promise<number> {
    try {
      const result = await this.chartModel
        .deleteMany({
          timestamp: {
            $gte: '2024-02-15T00:00:00.000Z',
            $lte: '2024-02-20T23:59:59.000Z',
          },
        })
        .exec();
      return result.deletedCount;
    } catch (error) {
      throw error;
    }
  }

  async getChartCronData(currentStartDate, currentEndDate, period) {
    let apiCallCount = 0;
    const allCoins = await this.coinModel.find().exec();

    for (const coin of allCoins) {
      const symbol = coin.symbol; // Adjust according to the actual structure

      try {
        if (apiCallCount >= 16) {
          console.log('Rate limit approached, pausing for 80 seconds...');
          await new Promise((resolve) => setTimeout(resolve, 80000)); // 80 seconds wait
          apiCallCount = 0; // Reset the counter after waiting
        }

        const allCoinsData = await getHistoricalQuoteData(
          symbol,
          currentStartDate.toISOString(),
          currentEndDate.toISOString(),
          period,
        );

        apiCallCount++;
        console.log('CHART', symbol, coin.rank, apiCallCount);
        if (
          !allCoinsData ||
          !allCoinsData[symbol] ||
          !allCoinsData[symbol][0]
        ) {
          console.error(`No data found for symbol ${symbol}`);
          continue; // Skip to the next coin
        } else {
          const data = allCoinsData[symbol][0].quotes.map((item) => ({
            symbol: symbol,
            slug: coin.slug,
            timestamp: item.timestamp,
            price: item?.quote?.USD?.price,
            volume_24h: item?.quote?.USD?.volume_24h,
            market_cap: item?.quote?.USD?.market_cap,
          }));

          data && (await this.chartModel.insertMany(data));
        }
      } catch (error) {
        console.error(`Failed to process data for symbol ${symbol}: ${error}`);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDataAtMidnight() {
    const previousDayStart = moment
      .utc()
      .subtract(1, 'days')
      .startOf('day')
      .toDate();

    const previousDayEnd = moment
      .utc()
      .subtract(1, 'days')
      .endOf('day')
      .toDate();

    console.log(previousDayStart, previousDayEnd);

    // Remove the previous day's data from MongoDB collection
    await this.chartModel.deleteMany({
      timestamp: { $gte: previousDayStart, $lte: previousDayEnd },
    });

    await this.getChartCronData(previousDayStart, previousDayEnd, '1h');

    // For the very first day of the last week, we subtract 7 days for the week, plus 2 more to go back to the same day in the previous week
    const lastWeekStart = moment
      .utc()
      .subtract(8, 'days')
      .startOf('day')
      .toDate();

    const lastWeekEnd = moment.utc().subtract(8, 'days').endOf('day').toDate();

    console.log(
      lastWeekStart,
      lastWeekEnd,
      moment.utc(lastWeekStart).subtract(1, 'days').toISOString(),
    );

    await this.chartModel.deleteMany({
      timestamp: {
        $gte: lastWeekStart,
        $lte: lastWeekEnd,
      },
    });

    await this.getChartCronData(
      moment.utc(lastWeekStart).subtract(1, 'days'),
      lastWeekStart,
      '1d',
    );
  }
}
