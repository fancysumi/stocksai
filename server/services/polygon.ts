export interface PolygonQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
}

export interface PolygonAggregates {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export class PolygonService {
  private apiKey: string;
  private baseUrl = 'https://api.polygon.io';

  constructor() {
    this.apiKey = process.env.POLYGON_API_KEY || process.env.POLYGON_IO_API_KEY || 'mock-api-key';
  }

  async getQuote(symbol: string): Promise<PolygonQuote> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol.toUpperCase()}?apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.statusText}`);
      }

      const data = await response.json();
      const ticker = data.results;
      
      if (!ticker) {
        throw new Error(`No data found for symbol ${symbol}`);
      }

      return {
        symbol: ticker.ticker,
        price: ticker.lastQuote?.last || ticker.day?.close || 0,
        change: ticker.day?.change || 0,
        changePercent: ticker.day?.changePercent || 0,
        volume: ticker.day?.volume || 0,
        marketCap: ticker.marketCap,
        pe: ticker.peRatio
      };
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<PolygonQuote[]> {
    try {
      const promises = symbols.map(symbol => this.getQuote(symbol));
      const results = await Promise.allSettled(promises);
      
      return results
        .filter((result): result is PromiseFulfilledResult<PolygonQuote> => result.status === 'fulfilled')
        .map(result => result.value);
    } catch (error) {
      console.error('Error fetching multiple quotes:', error);
      throw new Error('Failed to fetch quotes');
    }
  }

  async getMarketIndices(): Promise<PolygonQuote[]> {
    const indices = ['SPY', 'QQQ', 'DIA']; // ETFs representing major indices
    try {
      return await this.getMultipleQuotes(indices);
    } catch (error) {
      console.error('Error fetching market indices:', error);
      // Return mock data if API fails
      return [
        { symbol: 'SPY', price: 480.25, change: 1.15, changePercent: 0.24, volume: 45000000 },
        { symbol: 'QQQ', price: 385.67, change: 1.19, changePercent: 0.31, volume: 32000000 },
        { symbol: 'DIA', price: 425.89, change: 0.77, changePercent: 0.18, volume: 8500000 }
      ];
    }
  }

  async getAggregates(symbol: string, from: string, to: string): Promise<PolygonAggregates[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v2/aggs/ticker/${symbol.toUpperCase()}/range/1/day/${from}/${to}?apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.results) {
        return [];
      }

      return data.results.map((agg: any) => ({
        symbol: symbol.toUpperCase(),
        open: agg.o,
        high: agg.h,
        low: agg.l,
        close: agg.c,
        volume: agg.v,
        timestamp: agg.t
      }));
    } catch (error) {
      console.error(`Error fetching aggregates for ${symbol}:`, error);
      throw new Error(`Failed to fetch aggregates for ${symbol}`);
    }
  }

  async searchStocks(query: string): Promise<{ symbol: string; name: string }[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v3/reference/tickers?search=${encodeURIComponent(query)}&market=stocks&active=true&limit=10&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.results) {
        return [];
      }

      return data.results.map((ticker: any) => ({
        symbol: ticker.ticker,
        name: ticker.name
      }));
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }
}

export const polygonService = new PolygonService();
