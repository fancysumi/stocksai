import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface MarketData {
  symbol: string;
  name: string;
  changePercent: string;
}

export function MarketOverview() {
  const { data: marketData, isLoading } = useQuery<MarketData[]>({
    queryKey: ["/api/market"],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="p-4 mb-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!marketData || marketData.length === 0) {
    return (
      <Card className="p-4 mb-4">
        <div className="text-center text-muted">
          <p>Market data unavailable</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Market Overview</h3>
        <span className="text-xs text-muted">Updated 2m ago</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {marketData.map((market) => (
          <div key={market.symbol} className="text-center">
            <p className="text-xs text-muted mb-1">{market.name}</p>
            <p className={`font-semibold ${
              parseFloat(market.changePercent) >= 0 ? "text-success" : "text-danger"
            }`}>
              {parseFloat(market.changePercent) >= 0 ? "+" : ""}{parseFloat(market.changePercent).toFixed(2)}%
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
