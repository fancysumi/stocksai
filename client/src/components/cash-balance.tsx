import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DollarSign, Plus, Minus, TrendingUp } from "lucide-react";

interface CashBalanceProps {
  portfolioName: string;
  cashBalance: string;
  onUpdateBalance?: (newBalance: string, type: 'deposit' | 'withdraw') => void;
}

export function CashBalance({ portfolioName, cashBalance, onUpdateBalance }: CashBalanceProps) {
  const [showAddCash, setShowAddCash] = useState(false);
  const [amount, setAmount] = useState("");
  const [isDeposit, setIsDeposit] = useState(true);

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const handleUpdateBalance = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    const currentBalance = parseFloat(cashBalance);
    const changeAmount = parseFloat(amount);
    
    if (!isDeposit && changeAmount > currentBalance) {
      // Handle insufficient funds
      return;
    }
    
    const newBalance = isDeposit 
      ? (currentBalance + changeAmount).toFixed(2)
      : (currentBalance - changeAmount).toFixed(2);
      
    onUpdateBalance?.(newBalance, isDeposit ? 'deposit' : 'withdraw');
    setAmount("");
    setShowAddCash(false);
  };

  const balanceNum = parseFloat(cashBalance);
  const isLowBalance = balanceNum < 1000;

  return (
    <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-600">Available Cash</h3>
              {isLowBalance && (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                  Low Balance
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(cashBalance)}
            </p>
            <p className="text-xs text-gray-500">{portfolioName}</p>
          </div>
        </div>

        <Dialog open={showAddCash} onOpenChange={setShowAddCash}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white hover:bg-gray-50 touch-target"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Manage
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[90vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Manage Cash Balance</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Current Balance</Label>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(cashBalance)}
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={isDeposit ? "default" : "outline"}
                  onClick={() => setIsDeposit(true)}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Deposit
                </Button>
                <Button
                  type="button"
                  variant={!isDeposit ? "default" : "outline"}
                  onClick={() => setIsDeposit(false)}
                  className="flex-1"
                >
                  <Minus className="w-4 h-4 mr-1" />
                  Withdraw
                </Button>
              </div>

              <div>
                <Label htmlFor="amount" className="text-sm font-medium">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1"
                  step="0.01"
                  min="0"
                />
                {!isDeposit && parseFloat(amount) > balanceNum && (
                  <p className="text-sm text-red-600 mt-1">
                    Insufficient funds. Available: {formatCurrency(cashBalance)}
                  </p>
                )}
              </div>

              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddCash(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateBalance}
                  disabled={!amount || parseFloat(amount) <= 0 || (!isDeposit && parseFloat(amount) > balanceNum)}
                  className="flex-1"
                >
                  {isDeposit ? 'Deposit' : 'Withdraw'} {amount && formatCurrency(amount)}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick deployment suggestion */}
      {balanceNum > 500 && (
        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Ready for deployment</span>
            <Badge variant="secondary" className="text-green-700 bg-green-100">
              {formatCurrency((balanceNum * 0.1).toFixed(2))} suggested
            </Badge>
          </div>
        </div>
      )}
    </Card>
  );
}