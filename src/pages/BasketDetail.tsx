import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, RefreshCw, TrendingUp } from "lucide-react";
import { db, Basket, Stock } from "@/lib/db";
import { StockCard } from "@/components/StockCard";
import { AddStockDialog } from "@/components/AddStockDialog";
import { useToast } from "@/hooks/use-toast";
import { fetchMultipleStockPrices } from "@/lib/stockApi";
import { calculatePortfolioReturns, formatCurrency, formatPercentage } from "@/lib/calculations";

const BasketDetail = () => {
  const { basketId } = useParams<{ basketId: string }>();
  const navigate = useNavigate();
  const [basket, setBasket] = useState<Basket | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [showAddStock, setShowAddStock] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | undefined>();
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (basketId) {
      loadBasket();
      loadStocks();
    }
  }, [basketId]);

  useEffect(() => {
    // Update prices every minute
    const interval = setInterval(() => {
      updateStockPrices();
    }, 60000);

    // Initial price update
    updateStockPrices();

    return () => clearInterval(interval);
  }, []); // Remove dependency to prevent infinite loop

  const loadBasket = async () => {
    try {
      const basketData = await db.baskets.get(parseInt(basketId!));
      setBasket(basketData || null);
    } catch (error) {
      console.error("Failed to load basket:", error);
    }
  };

  const loadStocks = async () => {
    try {
      const stocksData = await db.stocks.where('basketId').equals(parseInt(basketId!)).toArray();
      setStocks(stocksData);
    } catch (error) {
      console.error("Failed to load stocks:", error);
    }
  };

  const updateStockPrices = async () => {
    if (stocks.length === 0) return;
    
    setIsUpdatingPrices(true);
    try {
      const uniqueSymbols = Array.from(new Set(stocks.map(s => s.symbol)));
      const prices = await fetchMultipleStockPrices(uniqueSymbols.map(symbol => ({ symbol })));
      // Update stocks with new prices
      const updatedStocks = stocks.map(stock => ({
        ...stock,
        currentPrice: prices.get(stock.symbol) || stock.currentPrice,
        lastPriceUpdate: new Date().toISOString()
      }));
      
      // Update database
      await Promise.all(
        updatedStocks.map(stock => 
          db.stocks.update(stock.id!, { 
            currentPrice: stock.currentPrice, 
            lastPriceUpdate: stock.lastPriceUpdate 
          })
        )
      );
      
      setStocks(updatedStocks);
      
    } catch (error) {
      console.error("Failed to update prices:", error);
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  const handleAddStock = async (stockData: Omit<Stock, 'id'>) => {
    try {
      await db.stocks.add(stockData);
      await loadStocks();
      toast({
        title: "Stock added",
        description: `${stockData.symbol} has been added to ${basket?.name}.`,
      });
    } catch (error) {
      console.error("Failed to add stock:", error);
      toast({
        title: "Error",
        description: "Failed to add stock. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditStock = async (stockData: Omit<Stock, 'id'>) => {
    if (!editingStock?.id) return;
    
    try {
      await db.stocks.update(editingStock.id, stockData);
      await loadStocks();
      setEditingStock(undefined);
      toast({
        title: "Stock updated",
        description: `${stockData.symbol} has been updated.`,
      });
    } catch (error) {
      console.error("Failed to update stock:", error);
      toast({
        title: "Error",
        description: "Failed to update stock. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStock = async (stock: Stock) => {
    if (!stock.id) return;
    
    try {
      await db.stocks.delete(stock.id);
      await loadStocks();
      toast({
        title: "Stock removed",
        description: `${stock.symbol} has been removed from ${basket?.name}.`,
      });
    } catch (error) {
      console.error("Failed to delete stock:", error);
      toast({
        title: "Error",
        description: "Failed to remove stock. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!basket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Basket not found</h2>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const returns = calculatePortfolioReturns(stocks);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{basket.name}</h1>
              <p className="text-sm text-muted-foreground">
                {stocks.length} stock{stocks.length !== 1 ? 's' : ''} in this basket
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={updateStockPrices}
              disabled={isUpdatingPrices}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isUpdatingPrices ? 'animate-spin' : ''}`} />
              {isUpdatingPrices ? 'Updating...' : 'Refresh'}
            </Button>
            <Button onClick={() => setShowAddStock(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Stock
            </Button>
          </div>
        </div>

        {/* Basket Summary */}
        {stocks.length > 0 && (
          <div className="bg-gradient-card border border-border/50 rounded-lg p-6 mb-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-card-foreground">Basket Performance</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-xl font-bold text-card-foreground">{formatCurrency(returns.totalInvested)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-xl font-bold text-card-foreground">{formatCurrency(returns.currentValue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Absolute Return</p>
                <p className={`text-xl font-bold ${returns.absoluteReturn >= 0 ? 'text-financial-green' : 'text-financial-red'}`}>
                  {formatCurrency(returns.absoluteReturn)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Return %</p>
                <p className={`text-xl font-bold ${returns.absoluteReturnPercent >= 0 ? 'text-financial-green' : 'text-financial-red'}`}>
                  {formatPercentage(returns.absoluteReturnPercent)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stocks Grid */}
        {stocks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stocks.map((stock) => (
              <StockCard
                key={stock.id}
                stock={stock}
                onEdit={setEditingStock}
                onDelete={handleDeleteStock}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-gradient-primary rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Plus className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No stocks yet</h3>
              <p className="text-muted-foreground mb-6">
                Add your first stock to start tracking performance in this basket.
              </p>
              <Button onClick={() => setShowAddStock(true)} size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Add Your First Stock
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddStockDialog
        open={showAddStock}
        onOpenChange={setShowAddStock}
        onSave={handleAddStock}
        basketId={parseInt(basketId!)}
      />
      
      <AddStockDialog
        open={!!editingStock}
        onOpenChange={(open) => !open && setEditingStock(undefined)}
        onSave={handleEditStock}
        basketId={parseInt(basketId!)}
        stock={editingStock}
      />
    </div>
  );
};

export default BasketDetail;