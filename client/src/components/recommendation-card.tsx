import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Recommendation {
  id: number;
  stockSymbol: string;
  action: string;
  confidence: string;
  reason: string;
  targetPrice?: string;
  allocation?: string;
  type: string;
}

interface Stock {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  stock: Stock;
}

export function RecommendationCard({ recommendation, stock }: RecommendationCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToPortfolioMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/portfolio", {
        stockSymbol: stock.symbol,
        shares: "1", // Default to 1 share
        avgPrice: stock.price,
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to Portfolio",
        description: `${stock.symbol} has been added to your portfolio.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add stock to portfolio.",
        variant: "destructive",
      });
    },
  });

  const addToWatchlistMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/watchlist", {
        stockSymbol: stock.symbol,
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to Watchlist",
        description: `${stock.symbol} has been added to your watchlist.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add stock to watchlist.",
        variant: "destructive",
      });
    },
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "BUY":
        return <TrendingUp className="h-4 w-4" />;
      case "SELL":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "BUY":
        return "bg-success bg-opacity-10 text-success";
      case "SELL":
        return "bg-danger bg-opacity-10 text-danger";
      case "REDUCE":
        return "bg-warning bg-opacity-10 text-yellow-700";
      default:
        return "bg-primary bg-opacity-10 text-primary";
    }
  };

  const changePercent = parseFloat(stock.changePercent);
  const isPositive = changePercent >= 0;

  return (
    <Card className="p-4 mb-4 mobile-card shadow-sm border border-gray-200">
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-xl flex items-center justify-center">
              <Bot className="text-primary" size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">
                {recommendation.type === "PORTFOLIO" ? "Portfolio Rebalance" : "Claude's Recommendation"}
              </h3>
              <p className="text-sm text-muted">{recommendation.confidence} Confidence</p>
            </div>
          </div>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${getActionColor(recommendation.action)}`}>
            {recommendation.action}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <div>
                <h4 className="font-semibold text-gray-900 text-lg">{stock.symbol}</h4>
                <p className="text-sm text-muted">{stock.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900 text-lg">${parseFloat(stock.price).toFixed(2)}</p>
              <p className={`text-sm font-medium ${isPositive ? "text-success" : "text-danger"}`}>
                {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-gray-700 leading-relaxed">{recommendation.reason}</p>
            {recommendation.allocation && (
              <p className="text-xs text-muted mt-2 font-medium">
                Recommended allocation: {recommendation.allocation}% of portfolio
              </p>
            )}
          </div>

          <div className="flex space-x-3 pt-2">
            {recommendation.action === "BUY" && (
              <Button
                onClick={() => addToPortfolioMutation.mutate()}
                disabled={addToPortfolioMutation.isPending}
                className="flex-1 bg-success hover:bg-success/90 text-white h-12 text-base font-medium"
              >
                Add to Portfolio
              </Button>
            )}
            <Button
              onClick={() => addToWatchlistMutation.mutate()}
              disabled={addToWatchlistMutation.isPending}
              variant="outline"
              className="flex-1 h-12 text-base font-medium"
            >
              Add to Watchlist
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
