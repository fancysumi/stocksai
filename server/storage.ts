import { users, portfolios, stocks, watchlist, portfolio, recommendations, marketData, type User, type Portfolio, type Stock, type WatchlistItem, type PortfolioItem, type Recommendation, type MarketData, type InsertUser, type InsertPortfolio, type InsertStock, type InsertWatchlistItem, type InsertPortfolioItem, type InsertRecommendation, type InsertMarketData, type StockWithRecommendation, type PortfolioSummary } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface PortfolioHolding extends PortfolioItem {
  stock: Stock;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  portfolioPercent: number;
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;

  // Portfolio methods
  getPortfolios(userId: number): Promise<Portfolio[]>;
  createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio>;
  getDefaultPortfolio(userId: number): Promise<Portfolio | undefined>;
  updatePortfolioCashBalance(portfolioId: number, newBalance: string): Promise<Portfolio>;

  // Stock methods
  getStock(symbol: string): Promise<Stock | undefined>;
  upsertStock(insertStock: InsertStock): Promise<Stock>;
  getStocks(): Promise<Stock[]>;

  // Watchlist methods
  getWatchlist(userId: number, portfolioId?: number): Promise<StockWithRecommendation[]>;
  addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem>;
  removeFromWatchlist(userId: number, stockSymbol: string): Promise<boolean>;
  
  // Portfolio holdings methods
  getPortfolio(userId: number, portfolioId?: number): Promise<PortfolioHolding[]>;
  getPortfolioSummary(userId: number, portfolioId?: number): Promise<PortfolioSummary>;
  addToPortfolio(item: InsertPortfolioItem): Promise<PortfolioItem>;
  updatePortfolioPosition(userId: number, portfolioId: number, stockSymbol: string, shares: number, avgPrice: number): Promise<PortfolioItem>;
  removeFromPortfolio(userId: number, portfolioId: number, stockSymbol: string): Promise<boolean>;

  // Recommendation methods
  getActiveRecommendations(): Promise<Recommendation[]>;
  createRecommendation(insertRecommendation: InsertRecommendation): Promise<Recommendation>;
  deactivateOldRecommendations(): Promise<void>;

  // Market data methods
  getMarketData(): Promise<MarketData[]>;
  upsertMarketData(insertMarketData: InsertMarketData): Promise<MarketData>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getPortfolios(userId: number): Promise<Portfolio[]> {
    const portfolioList = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId))
      .orderBy(desc(portfolios.isDefault), portfolios.createdAt);
    return portfolioList;
  }

  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    const [newPortfolio] = await db
      .insert(portfolios)
      .values(insertPortfolio)
      .returning();
    return newPortfolio;
  }

  async getDefaultPortfolio(userId: number): Promise<Portfolio | undefined> {
    const [defaultPortfolio] = await db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.userId, userId), eq(portfolios.isDefault, true)));
    return defaultPortfolio || undefined;
  }

  async updatePortfolioCashBalance(portfolioId: number, newBalance: string): Promise<Portfolio> {
    const [updated] = await db
      .update(portfolios)
      .set({ cashBalance: newBalance })
      .where(eq(portfolios.id, portfolioId))
      .returning();
    return updated;
  }

  async getStock(symbol: string): Promise<Stock | undefined> {
    const [stock] = await db.select().from(stocks).where(eq(stocks.symbol, symbol.toUpperCase()));
    return stock || undefined;
  }

  async upsertStock(insertStock: InsertStock): Promise<Stock> {
    const existing = await this.getStock(insertStock.symbol);
    if (existing) {
      const [updated] = await db
        .update(stocks)
        .set(insertStock)
        .where(eq(stocks.symbol, insertStock.symbol.toUpperCase()))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(stocks)
        .values({ ...insertStock, symbol: insertStock.symbol.toUpperCase() })
        .returning();
      return created;
    }
  }

  async getStocks(): Promise<Stock[]> {
    return await db.select().from(stocks).orderBy(stocks.symbol);
  }

  async getWatchlist(userId: number, portfolioId?: number): Promise<StockWithRecommendation[]> {
    const whereConditions = portfolioId 
      ? and(eq(watchlist.userId, userId), eq(watchlist.portfolioId, portfolioId))
      : eq(watchlist.userId, userId);

    const watchlistItems = await db
      .select({
        watchlistItem: watchlist,
        stock: stocks,
      })
      .from(watchlist)
      .innerJoin(stocks, eq(watchlist.stockSymbol, stocks.symbol))
      .where(whereConditions);

    const result: StockWithRecommendation[] = [];
    for (const item of watchlistItems) {
      const [activeRec] = await db
        .select()
        .from(recommendations)
        .where(and(eq(recommendations.stockSymbol, item.stock.symbol), eq(recommendations.isActive, true)))
        .limit(1);

      result.push({
        ...item.stock,
        recommendation: activeRec ? {
          action: activeRec.action,
          confidence: activeRec.confidence,
          reason: activeRec.reason
        } : undefined
      });
    }

    return result;
  }

  async addToWatchlist(insertItem: InsertWatchlistItem): Promise<WatchlistItem> {
    const [item] = await db
      .insert(watchlist)
      .values({ ...insertItem, stockSymbol: insertItem.stockSymbol.toUpperCase() })
      .returning();
    return item;
  }

  async removeFromWatchlist(userId: number, stockSymbol: string): Promise<boolean> {
    const result = await db
      .delete(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.stockSymbol, stockSymbol.toUpperCase())));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getPortfolio(userId: number, portfolioId?: number): Promise<PortfolioHolding[]> {
    const whereConditions = portfolioId 
      ? and(eq(portfolio.userId, userId), eq(portfolio.portfolioId, portfolioId))
      : eq(portfolio.userId, userId);

    const portfolioItems = await db
      .select({
        portfolioItem: portfolio,
        stock: stocks,
      })
      .from(portfolio)
      .innerJoin(stocks, eq(portfolio.stockSymbol, stocks.symbol))
      .where(whereConditions);

    const holdings: PortfolioHolding[] = [];
    for (const item of portfolioItems) {
      const currentValue = parseFloat(item.portfolioItem.shares) * parseFloat(item.stock.price);
      const costBasis = parseFloat(item.portfolioItem.shares) * parseFloat(item.portfolioItem.avgPrice);
      const gainLoss = currentValue - costBasis;
      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      holdings.push({
        ...item.portfolioItem,
        stock: item.stock,
        currentValue,
        gainLoss,
        gainLossPercent,
        portfolioPercent: 0 // Will be calculated below
      });
    }

    // Calculate portfolio percentages
    const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
    if (totalValue > 0) {
      holdings.forEach(holding => {
        holding.portfolioPercent = (holding.currentValue / totalValue) * 100;
      });
    }

    return holdings;
  }

  async getPortfolioSummary(userId: number, portfolioId?: number): Promise<PortfolioSummary> {
    const holdings = await this.getPortfolio(userId, portfolioId);
    
    const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
    const totalCost = holdings.reduce((sum, holding) => 
      sum + (parseFloat(holding.shares) * parseFloat(holding.avgPrice)), 0);
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    
    // Calculate day change (using stock day changes)
    const dayChange = holdings.reduce((sum, holding) => 
      sum + (parseFloat(holding.shares) * parseFloat(holding.stock.change)), 0);
    const dayChangePercent = totalValue > 0 && totalValue !== dayChange ? 
      (dayChange / (totalValue - dayChange)) * 100 : 0;

    // Get cash balance if portfolioId is specified
    let buyingPower = 10000; // Default
    if (portfolioId) {
      const [portfolioRecord] = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.id, portfolioId));
      if (portfolioRecord) {
        buyingPower = parseFloat(portfolioRecord.cashBalance);
      }
    }
    
    return {
      totalValue,
      dayChange,
      dayChangePercent,
      totalGain,
      totalGainPercent,
      buyingPower
    };
  }

  async addToPortfolio(insertItem: InsertPortfolioItem): Promise<PortfolioItem> {
    // Check if position already exists
    const [existing] = await db
      .select()
      .from(portfolio)
      .where(and(
        eq(portfolio.userId, insertItem.userId),
        eq(portfolio.portfolioId, insertItem.portfolioId),
        eq(portfolio.stockSymbol, insertItem.stockSymbol.toUpperCase())
      ));

    if (existing) {
      // Update existing position with average cost calculation
      const existingShares = parseFloat(existing.shares);
      const existingValue = existingShares * parseFloat(existing.avgPrice);
      const newShares = parseFloat(insertItem.shares);
      const newValue = newShares * parseFloat(insertItem.avgPrice);
      
      const totalShares = existingShares + newShares;
      const totalValue = existingValue + newValue;
      const newAvgPrice = totalValue / totalShares;
      
      const [updated] = await db
        .update(portfolio)
        .set({
          shares: totalShares.toString(),
          avgPrice: newAvgPrice.toString()
        })
        .where(eq(portfolio.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(portfolio)
        .values({ ...insertItem, stockSymbol: insertItem.stockSymbol.toUpperCase() })
        .returning();
      return created;
    }
  }

  async updatePortfolioPosition(userId: number, portfolioId: number, stockSymbol: string, shares: number, avgPrice: number): Promise<PortfolioItem> {
    const [updated] = await db
      .update(portfolio)
      .set({
        shares: shares.toString(),
        avgPrice: avgPrice.toString()
      })
      .where(and(
        eq(portfolio.userId, userId),
        eq(portfolio.portfolioId, portfolioId),
        eq(portfolio.stockSymbol, stockSymbol.toUpperCase())
      ))
      .returning();
    
    if (!updated) {
      // Create new position if it doesn't exist
      return this.addToPortfolio({
        userId,
        portfolioId,
        stockSymbol: stockSymbol.toUpperCase(),
        shares: shares.toString(),
        avgPrice: avgPrice.toString()
      });
    }
    
    return updated;
  }

  async removeFromPortfolio(userId: number, portfolioId: number, stockSymbol: string): Promise<boolean> {
    const result = await db
      .delete(portfolio)
      .where(and(
        eq(portfolio.userId, userId),
        eq(portfolio.portfolioId, portfolioId),
        eq(portfolio.stockSymbol, stockSymbol.toUpperCase())
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getActiveRecommendations(): Promise<Recommendation[]> {
    return await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.isActive, true))
      .orderBy(desc(recommendations.createdAt));
  }

  async createRecommendation(insertRecommendation: InsertRecommendation): Promise<Recommendation> {
    const [recommendation] = await db
      .insert(recommendations)
      .values({
        ...insertRecommendation,
        stockSymbol: insertRecommendation.stockSymbol.toUpperCase()
      })
      .returning();
    return recommendation;
  }

  async deactivateOldRecommendations(): Promise<void> {
    await db
      .update(recommendations)
      .set({ isActive: false })
      .where(eq(recommendations.isActive, true));
  }

  async getMarketData(): Promise<MarketData[]> {
    return await db
      .select()
      .from(marketData)
      .orderBy(desc(marketData.lastUpdated));
  }

  async upsertMarketData(insertMarketData: InsertMarketData): Promise<MarketData> {
    const [existing] = await db
      .select()
      .from(marketData)
      .where(eq(marketData.symbol, insertMarketData.symbol));

    if (existing) {
      const [updated] = await db
        .update(marketData)
        .set(insertMarketData)
        .where(eq(marketData.symbol, insertMarketData.symbol))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(marketData)
        .values(insertMarketData)
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();