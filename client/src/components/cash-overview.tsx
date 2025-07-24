import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, AlertCircle, Target } from "lucide-react";
import { usePortfolio } from "@/contexts/portfolio-context";

export function CashOverview() {
  const { portfolios, selectedPortfolio } = usePortfolio();

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const totalCash = portfolios.reduce((sum, portfolio) => sum + parseFloat(portfolio.cashBalance), 0);
  const deployableAmount = totalCash * 0.1; // Suggest 10% deployment
  const hasLowBalancePortfolios = portfolios.some(p => parseFloat(p.cashBalance) < 1000);

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">Total Available Cash</h3>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalCash.toString())}
            </p>
          </div>
        </div>
        
        {hasLowBalancePortfolios && (
          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
            <AlertCircle className="w-3 h-3 mr-1" />
            Low Balance
          </Badge>
        )}
      </div>

      {/* Portfolio Breakdown */}
      <div className="space-y-2 mb-4">
        {portfolios.map((portfolio) => {
          const balance = parseFloat(portfolio.cashBalance);
          const percentage = totalCash > 0 ? (balance / totalCash) * 100 : 0;
          const isLow = balance < 1000;
          
          return (
            <div key={portfolio.id} className="flex items-center justify-between py-2 border-b border-blue-100 last:border-b-0">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">{portfolio.name}</span>
                  {isLow && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                      Low
                    </Badge>
                  )}
                </div>
                <div className="w-full bg-blue-100 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
              </div>
              <div className="ml-4 text-right">
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(balance.toString())}
                </span>
                <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deployment Suggestion */}
      {totalCash > 500 && (
        <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Ready for AI Deployment</p>
                <p className="text-xs text-blue-700">
                  Claude suggests {formatCurrency(deployableAmount.toFixed(2))} deployment
                </p>
              </div>
            </div>
            <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
              <TrendingUp className="w-3 h-3 mr-1" />
              Deploy
            </Badge>
          </div>
        </div>
      )}
    </Card>
  );
}