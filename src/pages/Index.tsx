import { BeerForm } from '@/components/BeerForm';
import { BeerList } from '@/components/BeerList';
import { useBeers } from '@/hooks/useBeers';
import { Beer } from 'lucide-react';

const Index = () => {
  const { beers, addBeer, deleteBatch } = useBeers();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Beer className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Controle de Validades</h1>
              <p className="text-sm text-muted-foreground">Cerveja Lenta</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <BeerForm onAdd={addBeer} />
        <BeerList beers={beers} onDeleteBatch={deleteBatch} />
      </main>
    </div>
  );
};

export default Index;
