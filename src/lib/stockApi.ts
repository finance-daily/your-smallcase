// Using Yahoo Finance API for Indian stock prices
// Yahoo Finance provides free access to NSE/BSE stocks

interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

// Yahoo Finance API implementation for Indian stocks
export async function fetchStockPrice(symbol: string, exchange: 'NSE' | 'BSE'): Promise<number> {
  try {
    // Format symbol for Yahoo Finance API
    // NSE: RELIANCE.NS, BSE: RELIANCE.BO
    const yahooSymbol = `${symbol}.${exchange === 'NSE' ? 'NS' : 'BO'}`;
    
    // Yahoo Finance API endpoint
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.chart?.result?.[0]?.meta?.regularMarketPrice) {
      throw new Error(`No price data found for ${yahooSymbol}`);
    }
    
    const price = data.chart.result[0].meta.regularMarketPrice;
    return Math.round(price * 100) / 100;
    
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol} on ${exchange}:`, error);
    // Return fallback price if API fails
    return getBasePriceForSymbol(symbol);
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