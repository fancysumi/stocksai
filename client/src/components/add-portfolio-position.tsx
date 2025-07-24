import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePortfolio } from "@/contexts/portfolio-context";

interface StockSearchResult {
  symbol: string;
  name: string;
}

interface AddPortfolioPositionProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPortfolioPosition({ isOpen, onClose }: AddPortfolioPositionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [formData, setFormData] = useState({
    shares: "",
    avgPrice: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: searchResults, isLoading: searchLoading } = useQuery<StockSearchResult[]>({
    queryKey: ["/api/stocks/search", searchQuery],
    enabled: searchQuery.length > 2,
  });

  const { selectedPortfolioId } = usePortfolio();

  const addToPortfolioMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStock) throw new Error("No stock selected");
      if (!selectedPortfolioId) throw new Error("No portfolio selected");
      
      return apiRequest("POST", "/api/portfolio", {
        stockSymbol: selectedStock.symbol,
        shares: formData.shares,
        avgPrice: formData.avgPrice,
        portfolioId: selectedPortfolioId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Position Added",
        description: `${selectedStock?.symbol} has been added to your portfolio.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/summary"] });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add position to portfolio.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setSearchQuery("");
    setSelectedStock(null);
    setFormData({ shares: "", avgPrice: "" });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock || !formData.shares || !formData.avgPrice) return;
    addToPortfolioMutation.mutate();
  };

  const isFormValid = selectedStock && formData.shares && formData.avgPrice && 
                     parseFloat(formData.shares) > 0 && parseFloat(formData.avgPrice) > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
      <Card className="w-full sm:w-96 sm:max-w-md h-[90vh] sm:h-auto flex flex-col sm:rounded-lg rounded-t-xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add Existing Position</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-muted hover:text-gray-900"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!selectedStock ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="search">Search for Stock</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={16} />
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by symbol or company name..."
                    className="pl-10"
                  />
                </div>
              </div>
              
              {searchQuery.length > 2 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchLoading && (
                    <div className="p-3 text-center text-muted">Searching...</div>
                  )}
                  {searchResults && searchResults.length === 0 && !searchLoading && (
                    <div className="p-3 text-center text-muted">No stocks found</div>
                  )}
                  {searchResults?.map((stock) => (
                    <div
                      key={stock.symbol}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedStock(stock)}
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">{stock.symbol}</h4>
                        <p className="text-sm text-muted">{stock.name}</p>
                      </div>
                      <Button size="sm">Select</Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedStock.symbol}</h4>
                    <p className="text-sm text-muted">{selectedStock.name}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStock(null)}
                    className="text-muted hover:text-gray-900"
                  >
                    Change
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shares">Number of Shares</Label>
                <Input
                  id="shares"
                  type="number"
                  step="0.01"
                  value={formData.shares}
                  onChange={(e) => setFormData(prev => ({ ...prev, shares: e.target.value }))}
                  placeholder="e.g., 10"
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avgPrice">Average Price per Share</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">$</span>
                  <Input
                    id="avgPrice"
                    type="number"
                    step="0.01"
                    value={formData.avgPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, avgPrice: e.target.value }))}
                    placeholder="e.g., 150.25"
                    className="pl-8 text-lg"
                  />
                </div>
              </div>

              {isFormValid && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Total Investment:</strong> ${(parseFloat(formData.shares) * parseFloat(formData.avgPrice)).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid || addToPortfolioMutation.isPending}
                  className="flex-1 bg-success hover:bg-success/90 text-white"
                >
                  {addToPortfolioMutation.isPending ? "Adding..." : "Add Position"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}