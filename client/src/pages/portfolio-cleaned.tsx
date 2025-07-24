import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ChatInterface } from "@/components/chat-interface";
import { PortfolioSummary } from "@/components/portfolio-summary";
import { AddPortfolioPosition } from "@/components/add-portfolio-position";
import { PortfolioSelector } from "@/components/portfolio-selector";
import { CashBalance } from "@/components/cash-balance";
import { PortfolioHoldings } from "@/components/portfolio-holdings";
import { usePortfolio } from "@/contexts/portfolio-context";

export default function Portfolio() {
  const [showAddPosition, setShowAddPosition] = useState(false);
  const { toast } = useToast();
  const { selectedPortfolio, selectedPortfolioId, setSelectedPortfolioId } = usePortfolio();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
      <main className="px-4 pt-6">
        <section className="max-w-sm mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
            <Button
              onClick={() => setShowAddPosition(true)}
              className="bg-success hover:bg-success/90 text-white px-3 py-2 touch-target"
            >
              <Plus size={16} className="mr-1" />
              Add Position
            </Button>
          </div>

          {/* Portfolio Selector */}
          <div className="mb-6">
            <PortfolioSelector 
              selectedPortfolioId={selectedPortfolioId}
              onPortfolioChange={setSelectedPortfolioId}
            />
          </div>

          {/* Cash Balance */}
          {selectedPortfolio && (
            <div className="mb-6">
              <CashBalance
                portfolioName={selectedPortfolio.name}
                cashBalance={selectedPortfolio.cashBalance}
                onUpdateBalance={(newBalance, type) => {
                  toast({
                    title: `Cash ${type === 'deposit' ? 'Deposited' : 'Withdrawn'}`,
                    description: `${type === 'deposit' ? 'Added' : 'Removed'} $${Math.abs(parseFloat(newBalance) - parseFloat(selectedPortfolio.cashBalance)).toFixed(2)} ${type === 'deposit' ? 'to' : 'from'} ${selectedPortfolio.name}`,
                  });
                }}
              />
            </div>
          )}

          {/* Portfolio Summary */}
          <PortfolioSummary />

          {/* Portfolio Holdings */}
          <PortfolioHoldings />

        </section>
      </main>

      <AddPortfolioPosition 
        isOpen={showAddPosition}
        onClose={() => setShowAddPosition(false)}
      />
      <ChatInterface />
      <BottomNavigation />
    </div>
  );
}