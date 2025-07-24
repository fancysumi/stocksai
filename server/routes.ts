import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { claudeService } from "./services/claude";
import { polygonService } from "./services/polygon";
import { schedulerService } from "./services/scheduler";
import { insertWatchlistSchema, insertPortfolioSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Market data endpoints
  app.get("/api/market", async (_req, res) => {
    try {
      const marketData = await storage.getMarketData();
      res.json(marketData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  // Stock endpoints
  app.get("/api/stocks/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const stock = await storage.getStock(symbol);
      
      if (!stock) {
        // Try to fetch from Polygon.io if not in storage
        try {
          const quote = await polygonService.getQuote(symbol);
          const newStock = await storage.upsertStock({
            symbol: quote.symbol,
            name: quote.symbol, // Would need company name lookup
            price: quote.price.toString(),
            change: quote.change.toString(),
            changePercent: quote.changePercent.toString(),
            volume: quote.volume,
            marketCap: quote.marketCap?.toString(),
            pe: quote.pe?.toString()
          });
          res.json(newStock);
        } catch {
          res.status(404).json({ error: "Stock not found" });
        }
      } else {
        res.json(stock);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock" });
    }
  });

  app.get("/api/stocks/search/:query", async (req, res) => {
    try {
      const { query } = req.params;
      const results = await polygonService.searchStocks(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to search stocks" });
    }
  });

  // Watchlist endpoints
  app.get("/api/watchlist", async (_req, res) => {
    try {
      const userId = 1; // Demo user
      const watchlist = await storage.getWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch watchlist" });
    }
  });

  app.post("/api/watchlist", async (req, res) => {
    try {
      const userId = 1; // Demo user
      const validatedData = insertWatchlistSchema.parse({
        ...req.body,
        userId
      });
      
      const item = await storage.addToWatchlist(validatedData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Failed to add to watchlist" });
    }
  });

  app.delete("/api/watchlist/:symbol", async (req, res) => {
    try {
      const userId = 1; // Demo user
      const { symbol } = req.params;
      const success = await storage.removeFromWatchlist(userId, symbol);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Item not found in watchlist" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from watchlist" });
    }
  });

  // Portfolio management endpoints
  app.get("/api/portfolios", async (_req, res) => {
    try {
      const userId = 1; // Demo user
      const portfolios = await storage.getPortfolios(userId);
      res.json(portfolios);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch portfolios" });
    }
  });

  app.post("/api/portfolios", async (req, res) => {
    try {
      const { name, description } = req.body;
      const userId = 1; // Demo user
      
      const portfolio = await storage.createPortfolio({
        userId,
        name,
        description,
        cashBalance: "10000.00",
        isDefault: false
      });
      
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ error: "Failed to create portfolio" });
    }
  });

  // Portfolio holdings endpoints
  app.get("/api/portfolio", async (req, res) => {
    try {
      const userId = 1; // Demo user
      const portfolioId = req.query.portfolioId ? parseInt(req.query.portfolioId as string) : undefined;
      const portfolio = await storage.getPortfolio(userId, portfolioId);
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  app.get("/api/portfolio/summary", async (req, res) => {
    try {
      const userId = 1; // Demo user
      const portfolioId = req.query.portfolioId ? parseInt(req.query.portfolioId as string) : undefined;
      const summary = await storage.getPortfolioSummary(userId, portfolioId);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch portfolio summary" });
    }
  });

  app.post("/api/portfolio", async (req, res) => {
    try {
      const { stockSymbol, shares, avgPrice, portfolioId } = req.body;
      const userId = 1; // Demo user
      
      // Use default portfolio if none specified
      let actualPortfolioId = portfolioId;
      if (!actualPortfolioId) {
        const defaultPortfolio = await storage.getDefaultPortfolio(userId);
        actualPortfolioId = defaultPortfolio?.id || 1;
      }
      
      // Validate stock exists
      let stock = await storage.getStock(stockSymbol);
      if (!stock) {
        // Try to get stock from Polygon API
        try {
          const quote = await polygonService.getQuote(stockSymbol);
          stock = await storage.upsertStock({
            symbol: quote.symbol,
            name: quote.symbol,
            price: quote.price.toString(),
            change: quote.change.toString(),
            changePercent: quote.changePercent.toString(),
            volume: quote.volume,
            marketCap: quote.marketCap?.toString(),
            pe: quote.pe?.toString()
          });
        } catch (error) {
          return res.status(404).json({ error: "Stock not found" });
        }
      }
      
      const validatedData = insertPortfolioSchema.parse({
        userId,
        portfolioId: actualPortfolioId,
        stockSymbol,
        shares: shares.toString(),
        avgPrice: avgPrice.toString()
      });
      
      const item = await storage.addToPortfolio(validatedData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Failed to add to portfolio" });
    }
  });

  app.put("/api/portfolio/position", async (req, res) => {
    try {
      const { stockSymbol, shares, avgPrice, portfolioId } = req.body;
      const userId = 1; // Demo user
      
      const item = await storage.updatePortfolioPosition(userId, portfolioId, stockSymbol, shares, avgPrice);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Failed to update position" });
    }
  });

  app.delete("/api/portfolio/position", async (req, res) => {
    try {
      const { stockSymbol, portfolioId } = req.body;
      const userId = 1; // Demo user
      
      const success = await storage.removeFromPortfolio(userId, portfolioId, stockSymbol);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Position not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to remove position" });
    }
  });

  // Recommendations endpoints
  app.get("/api/recommendations", async (_req, res) => {
    try {
      const recommendations = await storage.getActiveRecommendations();
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  app.post("/api/recommendations/refresh", async (_req, res) => {
    try {
      await schedulerService.generateDailyRecommendations();
      const recommendations = await storage.getActiveRecommendations();
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh recommendations" });
    }
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const response = await claudeService.chatResponse(message, context);
      res.json({ response });
    } catch (error) {
      res.status(500).json({ error: "Failed to get chat response" });
    }
  });

  // Analytics endpoint
  app.post("/api/analyze/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const stock = await storage.getStock(symbol);
      
      if (!stock) {
        return res.status(404).json({ error: "Stock not found" });
      }

      const analysis = await claudeService.analyzeStock(
        stock.symbol,
        parseFloat(stock.price)
      );
      
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze stock" });
    }
  });

  const httpServer = createServer(app);

  // Start scheduler
  schedulerService.startScheduler();

  return httpServer;
}
