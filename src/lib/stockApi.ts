// Yahoo Finance API implementation for Indian stocks
export async function fetchStockPrice(symbol: string): Promise<number> {
  const url = `/api/stock/${encodeURIComponent(symbol)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch stock price for ${symbol}: ${response.status}`);
  }
  const data = await response.json();
  if (typeof data.price !== 'number') {
    throw new Error(`Invalid price returned for ${symbol}`);
  }
  return Math.round(data.price * 100) / 100;
}


export async function fetchMultipleStockPrices(symbols: Array<{ symbol: string}>): Promise<Map<string, number>> {
  const prices = new Map<string, number>();

  // Batch fetch for better performance
  const promises = symbols.map(async ({ symbol }) => {
    try {
      const price = await fetchStockPrice(symbol);
      prices.set(symbol, price);
    } catch (error) {
      console.error(`Failed to fetch ${symbol}:`, error);
    }
  });

  await Promise.allSettled(promises);
  return prices;
}