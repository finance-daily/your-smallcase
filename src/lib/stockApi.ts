// Using a free API for Indian stock prices
// Note: In production, you might want to use paid APIs for better reliability

interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

// Mock API for demonstration - replace with actual API
export async function fetchStockPrice(symbol: string, exchange: 'NSE' | 'BSE'): Promise<number> {
  try {
    // Simulating API call with mock data
    // In real implementation, use APIs like Alpha Vantage, Yahoo Finance, or Indian market APIs
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Generate mock price based on symbol for consistency
    const basePrice = getBasePriceForSymbol(symbol);
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    return Math.round(basePrice * (1 + variation) * 100) / 100;
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error);
    throw error;
  }
}

export async function fetchMultipleStockPrices(symbols: Array<{symbol: string, exchange: 'NSE' | 'BSE'}>): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  
  // Batch fetch for better performance
  const promises = symbols.map(async ({ symbol, exchange }) => {
    try {
      const price = await fetchStockPrice(symbol, exchange);
      prices.set(`${symbol}-${exchange}`, price);
    } catch (error) {
      console.error(`Failed to fetch ${symbol}-${exchange}:`, error);
    }
  });
  
  await Promise.allSettled(promises);
  return prices;
}

// Helper function to generate consistent mock prices
function getBasePriceForSymbol(symbol: string): number {
  const symbolPrices: Record<string, number> = {
    'RELIANCE': 2500,
    'TCS': 3200,
    'HDFCBANK': 1400,
    'INFY': 1500,
    'HINDUNILVR': 2300,
    'ICICIBANK': 900,
    'SBIN': 550,
    'BHARTIARTL': 850,
    'ITC': 420,
    'KOTAKBANK': 1800,
    'LT': 2200,
    'AXISBANK': 750,
    'ASIANPAINT': 3100,
    'MARUTI': 9500,
    'SUNPHARMA': 1100,
  };
  
  return symbolPrices[symbol.toUpperCase()] || 1000 + (symbol.charCodeAt(0) * 10);
}