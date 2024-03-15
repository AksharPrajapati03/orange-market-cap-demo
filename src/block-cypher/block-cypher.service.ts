import { Injectable } from '@nestjs/common';

@Injectable()
export class BlockCypherService {
  async getBlockCypherData(limit: number): Promise<any> {
    if (!limit) {
      limit = 10;
    } else {
      limit = limit >= 45 ? 45 : limit;
    }

    const response = await fetch(
      `https://api.blockcypher.com/v1/btc/main/txs?token=22f755e49b6d4d04a849fe8d15cd903e&limit=${limit}`,
      {
        method: 'GET',
      },
    );
    const responseData = await response.json();

    return responseData.map((data: any) => {
      return {
        hash: data.hash,
        total: data.total,
        fees: data.fees,
        preference: data.preference,
        received: data.received,
      };
    });
  }
}
