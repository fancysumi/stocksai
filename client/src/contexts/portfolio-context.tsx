import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Portfolio {
  id: number;
  name: string;
  description?: string;
  cashBalance: string;
  isDefault?: boolean;
}

interface PortfolioContextType {
  selectedPortfolioId: number | null;
  selectedPortfolio: Portfolio | null;
  portfolios: Portfolio[];
  setSelectedPortfolioId: (id: number) => void;
  isLoading: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}

interface PortfolioProviderProps {
  children: ReactNode;
}

export function PortfolioProvider({ children }: PortfolioProviderProps) {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);

  // Fetch portfolios from API
  const { data: portfolios = [], isLoading } = useQuery<Portfolio[]>({
    queryKey: ["/api/portfolios"],
  });

  // Set default portfolio on first load
  useEffect(() => {
    if (!selectedPortfolioId && portfolios.length > 0) {
      const defaultPortfolio = portfolios.find(p => p.isDefault) || portfolios[0];
      setSelectedPortfolioId(defaultPortfolio.id);
    }
  }, [selectedPortfolioId, portfolios]);

  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId) || null;

  return (
    <PortfolioContext.Provider
      value={{
        selectedPortfolioId,
        selectedPortfolio,
        portfolios,
        setSelectedPortfolioId,
        isLoading,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}