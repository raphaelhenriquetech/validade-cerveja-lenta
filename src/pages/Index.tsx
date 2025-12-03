import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BeerForm } from '@/components/BeerForm';
import { BeerList } from '@/components/BeerList';
import { ExpirationDashboard } from '@/components/ExpirationDashboard';
import { useBeers } from '@/hooks/useBeers';
import { useAuth } from '@/hooks/useAuth';
import { Beer, Settings, Loader2, LogOut, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ReportGenerator } from '@/components/ReportGenerator';
import Footer from '@/components/Footer';

const Index = () => {
  const { batches, loading, addBatch, deleteBatch, updateBatch } = useBeers();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Erro ao sair',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header - Light with colored accents */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                <Beer className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Controle de Validades</h1>
                <p className="text-sm text-muted-foreground">Cerveja Lenta</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ReportGenerator batches={batches} />
              <Link to="/produtos-tiny">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                  title="Produtos Tiny"
                >
                  <Package className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/configuracoes">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6 pb-20">
        <div className="animate-fade-in">
          <ExpirationDashboard 
            batches={batches} 
            onFilterChange={setFilter} 
            activeFilter={filter} 
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <BeerForm onAdd={addBatch} />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <BeerList 
            batches={batches} 
            onDeleteBatch={deleteBatch} 
            onUpdateBatch={updateBatch}
            filter={filter} 
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;