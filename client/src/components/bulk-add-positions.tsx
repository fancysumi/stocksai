import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePortfolio } from "@/contexts/portfolio-context";
import { Card } from "@/components/ui/card";
import { Upload, AlertCircle } from "lucide-react";

interface BulkAddPositionsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedPosition {
  symbol: string;
  shares: number;
  avgPrice: number;
  error?: string;
}

export function BulkAddPositions({ isOpen, onClose }: BulkAddPositionsProps) {
  const [rawData, setRawData] = useState("");
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("");
  const [parsedPositions, setParsedPositions] = useState<ParsedPosition[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { portfolios } = usePortfolio();

  const parsePositions = () => {
    const lines = rawData.trim().split('\n');
    const positions: ParsedPosition[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Try different parsing formats
      // Format 1: "AAPL,100,150.25" (symbol,shares,price)
      // Format 2: "AAPL 100 150.25" (space separated)
      // Format 3: "AAPL\t100\t150.25" (tab separated)
      const parts = line.split(/[,\t\s]+/).filter(part => part.length > 0);
      
      if (parts.length >= 3) {
        const symbol = parts[0].toUpperCase().replace(/[^A-Z]/g, '');
        const shares = parseFloat(parts[1]);
        const avgPrice = parseFloat(parts[2]);
        
        if (symbol && !isNaN(shares) && !isNaN(avgPrice) && shares > 0 && avgPrice > 0) {
          positions.push({ symbol, shares, avgPrice });
        } else {
          positions.push({ 
            symbol: parts[0], 
            shares: 0, 
            avgPrice: 0, 
            error: `Invalid data format on line ${i + 1}` 
          });
        }
      } else {
        positions.push({ 
          symbol: line, 
          shares: 0, 
          avgPrice: 0, 
          error: `Incomplete data on line ${i + 1}` 
        });
      }
    }
    
    setParsedPositions(positions);
    setShowPreview(true);
  };

  const bulkAddMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPortfolioId) throw new Error("No portfolio selected");
      
      const validPositions = parsedPositions.filter(p => !p.error);
      const results = [];
      
      for (const position of validPositions) {
        try {
          const result = await apiRequest("POST", "/api/portfolio", {
            stockSymbol: position.symbol,
            shares: position.shares,
            avgPrice: position.avgPrice,
            portfolioId: parseInt(selectedPortfolioId),
          });
          results.push(result);
        } catch (error) {
          console.error(`Failed to add ${position.symbol}:`, error);
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      toast({
        title: "Positions Added",
        description: `Successfully added ${results.length} positions to your portfolio.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/summary"] });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add some positions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setRawData("");
    setSelectedPortfolioId("");
    setParsedPositions([]);
    setShowPreview(false);
    onClose();
  };

  const validPositions = parsedPositions.filter(p => !p.error);
  const invalidPositions = parsedPositions.filter(p => p.error);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Add Existing Portfolio</span>
          </DialogTitle>
        </DialogHeader>
        
        {!showPreview ? (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Select Portfolio</Label>
              <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a portfolio" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map((portfolio) => (
                    <SelectItem key={portfolio.id} value={portfolio.id.toString()}>
                      {portfolio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Portfolio Data</Label>
              <p className="text-xs text-gray-600 mt-1 mb-2">
                Enter your positions one per line. Supported formats:
              </p>
              <div className="text-xs text-gray-500 mb-3 space-y-1">
                <div>• AAPL,100,150.25 (symbol,shares,average_price)</div>
                <div>• AAPL 100 150.25 (space separated)</div>
                <div>• AAPL	100	150.25 (tab separated)</div>
              </div>
              <Textarea
                placeholder={`AAPL,100,150.25
MSFT,50,300.00
GOOGL,25,2500.00
TSLA,75,200.50`}
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                className="min-h-32 font-mono text-sm"
                rows={8}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={parsePositions}
                disabled={!rawData.trim() || !selectedPortfolioId}
                className="flex-1"
              >
                Preview Positions
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Position Preview</h3>
              
              {validPositions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-green-700 mb-2">
                    Valid Positions ({validPositions.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {validPositions.map((position, index) => (
                      <Card key={index} className="p-3 bg-green-50 border-green-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-semibold">{position.symbol}</span>
                            <span className="text-sm text-gray-600 ml-2">
                              {position.shares.toLocaleString()} shares @ ${position.avgPrice.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-sm font-medium">
                            ${(position.shares * position.avgPrice).toLocaleString()}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {invalidPositions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Invalid Entries ({invalidPositions.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {invalidPositions.map((position, index) => (
                      <Card key={index} className="p-3 bg-red-50 border-red-200">
                        <div className="text-sm">
                          <span className="font-medium text-red-800">{position.symbol}</span>
                          <span className="text-red-600 ml-2">{position.error}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Total Valid Positions:</span>
                <span className="font-semibold">{validPositions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Value:</span>
                <span className="font-semibold">
                  ${validPositions.reduce((sum, p) => sum + (p.shares * p.avgPrice), 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
                className="flex-1"
              >
                Back to Edit
              </Button>
              <Button
                onClick={() => bulkAddMutation.mutate()}
                disabled={validPositions.length === 0 || bulkAddMutation.isPending}
                className="flex-1 bg-success hover:bg-success/90"
              >
                {bulkAddMutation.isPending ? 'Adding Positions...' : `Add ${validPositions.length} Positions`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}