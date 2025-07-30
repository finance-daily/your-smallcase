import Dexie, { Table } from 'dexie';

export interface Stock {
  id?: number;
  symbol: string;
  buyPrice: number;
  quantity: number;
  purchaseDate: string;
  basketId: number;
  currentPrice?: number;
  lastPriceUpdate?: string;
}

export interface Basket {
  id?: number;
  name: string;
  createdAt: string;
  color?: string;
}

export interface PriceCache {
  id?: number;
  symbol: string;
  price: number;
  lastUpdate: string;
}

export class PortfolioDatabase extends Dexie {
  stocks!: Table<Stock>;
  baskets!: Table<Basket>;
  priceCache!: Table<PriceCache>;

  constructor() {
    super('PortfolioDatabase');
    this.version(1).stores({
      stocks: '++id, symbol, basketId, purchaseDate',
      baskets: '++id, name, createdAt',
      priceCache: '++id, symbol, lastUpdate'
    });
  }
}

export const db = new PortfolioDatabase();