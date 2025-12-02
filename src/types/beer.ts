export interface BeerBatch {
  id: string;
  lot: string;
  quantity: number;
  expirationDate: string;
}

export interface Beer {
  id: string;
  name: string;
  batches: BeerBatch[];
}

export type ExpirationFilter = 'all' | 'critical' | '15days' | '30days' | '60days' | '120days';
