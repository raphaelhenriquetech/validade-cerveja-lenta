import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface BeerFormProps {
  onAdd: (beerName: string, lot: string, quantity: number, expirationDate: string) => void;
}

export function BeerForm({ onAdd }: BeerFormProps) {
  const [name, setName] = useState('');
  const [lot, setLot] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expirationDate, setExpirationDate] = useState<Date>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !lot.trim() || !quantity || !expirationDate) {
      return;
    }

    onAdd(
      name.trim(),
      lot.trim(),
      parseInt(quantity),
      format(expirationDate, 'yyyy-MM-dd')
    );

    setName('');
    setLot('');
    setQuantity('');
    setExpirationDate(undefined);
  };

  return (
    <div className="bg-card dark:bg-card/80 p-4 lg:p-6 rounded-xl shadow-sm border border-border/50 dark:border-border/30">
      <div className="flex items-center gap-3 mb-4 lg:mb-6">
        <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
          <Plus className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Cadastrar Novo Lote</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-muted-foreground mb-1.5" htmlFor="beer-name">
            Nome da Cerveja
          </label>
          <input
            id="beer-name"
            type="text"
            placeholder="Ex: IPA Artesanal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-3 bg-secondary dark:bg-secondary/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5" htmlFor="lot-code">
            Lote
          </label>
          <input
            id="lot-code"
            type="text"
            placeholder="Ex: L2024-001"
            value={lot}
            onChange={(e) => setLot(e.target.value)}
            className="w-full h-11 px-3 bg-secondary dark:bg-secondary/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5" htmlFor="quantity">
            Quantidade
          </label>
          <input
            id="quantity"
            type="number"
            min="1"
            placeholder="Ex: 24"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full h-11 px-3 bg-secondary dark:bg-secondary/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
          />
        </div>
        
        <div className="relative">
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            Data de Validade
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'w-full h-11 px-3 bg-secondary dark:bg-secondary/50 border-0 rounded-lg text-left flex items-center gap-2 focus:ring-2 focus:ring-primary focus:outline-none transition-all',
                  !expirationDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="h-4 w-4 text-primary" />
                {expirationDate ? format(expirationDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={expirationDate}
                onSelect={setExpirationDate}
                initialFocus
                className="pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <Button 
          type="submit" 
          className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar
        </Button>
      </form>
    </div>
  );
}
