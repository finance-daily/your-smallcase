import axios from 'axios';
import * as cheerio from 'cheerio';

const handler = async (event, context) => {
  const symbol = event.path.split('/').pop();

  if (!symbol) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Symbol is required' })
    };
  }

  try {
    // Method 1: Try NSE first
    try {
      const nseResponse = await axios.get(`https://www.nseindia.com/api/quote-equity?symbol=${symbol.toUpperCase()}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Referer': 'https://www.nseindia.com/'
          },
          timeout: 10000
        }
      );
      const data = nseResponse.data;
      return {
        statusCode: 200,
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          price: data.priceInfo?.lastPrice || null,
          change: data.priceInfo?.change || null,
          changePercent: data.priceInfo?.pChange || null,
          exchange: 'NSE',
          timestamp: new Date().toISOString()
        })
      };
    } catch (nseError) {
      // Fallback to Google Finance
    }

    const googleResponse = await axios.get(`https://www.google.com/finance/quote/${symbol}:NSE`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    const $ = cheerio.load(googleResponse.data);
    const priceText = $('[data-last-price]').attr('data-last-price');
    const changeText = $('[data-last-normal-market-change]').attr('data-last-normal-market-change');
    const changePercentText = $('[data-last-normal-market-change-percent]').attr('data-last-normal-market-change-percent');
    return {
      statusCode: 200,
      body: JSON.stringify({
        symbol: symbol.toUpperCase(),
        price: priceText ? parseFloat(priceText) : null,
        change: changeText ? parseFloat(changeText) : null,
        changePercent: changePercentText ? parseFloat(changePercentText) : null,
        exchange: 'NSE',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fetch stock price',
        symbol: symbol.toUpperCase(),
        message: error.message
      })
    };
  }
}

export { handler };
