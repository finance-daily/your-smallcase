import { Stock } from './db';

export interface ReturnData {
  absoluteReturn: number;
  absoluteReturnPercent: number;
  xirr: number;
  totalInvested: number;
  currentValue: number;
}

export function calculateAbsoluteReturn(stock: Stock, priceMap: Map<string, number>): ReturnData {
  const totalInvested = stock.buyPrice * stock.quantity;
  const currentValue = (priceMap.get(stock.symbol) || stock.buyPrice) * stock.quantity;
  const absoluteReturn = currentValue - totalInvested;
  const absoluteReturnPercent = (absoluteReturn / totalInvested) * 100;

  return {
    absoluteReturn,
    absoluteReturnPercent,
    xirr: 0, // Will calculate separately for portfolio
    totalInvested,
    currentValue
  };
}

export function calculatePortfolioReturns(stocks: Stock[], priceMap: Map<string, number>): ReturnData {
  const totalInvested = stocks.reduce((sum, stock) => sum + (stock.buyPrice * stock.quantity), 0);
  const currentValue = stocks.reduce((sum, stock) => sum + ((priceMap.get(stock.symbol) || stock.buyPrice) * stock.quantity), 0);
  const absoluteReturn = currentValue - totalInvested;
  const absoluteReturnPercent = totalInvested > 0 ? (absoluteReturn / totalInvested) * 100 : 0;

  // Calculate XIRR
  const xirr = calculateXIRR(stocks, priceMap);

  return {
    absoluteReturn,
    absoluteReturnPercent,
    xirr,
    totalInvested,
    currentValue
  };
}

export function calculateXIRR(stocks: Stock[], priceMap: Map<string, number>): number {
  if (stocks.length === 0) return 0;

  // Create cash flows for XIRR calculation
  const cashFlows: Array<{ date: Date; amount: number }> = [];
  
  // Add investment cash flows (negative)
  stocks.forEach(stock => {
    cashFlows.push({
      date: new Date(stock.purchaseDate),
      amount: -(stock.buyPrice * stock.quantity)
    });
  });
  
  // Add current value as final cash flow (positive)
  const currentValue = stocks.reduce((sum, stock) => 
    sum + ((priceMap.get(stock.symbol) || stock.buyPrice) * stock.quantity), 0
  );
  
  cashFlows.push({
    date: new Date(),
    amount: currentValue
  });

  // Sort cash flows by date
  cashFlows.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Simple XIRR approximation using Newton-Raphson method
  return approximateXIRR(cashFlows);
}

function approximateXIRR(cashFlows: Array<{ date: Date; amount: number }>): number {
  if (cashFlows.length < 2) return 0;

  let rate = 0.1; // Initial guess: 10%
  const maxIterations = 100;
  const tolerance = 1e-6;

  for (let i = 0; i < maxIterations; i++) {
    const { npv, derivative } = calculateNPVAndDerivative(cashFlows, rate);
    
    if (Math.abs(npv) < tolerance) {
      return rate * 100; // Convert to percentage
    }
    
    if (Math.abs(derivative) < tolerance) {
      break; // Avoid division by zero
    }
    
    rate = rate - npv / derivative;
    
    // Keep rate within reasonable bounds
    if (rate < -0.99) rate = -0.99;
    if (rate > 10) rate = 10;
  }

  return rate * 100; // Convert to percentage
}

function calculateNPVAndDerivative(
  cashFlows: Array<{ date: Date; amount: number }>, 
  rate: number
): { npv: number; derivative: number } {
  const firstDate = cashFlows[0].date;
  let npv = 0;
  let derivative = 0;

  cashFlows.forEach(({ date, amount }) => {
    const daysDiff = (date.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    const years = daysDiff / 365.25;
    
    const discountFactor = Math.pow(1 + rate, -years);
    npv += amount * discountFactor;
    derivative += -years * amount * discountFactor / (1 + rate);
  });

  return { npv, derivative };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(percentage: number): string {
  return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
}
