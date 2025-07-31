import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, TrendingUp, RefreshCw } from "lucide-react";
import { db, Basket, Stock } from "@/lib/db";
import { BasketCard } from "@/components/BasketCard";
import { CreateBasketDialog } from "@/components/CreateBasketDialog";
import { useToast } from "@/hooks/use-toast";
import { fetchMultipleStockPrices } from "@/lib/stockApi";
import { calculatePortfolioReturns, formatCurrency, formatPercentage } from "@/lib/calculations";

const Index = () => {
  const navigate = useNavigate();
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [basketStocks, setBasketStocks] = useState<Map<number, Stock[]>>(new Map());
  const [showCreateBasket, setShowCreateBasket] = useState(false);
  const [editingBasket, setEditingBasket] = useState<Basket | undefined>();
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBaskets();
    loadStocks();
  }, []);

  useEffect(() => {
    // Update prices every minute
    const interval = setInterval(() => {
      updateStockPrices();
    }, 60000);

    // Initial price update
    updateStockPrices();

    return () => clearInterval(interval);
  }, []); // Remove dependency to prevent infinite loop

  const loadBaskets = async () => {
    try {
      const basketsData = await db.baskets.orderBy('createdAt').toArray();
      setBaskets(basketsData);
    } catch (error) {
      console.error("Failed to load baskets:", error);
    }
  };

  const loadStocks = async () => {
    try {
      const stocksData = await db.stocks.toArray();
      setAllStocks(stocksData);
      
      // Group stocks by basket
      const grouped = new Map<number, Stock[]>();
      stocksData.forEach(stock => {
        if (!grouped.has(stock.basketId)) {
          grouped.set(stock.basketId, []);
        }
        grouped.get(stock.basketId)!.push(stock);
      });
      setBasketStocks(grouped);
    } catch (error) {
      console.error("Failed to load stocks:", error);
    }
  };

  const updateStockPrices = async () => {
    if (allStocks.length === 0) return;
    
    setIsUpdatingPrices(true);
    try {
      const uniqueSymbols = Array.from(new Set(allStocks.map(s => s.symbol)));
      const prices = await fetchMultipleStockPrices(uniqueSymbols.map(symbol => ({ symbol })));
      // Update stocks with new prices
      const updatedStocks = allStocks.map(stock => ({
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
      
      setAllStocks(updatedStocks);
      
      // Regroup stocks
      const grouped = new Map<number, Stock[]>();
      updatedStocks.forEach(stock => {
        if (!grouped.has(stock.basketId)) {
          grouped.set(stock.basketId, []);
        }
        grouped.get(stock.basketId)!.push(stock);
      });
      setBasketStocks(grouped);
      
    } catch (error) {
      console.error("Failed to update prices:", error);
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  const handleCreateBasket = async (name: string) => {
    try {
      await db.baskets.add({
        name,
        createdAt: new Date().toISOString()
      });
      await loadBaskets();
      toast({
        title: "Basket created",
        description: `"${name}" has been created successfully.`,
      });
    } catch (error) {
      console.error("Failed to create basket:", error);
      toast({
        title: "Error",
        description: "Failed to create basket. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditBasket = async (name: string) => {
    if (!editingBasket?.id) return;
    
    try {
      await db.baskets.update(editingBasket.id, { name });
      await loadBaskets();
      setEditingBasket(undefined);
      toast({
        title: "Basket updated",
        description: `Basket renamed to "${name}".`,
      });
    } catch (error) {
      console.error("Failed to update basket:", error);
      toast({
        title: "Error",
        description: "Failed to update basket. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBasket = async (basket: Basket) => {
    if (!basket.id) return;
    
    try {
      // Delete all stocks in the basket first
      await db.stocks.where('basketId').equals(basket.id).delete();
      // Then delete the basket
      await db.baskets.delete(basket.id);
      await loadBaskets();
      await loadStocks();
      toast({
        title: "Basket deleted",
        description: `"${basket.name}" and all its stocks have been deleted.`,
      });
    } catch (error) {
      console.error("Failed to delete basket:", error);
      toast({
        title: "Error",
        description: "Failed to delete basket. Please try again.",
        variant: "destructive",
      });
    }
  };

  const portfolioReturns = calculatePortfolioReturns(allStocks);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Portfolio Tracker</h1>
              <p className="text-sm text-muted-foreground">Track your Indian stock investments</p>
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
            <Button onClick={() => setShowCreateBasket(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Basket
            </Button>
          </div>
        </div>

        {/* Portfolio Summary */}
        {allStocks.length > 0 && (
          <div className="bg-gradient-card border border-border/50 rounded-lg p-6 mb-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-card-foreground">Portfolio Overview</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-xl font-bold text-card-foreground">{formatCurrency(portfolioReturns.totalInvested)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-xl font-bold text-card-foreground">{formatCurrency(portfolioReturns.currentValue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Absolute Return</p>
                <p className={`text-xl font-bold ${portfolioReturns.absoluteReturn >= 0 ? 'text-financial-green' : 'text-financial-red'}`}>
                  {formatCurrency(portfolioReturns.absoluteReturn)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Return %</p>
                <p className={`text-xl font-bold ${portfolioReturns.absoluteReturnPercent >= 0 ? 'text-financial-green' : 'text-financial-red'}`}>
                  {formatPercentage(portfolioReturns.absoluteReturnPercent)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Baskets Grid */}
        {baskets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {baskets.map((basket) => (
              <BasketCard
                key={basket.id}
                basket={basket}
                stocks={basketStocks.get(basket.id!) || []}
                onEdit={setEditingBasket}
                onDelete={handleDeleteBasket}
                onClick={(basket) => navigate(`/basket/${basket.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-gradient-primary rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Wallet className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No baskets yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first basket to start tracking your stock investments.
              </p>
              <Button onClick={() => setShowCreateBasket(true)} size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create Your First Basket
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateBasketDialog
        open={showCreateBasket}
        onOpenChange={setShowCreateBasket}
        onSave={handleCreateBasket}
      />
      
      <CreateBasketDialog
        open={!!editingBasket}
        onOpenChange={(open) => !open && setEditingBasket(undefined)}
        onSave={handleEditBasket}
        basket={editingBasket}
      />
    </div>
  );
};

export default Index;
