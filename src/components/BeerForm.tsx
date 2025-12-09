import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface BeerFormProps {
  onAdd: (beerName: string, lot: string, quantity: number, expirationDate: string, sku?: string) => void;
}

export function BeerForm({ onAdd }: BeerFormProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
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
      format(expirationDate, 'yyyy-MM-dd'),
      sku.trim() || undefined
    );

    setName('');
    setSku('');
    setLot('');
    setQuantity('');
    setExpirationDate(undefined);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-xl shadow-sm">
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
          <Plus className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cadastrar Novo Lote</h2>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="beer-name">
            Nome da Cerveja
          </label>
          <input
            id="beer-name"
            type="text"
            placeholder="Ex: IPA Artesanal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-3 bg-gray-100 dark:bg-zinc-800 border-transparent focus:ring-2 focus:ring-primary focus:border-primary rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="sku">
            SKU
          </label>
          <input
            id="sku"
            type="text"
            placeholder="Ex: SKU-001"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full h-11 px-3 bg-gray-100 dark:bg-zinc-800 border-transparent focus:ring-2 focus:ring-primary focus:border-primary rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="lot-code">
            Lote
          </label>
          <input
            id="lot-code"
            type="text"
            placeholder="Ex: L2024-001"
            value={lot}
            onChange={(e) => setLot(e.target.value)}
            className="w-full h-11 px-3 bg-gray-100 dark:bg-zinc-800 border-transparent focus:ring-2 focus:ring-primary focus:border-primary rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="quantity">
            Quantidade
          </label>
          <input
            id="quantity"
            type="number"
            min="1"
            placeholder="Ex: 24"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full h-11 px-3 bg-gray-100 dark:bg-zinc-800 border-transparent focus:ring-2 focus:ring-primary focus:border-primary rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data de Validade
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'w-full h-11 px-3 pl-10 bg-gray-100 dark:bg-zinc-800 border-transparent focus:ring-2 focus:ring-primary focus:border-primary rounded-lg text-left flex items-center',
                  !expirationDate ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                )}
              >
                <CalendarIcon className="absolute left-3 h-5 w-5 text-primary pointer-events-none" />
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
          className="h-11 bg-primary text-white font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Cadastrar
        </Button>
      </form>
    </div>
  );
}
