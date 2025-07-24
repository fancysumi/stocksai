import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Edit, Trash2, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePortfolio } from "@/contexts/portfolio-context";

interface PortfolioHolding {
  id: number;
  stockSymbol: string;
  shares: string;
  avgPrice: string;
  stock: {
    symbol: string;
    name: string;
    price: string;
    change: string;
    changePercent: string;
  };
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  portfolioPercent: number;
}

export function PortfolioHoldings() {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PortfolioHolding | null>(null);
  const [newShares, setNewShares] = useState("");
  const [newAvgPrice, setNewAvgPrice] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedPortfolioId } = usePortfolio();

  const { data: holdings, isLoading } = useQuery<PortfolioHolding[]>({
    queryKey: ["/api/portfolio", selectedPortfolioId],
    enabled: !!selectedPortfolioId,
  });

  const updatePositionMutation = useMutation({
    mutationFn: async (data: { stockSymbol: string; shares: number; avgPrice: number; portfolioId: number }) => {
      return apiRequest("PUT", "/api/portfolio/position", data);
    },
    onSuccess: () => {
      toast({
        title: "Position Updated",
        description: "Portfolio position has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/summary"] });
      setShowEditDialog(false);
      setEditingPosition(null);
      setNewShares("");
      setNewAvgPrice("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update position.",
        variant: "destructive",
      });
    },
  });

  const removePositionMutation = useMutation({
    mutationFn: async (data: { stockSymbol: string; portfolioId: number }) => {
      return apiRequest("DELETE", `/api/portfolio/position`, data);
    },
    onSuccess: () => {
      toast({
        title: "Position Removed",
        description: "Position has been removed from your portfolio.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/summary"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove position.",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const handleEditPosition = (holding: PortfolioHolding) => {
    setEditingPosition(holding);
    setNewShares(holding.shares);
    setNewAvgPrice(holding.avgPrice);
    setShowEditDialog(true);
  };

  const handleUpdatePosition = () => {
    if (!editingPosition || !selectedPortfolioId) return;
    
    updatePositionMutation.mutate({
      stockSymbol: editingPosition.stockSymbol,
      shares: parseFloat(newShares),
      avgPrice: parseFloat(newAvgPrice),
      portfolioId: selectedPortfolioId
    });
  };

  const handleRemovePosition = (holding: PortfolioHolding) => {
    if (!selectedPortfolioId) return;
    
    removePositionMutation.mutate({
      stockSymbol: holding.stockSymbol,
      portfolioId: selectedPortfolioId
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="flex justify-between">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!holdings || holdings.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Holdings Yet</h3>
          <p className="text-gray-600 mb-4">
            Start building your portfolio by adding your first stock position.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {holdings.map((holding) => (
        <Card key={holding.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg">{holding.stockSymbol}</h3>
                <Badge variant="outline" className="text-xs">
                  {parseFloat(holding.shares).toLocaleString()} shares
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{holding.stock.name}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditPosition(holding)}
                className="touch-target"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemovePosition(holding)}
                className="touch-target text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-gray-500">Current Price</p>
              <p className="font-semibold">{formatCurrency(parseFloat(holding.stock.price))}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Cost</p>
              <p className="font-semibold">{formatCurrency(parseFloat(holding.avgPrice))}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-gray-500">Market Value</p>
              <p className="font-semibold text-lg">{formatCurrency(holding.currentValue)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Return</p>
              <div className="flex items-center space-x-1">
                {holding.gainLoss >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`font-semibold ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(holding.gainLoss))}
                </span>
                <span className={`text-sm ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({formatPercent(holding.gainLossPercent)})
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Portfolio Weight</p>
              <p className="text-sm font-medium">{holding.portfolioPercent.toFixed(1)}%</p>
            </div>
            <div className="flex items-center space-x-1">
              {parseFloat(holding.stock.changePercent) >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              <span className={`text-xs ${parseFloat(holding.stock.changePercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(parseFloat(holding.stock.changePercent))} today
              </span>
            </div>
          </div>
        </Card>
      ))}

      {/* Edit Position Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[90vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Position: {editingPosition?.stockSymbol}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="shares" className="text-sm font-medium">Shares</Label>
              <Input
                id="shares"
                type="number"
                placeholder="100"
                value={newShares}
                onChange={(e) => setNewShares(e.target.value)}
                className="mt-1"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="avgPrice" className="text-sm font-medium">Average Price</Label>
              <Input
                id="avgPrice"
                type="number"
                placeholder="150.00"
                value={newAvgPrice}
                onChange={(e) => setNewAvgPrice(e.target.value)}
                className="mt-1"
                step="0.01"
                min="0"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdatePosition}
                disabled={!newShares || !newAvgPrice || parseFloat(newShares) <= 0 || parseFloat(newAvgPrice) <= 0 || updatePositionMutation.isPending}
                className="flex-1"
              >
                {updatePositionMutation.isPending ? 'Updating...' : 'Update Position'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}