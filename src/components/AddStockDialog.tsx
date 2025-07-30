import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stock } from "@/lib/db";

interface AddStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (stock: Omit<Stock, 'id'>) => Promise<void>;
  basketId: number;
  stock?: Stock;
}

export function AddStockDialog({ open, onOpenChange, onSave, basketId, stock }: AddStockDialogProps) {
  const [formData, setFormData] = useState({
    symbol: stock?.symbol || "",
    buyPrice: stock?.buyPrice.toString() || "",
    quantity: stock?.quantity.toString() || "",
    purchaseDate: stock?.purchaseDate || new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.symbol.trim() || !formData.buyPrice || !formData.quantity || !formData.purchaseDate) {
      return;
    }
    
    setIsLoading(true);
    try {
      await onSave({
        symbol: formData.symbol.trim().toUpperCase(),
        buyPrice: parseFloat(formData.buyPrice),
        quantity: parseInt(formData.quantity),
        purchaseDate: formData.purchaseDate,
        basketId
      });
      
      if (!stock) {
        setFormData({
          symbol: "",
          buyPrice: "",
          quantity: "",
          purchaseDate: new Date().toISOString().split('T')[0]
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save stock:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !stock) {
      setFormData({
        symbol: "",
        buyPrice: "",
        quantity: "",
        purchaseDate: new Date().toISOString().split('T')[0]
      });
    }
    onOpenChange(newOpen);
  };

  const isValid = formData.symbol.trim() && formData.buyPrice && formData.quantity && formData.purchaseDate;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {stock ? "Edit Stock" : "Add New Stock"}
          </DialogTitle>
          <DialogDescription>
            {stock 
              ? "Update the details of your stock entry."
              : "Add a new stock to your basket."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="symbol" className="text-right">
              Symbol
            </Label>
            <Input
              id="symbol"
              value={formData.symbol}
              onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
              className="col-span-3"
              placeholder="RELIANCE"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="buyPrice" className="text-right">
              Buy Price
            </Label>
            <Input
              id="buyPrice"
              type="number"
              step="0.01"
              value={formData.buyPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, buyPrice: e.target.value }))}
              className="col-span-3"
              placeholder="2500.00"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              className="col-span-3"
              placeholder="10"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="purchaseDate" className="text-right">
              Date
            </Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isValid || isLoading}
          >
            {isLoading ? "Saving..." : stock ? "Update" : "Add Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}