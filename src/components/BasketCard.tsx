import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Basket, Stock } from "@/lib/db";
import { calculatePortfolioReturns, formatCurrency, formatPercentage } from "@/lib/calculations";
import { MoreVertical, TrendingUp, TrendingDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface BasketCardProps {
  basket: Basket;
  stocks: Stock[];
  priceMap: Map<string, number>;
  onEdit: (basket: Basket) => void;
  onDelete: (basket: Basket) => void;
  onClick: (basket: Basket) => void;
}

export function BasketCard({ basket, stocks, onEdit, onDelete, onClick, priceMap }: BasketCardProps) {
  const returns = calculatePortfolioReturns(stocks, priceMap);
  const stockCount = stocks.length;
  
  const isPositive = returns.absoluteReturn >= 0;

  return (
    <Card 
      className="bg-gradient-card border-border/50 shadow-card hover:shadow-financial transition-all duration-300 cursor-pointer group"
      onClick={() => onClick(basket)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold text-card-foreground truncate">
          {basket.name}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(basket); }}>
              Edit Basket
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete(basket); }}
              className="text-destructive"
            >
              Delete Basket
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-xl font-bold text-card-foreground">
              {formatCurrency(returns.currentValue)}
            </p>
          </div>
          <Badge variant={stockCount > 0 ? "default" : "secondary"}>
            {stockCount} stock{stockCount !== 1 ? 's' : ''}
          </Badge>
        </div>

        {stockCount > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Invested</p>
              <p className="font-semibold text-card-foreground">
                {formatCurrency(returns.totalInvested)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Returns(XIRR)</p>
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-financial-green" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-financial-red" />
                )}
                <span className={`font-semibold ${isPositive ? 'text-financial-green' : 'text-financial-red'}`}>
                  {formatPercentage(returns.absoluteReturnPercent)}
                </span>
              </div>
            </div>
          </div>
        )}

        {stockCount === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No stocks added yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}