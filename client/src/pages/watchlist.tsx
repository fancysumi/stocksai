import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { StockCard } from "@/components/stock-card";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ChatInterface } from "@/components/chat-interface";
import { PortfolioSelector } from "@/components/portfolio-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Search, RefreshCw, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { usePortfolio } from "@/contexts/portfolio-context";

interface StockSearchResult {
  symbol: string;
  name: string;
}

interface WatchlistStock {
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
}

export default function Watchlist() {
  const [showAddStock, setShowAddStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedPortfolioId, selectedPortfolio, setSelectedPortfolioId } = usePortfolio();

  const { data: watchlist, isLoading: watchlistLoading } = useQuery<WatchlistStock[]>({
    queryKey: ["/api/watchlist"],
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery<StockSearchResult[]>({
    queryKey: ["/api/stocks/search", searchQuery],
    enabled: searchQuery.length > 2,
  });

  const addToWatchlistMutation = useMutation({
    mutationFn: async (stockSymbol: string) => {
      return apiRequest("POST", "/api/watchlist", { stockSymbol });
    },
    onSuccess: () => {
      toast({
        title: "Added to Watchlist",
        description: "Stock has been added to your watchlist.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      setShowAddStock(false);
      setSearchQuery("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add stock to watchlist.",
        variant: "destructive",
      });
    },
  });

  const refreshWatchlistMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/watchlist/refresh", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Watchlist Updated",
        description: "Latest prices and data refreshed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to refresh watchlist.",
        variant: "destructive",
      });
    },
  });

  const {
    isPulling,
    pullDistance,
    isRefreshing,
    shouldShowIndicator,
    isReadyToRefresh,
    bindEvents
  } = usePullToRefresh({
    onRefresh: async () => {
      await refreshWatchlistMutation.mutateAsync();
    },
    threshold: 80,
    disabled: refreshWatchlistMutation.isPending
  });

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      return bindEvents(container);
    }
  }, [bindEvents]);

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 touch-pan-y">
      <AppHeader />
      
      {/* Pull to Refresh Indicator */}
      {shouldShowIndicator && (
        <div 
          className={`pull-refresh ${shouldShowIndicator ? 'active' : ''} transition-all duration-300`}
          style={{ 
            transform: `translateY(${Math.min(pullDistance - 20, 40)}px)`,
            opacity: Math.min(pullDistance / 60, 1)
          }}
        >
          <div className={`flex flex-col items-center ${isReadyToRefresh ? 'text-success' : 'text-muted'}`}>
            <ChevronDown 
              size={24} 
              className={`transition-transform duration-200 ${isReadyToRefresh ? 'rotate-180' : ''}`}
            />
            <p className="text-xs font-medium mt-1">
              {isReadyToRefresh ? 'Release to refresh' : 'Pull to refresh'}
            </p>
          </div>
        </div>
      )}
      
      <main className="pb-20" style={{ transform: `translateY(${Math.min(pullDistance * 0.3, 30)}px)` }}>
        <section className="px-4 py-6 mobile-spacing">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Watchlist</h2>
              {selectedPortfolio && (
                <p className="text-sm text-muted mt-1">{selectedPortfolio.name}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowAddStock(!showAddStock)}
                className="text-primary h-10 px-4 touch-target"
                variant="ghost"
                size="sm"
              >
                <Plus className="mr-1" size={16} />
                Add Stock
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => refreshWatchlistMutation.mutate()}
                disabled={refreshWatchlistMutation.isPending || isRefreshing}
                className="touch-target"
              >
                <RefreshCw className={`h-4 w-4 ${(refreshWatchlistMutation.isPending || isRefreshing) ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Portfolio Selector */}
          <div className="mb-6">
            <PortfolioSelector 
              selectedPortfolioId={selectedPortfolioId}
              onPortfolioChange={setSelectedPortfolioId}
            />
          </div>

          {/* Add Stock Interface */}
          {showAddStock && (
            <Card className="p-4 mb-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={16} />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stocks by symbol or company name..."
                    className="pl-10"
                  />
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
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => addToWatchlistMutation.mutate(stock.symbol)}
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">{stock.symbol}</h4>
                          <p className="text-sm text-muted">{stock.name}</p>
                        </div>
                        <Button size="sm" disabled={addToWatchlistMutation.isPending}>
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Watchlist Stocks */}
          {watchlistLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {watchlist && !watchlistLoading && (
            <div className="space-y-3">
              {watchlist.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted mb-4">Your watchlist is empty</p>
                  <Button onClick={() => setShowAddStock(true)}>
                    <Plus className="mr-2" size={16} />
                    Add Your First Stock
                  </Button>
                </div>
              )}
              {watchlist.map((stock) => (
                <StockCard
                  key={stock.symbol}
                  stock={stock}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <ChatInterface />
      <BottomNavigation />
    </div>
  );
}
