import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Portfolio } from "@shared/schema";
import { usePortfolio } from "@/contexts/portfolio-context";
import { Plus, Settings, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PortfolioSelectorProps {
  selectedPortfolioId: number | null;
  onPortfolioChange: (portfolioId: number) => void;
}

export function PortfolioSelector({ selectedPortfolioId, onPortfolioChange }: PortfolioSelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [newPortfolioDescription, setNewPortfolioDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use portfolios from context instead of API for now
  const { portfolios, isLoading: contextLoading } = usePortfolio();
  const isLoading = contextLoading;

  const createPortfolioMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return apiRequest("POST", "/api/portfolios", data);
    },
    onSuccess: () => {
      toast({
        title: "Portfolio Created",
        description: "New portfolio created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      setShowCreateDialog(false);
      setNewPortfolioName("");
      setNewPortfolioDescription("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create portfolio.",
        variant: "destructive",
      });
    },
  });

  const selectedPortfolio = portfolios?.find(p => p.id === selectedPortfolioId);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Select 
        value={selectedPortfolioId?.toString() || ""} 
        onValueChange={(value) => onPortfolioChange(parseInt(value))}
      >
        <SelectTrigger className="w-48 h-10">
          <SelectValue placeholder="Select Portfolio">
            {selectedPortfolio ? (
              <div className="flex flex-col items-start">
                <span className="font-medium text-sm">{selectedPortfolio.name}</span>
                <span className="text-xs text-green-600 font-medium">
                  ${parseFloat(selectedPortfolio.cashBalance).toLocaleString()} available
                </span>
              </div>
            ) : (
              "Select Portfolio"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {portfolios?.map((portfolio) => (
            <SelectItem key={portfolio.id} value={portfolio.id.toString()}>
              <div className="flex flex-col items-start py-1">
                <span className="font-medium">{portfolio.name}</span>
                {portfolio.description && (
                  <span className="text-xs text-muted">{portfolio.description}</span>
                )}
                <span className="text-xs text-green-600 font-medium">
                  ${parseFloat(portfolio.cashBalance).toLocaleString()} available
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 px-3 touch-target"
          >
            <Plus size={16} />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Portfolio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Portfolio Name</label>
              <Input
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                placeholder="e.g., Retirement, Growth, Dividend"
                className="h-12"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
              <Input
                value={newPortfolioDescription}
                onChange={(e) => setNewPortfolioDescription(e.target.value)}
                placeholder="Brief description of this portfolio's strategy"
                className="h-12"
              />
            </div>
            <div className="flex space-x-2 pt-2">
              <Button
                onClick={() => setShowCreateDialog(false)}
                variant="outline"
                className="flex-1 h-12"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createPortfolioMutation.mutate({
                  name: newPortfolioName,
                  description: newPortfolioDescription || undefined
                })}
                disabled={!newPortfolioName.trim() || createPortfolioMutation.isPending}
                className="flex-1 h-12 bg-success hover:bg-success/90 text-white"
              >
                Create Portfolio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}