import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface StockCardProps {
  stock: {
    symbol: string;
    name: string;
    price: string;
    changePercent: string;
    pe?: string;
    volume: number;
    recommendation?: {
      action: string;
      confidence: string;
    };
  };
  showActions?: boolean;
  onRemove?: () => void;
}

export function StockCard({ stock, showActions = false, onRemove }: StockCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSwipeActions, setShowSwipeActions] = useState(false);

  const addToPortfolioMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/portfolio", {
        stockSymbol: stock.symbol,
        shares: "1",
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

  const removeFromWatchlistMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/watchlist/${stock.symbol}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Removed from Watchlist",
        description: `${stock.symbol} has been removed from your watchlist.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      if (onRemove) onRemove();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove stock from watchlist.",
        variant: "destructive",
      });
    },
  });

  const changePercent = parseFloat(stock.changePercent);
  const isPositive = changePercent >= 0;

  const getRecommendationColor = (action: string) => {
    switch (action) {
      case "BUY":
        return "bg-success bg-opacity-10 text-success";
      case "SELL":
        return "bg-danger bg-opacity-10 text-danger";
      case "HOLD":
        return "bg-primary bg-opacity-10 text-primary";
      default:
        return "bg-warning bg-opacity-10 text-yellow-700";
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  return (
    <Card className="bg-white rounded-xl p-4 border border-gray-200 relative overflow-hidden mobile-card shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{stock.symbol}</h3>
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

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-muted">
          {stock.pe && (
            <span>P/E: <span className="font-medium">{parseFloat(stock.pe).toFixed(1)}</span></span>
          )}
          <span>Vol: <span className="font-medium">{formatVolume(stock.volume)}</span></span>
        </div>
        <div className="flex items-center space-x-2">
          {stock.recommendation && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getRecommendationColor(stock.recommendation.action)}`}>
              {stock.recommendation.action}
            </span>
          )}
        </div>
      </div>

      {/* Mobile-friendly Actions */}
      {showActions && (
        <div className="mt-3 flex space-x-2">
          <Button
            size="sm"
            onClick={() => addToPortfolioMutation.mutate()}
            disabled={addToPortfolioMutation.isPending}
            className="flex-1 bg-success hover:bg-success/90 text-white h-10 text-sm font-medium"
          >
            <Plus size={14} className="mr-1" />
            Add to Portfolio
          </Button>
          <Button
            size="sm"
            onClick={() => removeFromWatchlistMutation.mutate()}
            disabled={removeFromWatchlistMutation.isPending}
            variant="destructive"
            className="h-10 px-3"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )}
    </Card>
  );
}
