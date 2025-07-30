
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// GET /api/stock/:symbol - Get current stock price
app.get('/api/stock/:symbol', async (req, res) => {
  const { symbol } = req.params;
  
  try {
    // Method 1: Try NSE first
    try {
      const nseResponse = await axios.get(`https://www.nseindia.com/api/quote-equity?symbol=${symbol.toUpperCase()}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.nseindia.com/'
        },
        timeout: 10000
      });

      const data = nseResponse.data;
      return res.json({
        symbol: symbol.toUpperCase(),
        price: data.priceInfo?.lastPrice || null,
        change: data.priceInfo?.change || null,
        changePercent: data.priceInfo?.pChange || null,
        exchange: 'NSE',
        timestamp: new Date().toISOString()
      });
    } catch (nseError) {
      console.log('NSE failed, trying Google Finance...');
    }

    // Method 2: Fallback to Google Finance
    const googleResponse = await axios.get(`https://www.google.com/finance/quote/${symbol}:NSE`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(googleResponse.data);
    
    // Extract price from Google Finance page
    const priceText = $('[data-last-price]').attr('data-last-price');
    const changeText = $('[data-last-normal-market-change]').attr('data-last-normal-market-change');
    const changePercentText = $('[data-last-normal-market-change-percent]').attr('data-last-normal-market-change-percent');

    res.json({
      symbol: symbol.toUpperCase(),
      price: priceText ? parseFloat(priceText) : null,
      change: changeText ? parseFloat(changeText) : null,
      changePercent: changePercentText ? parseFloat(changePercentText) : null,
      exchange: 'NSE',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch stock price',
      symbol: symbol.toUpperCase(),
      message: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Stock proxy server running on http://localhost:${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/stock/RELIANCE`);
});