import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      expirationDate.toISOString().split('T')[0]
    );

    setName('');
    setLot('');
    setQuantity('');
    setExpirationDate(undefined);
  };

  return (
    <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-card to-secondary/20 pb-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="p-2 rounded-xl bg-primary/10">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          Cadastrar Novo Lote
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Nome da Cerveja</Label>
            <Input
              id="name"
              placeholder="Ex: IPA Artesanal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 bg-background/50 border-border/50 focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lot" className="text-sm font-medium">Lote</Label>
            <Input
              id="lot"
              placeholder="Ex: L2024-001"
              value={lot}
              onChange={(e) => setLot(e.target.value)}
              className="h-11 bg-background/50 border-border/50 focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="Ex: 24"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-11 bg-background/50 border-border/50 focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Data de Validade</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-11 justify-start text-left font-normal bg-background/50 border-border/50 hover:bg-background/80 transition-all',
                    !expirationDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {expirationDate ? format(expirationDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                </Button>
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

          <div className="flex items-end">
            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-md font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
