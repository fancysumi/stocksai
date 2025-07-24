import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PortfolioSummary {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalGain: number;
  totalGainPercent: number;
  buyingPower: number;
}

interface PortfolioHolding {
  stock: {
    symbol: string;
    name: string;
  };
  shares: string;
  currentValue: number;
  gainLoss: number;
  portfolioPercent: number;
}

export function PortfolioSummary() {
  const { data: summary, isLoading: summaryLoading } = useQuery<PortfolioSummary>({
    queryKey: ["/api/portfolio/summary"],
  });

  const { data: holdings, isLoading: holdingsLoading } = useQuery<PortfolioHolding[]>({
    queryKey: ["/api/portfolio"],
  });

  if (summaryLoading || holdingsLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!summary) {
    return (
      <Card className="p-4">
        <div className="text-center text-muted">
          <p>Portfolio data unavailable</p>
        </div>
      </Card>
    );
  }

  const dayChangeIsPositive = summary.dayChange >= 0;
  const totalGainIsPositive = summary.totalGain >= 0;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-gray-900">
              ${summary.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-sm ${dayChangeIsPositive ? "text-success" : "text-danger"}`}>
              {dayChangeIsPositive ? "+" : ""}${Math.abs(summary.dayChange).toFixed(2)} ({dayChangeIsPositive ? "+" : ""}{summary.dayChangePercent.toFixed(2)}%) today
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-muted mb-1">Total Gain/Loss</p>
              <p className={`font-semibold ${totalGainIsPositive ? "text-success" : "text-danger"}`}>
                {totalGainIsPositive ? "+" : ""}${Math.abs(summary.totalGain).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Buying Power</p>
              <p className="font-semibold text-gray-900">
                ${summary.buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {holdings && holdings.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Top Holdings</h3>
          {holdings.slice(0, 3).map((holding) => {
            const gainLossIsPositive = holding.gainLoss >= 0;
            return (
              <Card key={holding.stock.symbol} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{holding.stock.symbol}</h4>
                      <p className="text-xs text-muted">{holding.shares} shares</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${holding.currentValue.toFixed(2)}
                    </p>
                    <p className={`text-xs ${gainLossIsPositive ? "text-success" : "text-danger"}`}>
                      {gainLossIsPositive ? "+" : ""}${Math.abs(holding.gainLoss).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-primary h-1 rounded-full" 
                      style={{ width: `${Math.min(holding.portfolioPercent, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {holding.portfolioPercent.toFixed(1)}% of portfolio
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
