import cron from 'node-cron';
import { storage } from '../storage';
import { claudeService } from './claude';
import { polygonService } from './polygon';

export class SchedulerService {
  private updateInterval: NodeJS.Timeout | null = null;

  startScheduler() {
    // Update stock prices every 5 minutes during market hours
    this.updateInterval = setInterval(async () => {
      await this.updateStockPrices();
    }, 5 * 60 * 1000);

    // Generate daily recommendations at 9 AM EST (pre-market)
    cron.schedule('0 9 * * 1-5', async () => {
      await this.generateDailyRecommendations();
    });

    // Generate post-market recommendations at 4:30 PM EST (after NYSE close)
    cron.schedule('30 16 * * 1-5', async () => {
      await this.generateDailyRecommendations();
    });

    // Update market data every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      await this.updateMarketData();
    });

    // Clean up old recommendations daily at midnight
    cron.schedule('0 0 * * *', async () => {
      await storage.deactivateOldRecommendations();
    });

    console.log('Scheduler started');
  }

  stopScheduler() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('Scheduler stopped');
  }

  async updateStockPrices() {
    try {
      const stocks = await storage.getStocks();
      const symbols = stocks.map(stock => stock.symbol);
      
      if (symbols.length === 0) return;

      const quotes = await polygonService.getMultipleQuotes(symbols);
      
      for (const quote of quotes) {
        await storage.upsertStock({
          symbol: quote.symbol,
          name: stocks.find(s => s.symbol === quote.symbol)?.name || quote.symbol,
          price: quote.price.toString(),
          change: quote.change.toString(),
          changePercent: quote.changePercent.toString(),
          volume: quote.volume,
          marketCap: quote.marketCap?.toString(),
          pe: quote.pe?.toString()
        });
      }

      console.log(`Updated ${quotes.length} stock prices`);
    } catch (error) {
      console.error('Error updating stock prices:', error);
    }
  }

  async updateMarketData() {
    try {
      const indices = await polygonService.getMarketIndices();
      
      for (const index of indices) {
        await storage.upsertMarketData({
          symbol: index.symbol,
          name: this.getIndexName(index.symbol),
          price: index.price.toString(),
          change: index.change.toString(),
          changePercent: index.changePercent.toString()
        });
      }

      console.log('Updated market data');
    } catch (error) {
      console.error('Error updating market data:', error);
    }
  }

  async generateDailyRecommendations() {
    try {
      console.log('Generating daily recommendations...');
      
      // Deactivate old recommendations
      await storage.deactivateOldRecommendations();
      
      // Get all users (in real app, this would be paginated)
      const user = await storage.getUser(1); // Demo user
      if (!user) return;

      // Analyze watchlist stocks
      const watchlist = await storage.getWatchlist(user.id);
      for (const stock of watchlist) {
        try {
          const analysis = await claudeService.analyzeWatchlistStock(
            stock.symbol,
            parseFloat(stock.price)
          );
          
          await storage.createRecommendation({
            stockSymbol: analysis.symbol,
            action: analysis.action,
            confidence: analysis.confidence,
            reason: analysis.reason,
            targetPrice: analysis.targetPrice?.toString(),
            allocation: analysis.allocation?.toString(),
            type: analysis.type,
            isActive: true
          });
        } catch (error) {
          console.error(`Error analyzing watchlist stock ${stock.symbol}:`, error);
        }
      }

      // Analyze portfolio for rebalancing
      const portfolio = await storage.getPortfolio(user.id);
      if (portfolio.length > 0) {
        try {
          const portfolioAnalysis = await claudeService.analyzePortfolio(portfolio);
          
          for (const rec of portfolioAnalysis.recommendations) {
            await storage.createRecommendation({
              stockSymbol: rec.symbol,
              action: rec.action,
              confidence: rec.confidence,
              reason: rec.reason,
              targetPrice: rec.targetPrice?.toString(),
              allocation: rec.allocation?.toString(),
              type: rec.type,
              isActive: true
            });
          }
        } catch (error) {
          console.error('Error analyzing portfolio:', error);
        }
      }

      // Discover new opportunities
      await this.discoverNewStocks();

      console.log('Daily recommendations generated');
    } catch (error) {
      console.error('Error generating daily recommendations:', error);
    }
  }

  private async discoverNewStocks() {
    // In a real implementation, this would use market screeners or trending stocks
    const trendingSymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'AMZN'];
    
    for (const symbol of trendingSymbols.slice(0, 2)) { // Limit to 2 for demo
      try {
        const quote = await polygonService.getQuote(symbol);
        
        // Update stock data
        await storage.upsertStock({
          symbol: quote.symbol,
          name: this.getCompanyName(quote.symbol),
          price: quote.price.toString(),
          change: quote.change.toString(),
          changePercent: quote.changePercent.toString(),
          volume: quote.volume,
          marketCap: quote.marketCap?.toString(),
          pe: quote.pe?.toString()
        });

        // Analyze for discovery recommendation
        const analysis = await claudeService.analyzeStock(
          quote.symbol,
          quote.price
        );
        
        await storage.createRecommendation({
          stockSymbol: analysis.symbol,
          action: analysis.action,
          confidence: analysis.confidence,
          reason: analysis.reason,
          targetPrice: analysis.targetPrice?.toString(),
          allocation: analysis.allocation?.toString(),
          type: 'DISCOVERY',
          isActive: true
        });
      } catch (error) {
        console.error(`Error discovering stock ${symbol}:`, error);
      }
    }
  }

  private getIndexName(symbol: string): string {
    switch (symbol) {
      case 'SPY': return 'S&P 500';
      case 'QQQ': return 'NASDAQ';
      case 'DIA': return 'Dow Jones';
      default: return symbol;
    }
  }

  private getCompanyName(symbol: string): string {
    const names: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corp.',
      'GOOGL': 'Alphabet Inc.',
      'TSLA': 'Tesla Inc.',
      'NVDA': 'NVIDIA Corp.',
      'AMZN': 'Amazon.com Inc.'
    };
    return names[symbol] || symbol;
  }
}

export const schedulerService = new SchedulerService();
