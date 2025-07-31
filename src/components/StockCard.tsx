import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stock } from "@/lib/db";
import { calculateAbsoluteReturn, formatCurrency, formatPercentage } from "@/lib/calculations";
import { MoreVertical, TrendingUp, TrendingDown, Calendar, Hash } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface StockCardProps {
  stock: Stock;
  priceMap: Map<string, number>;
  onEdit: (stock: Stock) => void;
  onDelete: (stock: Stock) => void;
}

export function StockCard({ stock, priceMap, onEdit, onDelete }: StockCardProps) {
  const returns = calculateAbsoluteReturn(stock, priceMap);
  const isPositive = returns.absoluteReturn >= 0;
  const currentPrice = priceMap.get(stock.symbol) || stock.buyPrice;

  return (
    <Card className="bg-gradient-card border-border/50 shadow-card hover:shadow-financial transition-all duration-300 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold text-card-foreground">
            {stock.symbol}
          </CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(stock)}>
              Edit Stock
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(stock)}
              className="text-destructive"
            >
              Delete Stock
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Price</p>
            <p className="font-semibold text-card-foreground">
              {formatCurrency(currentPrice)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Buy Price</p>
            <p className="font-semibold text-card-foreground">
              {formatCurrency(stock.buyPrice)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Quantity</p>
              <p className="font-semibold text-card-foreground">{stock.quantity}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-semibold text-card-foreground">
                {new Date(stock.purchaseDate).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Invested</span>
            <span className="font-semibold text-card-foreground">
              {formatCurrency(returns.totalInvested)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Current Value</span>
            <span className="font-semibold text-card-foreground">
              {formatCurrency(returns.currentValue)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Returns</span>
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-financial-green" />
              ) : (
                <TrendingDown className="h-4 w-4 text-financial-red" />
              )}
              <span className={`font-semibold ${isPositive ? 'text-financial-green' : 'text-financial-red'}`}>
                {formatCurrency(returns.absoluteReturn)} ({formatPercentage(returns.absoluteReturnPercent)})
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}