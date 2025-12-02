import { useState, useEffect } from 'react';
import { Beer, BeerBatch } from '@/types/beer';

const STORAGE_KEY = 'cerveja-lenta-beers';

export function useBeers() {
  const [beers, setBeers] = useState<Beer[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setBeers(JSON.parse(stored));
    }
  }, []);

  const saveBeers = (newBeers: Beer[]) => {
    setBeers(newBeers);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBeers));
  };

  const addBeer = (name: string, batch: Omit<BeerBatch, 'id'>) => {
    const existingBeer = beers.find(b => b.name.toLowerCase() === name.toLowerCase());
    
    if (existingBeer) {
      const updatedBeers = beers.map(beer => {
        if (beer.id === existingBeer.id) {
          return {
            ...beer,
            batches: [...beer.batches, { ...batch, id: crypto.randomUUID() }]
          };
        }
        return beer;
      });
      saveBeers(updatedBeers);
    } else {
      const newBeer: Beer = {
        id: crypto.randomUUID(),
        name,
        batches: [{ ...batch, id: crypto.randomUUID() }]
      };
      saveBeers([...beers, newBeer]);
    }
  };

  const deleteBatch = (beerId: string, batchId: string) => {
    const updatedBeers = beers.map(beer => {
      if (beer.id === beerId) {
        return {
          ...beer,
          batches: beer.batches.filter(b => b.id !== batchId)
        };
      }
      return beer;
    }).filter(beer => beer.batches.length > 0);
    
    saveBeers(updatedBeers);
  };

  const updateBatch = (beerId: string, batchId: string, updates: Partial<BeerBatch>) => {
    const updatedBeers = beers.map(beer => {
      if (beer.id === beerId) {
        return {
          ...beer,
          batches: beer.batches.map(batch => 
            batch.id === batchId ? { ...batch, ...updates } : batch
          )
        };
      }
      return beer;
    });
    saveBeers(updatedBeers);
  };

  return { beers, addBeer, deleteBatch, updateBatch };
}
