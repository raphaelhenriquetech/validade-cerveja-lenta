import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { BeerBatch } from '@/hooks/useBeers';
import { cn } from '@/lib/utils';

interface ExpirationDashboardProps {
  batches: BeerBatch[];
  onFilterChange: (filter: string) => void;
  activeFilter: string;
}

function getDaysUntilExpiration(expirationDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function ExpirationDashboard({ batches, onFilterChange, activeFilter }: ExpirationDashboardProps) {
  const stats = useMemo(() => {
    let expired = 0;
    let critical = 0;
    let attention = 0;
    let alert = 0;
    let ok = 0;

    batches.forEach(batch => {
      const days = getDaysUntilExpiration(batch.expiration_date);
      if (days < 0) expired++;
      else if (days <= 7) critical++;
      else if (days <= 15) attention++;
      else if (days <= 30) alert++;
      else ok++;
    });

    return { expired, critical, attention, alert, ok, total: batches.length };
  }, [batches]);

  const cards = [
    {
      id: 'all',
      title: 'Total',
      subtitle: 'Todos os lotes',
      count: stats.total,
      icon: Package,
      bgColor: 'bg-[hsl(264,80%,55%)]',
      hoverBg: 'hover:bg-[hsl(264,80%,50%)]',
      isPulse: false,
    },
    {
      id: 'expired',
      title: 'Vencidos',
      subtitle: 'Prazo expirado',
      count: stats.expired,
      icon: XCircle,
      bgColor: 'bg-[hsl(0,85%,60%)]',
      hoverBg: 'hover:bg-[hsl(0,85%,55%)]',
      isPulse: stats.expired > 0,
    },
    {
      id: 'critical',
      title: 'Crítico',
      subtitle: 'Até 7 dias',
      count: stats.critical,
      icon: AlertTriangle,
      bgColor: 'bg-[hsl(35,95%,55%)]',
      hoverBg: 'hover:bg-[hsl(35,95%,50%)]',
      isPulse: stats.critical > 0,
    },
    {
      id: '15days',
      title: 'Atenção',
      subtitle: '8 a 15 dias',
      count: stats.attention,
      icon: AlertCircle,
      bgColor: 'bg-[hsl(45,100%,50%)]',
      hoverBg: 'hover:bg-[hsl(45,100%,45%)]',
      isPulse: false,
    },
    {
      id: '30days',
      title: 'Alerta',
      subtitle: '16 a 30 dias',
      count: stats.alert,
      icon: Clock,
      bgColor: 'bg-[hsl(195,100%,50%)]',
      hoverBg: 'hover:bg-[hsl(195,100%,45%)]',
      isPulse: false,
    },
    {
      id: 'ok',
      title: 'OK',
      subtitle: 'Mais de 30 dias',
      count: stats.ok,
      icon: CheckCircle,
      bgColor: 'bg-[hsl(160,84%,45%)]',
      hoverBg: 'hover:bg-[hsl(160,84%,40%)]',
      isPulse: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;
        
        return (
          <Card
            key={card.id}
            className={cn(
              'cursor-pointer transition-all duration-200 border-0 overflow-hidden group hover-lift',
              card.bgColor,
              card.hoverBg,
              isActive && 'ring-4 ring-foreground/20 ring-offset-2 ring-offset-background scale-[1.02]',
              card.isPulse && 'pulse-glow'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => onFilterChange(isActive ? 'all' : card.id)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center relative text-white">
              <div className="absolute top-2 right-2 opacity-20">
                <Icon className="h-8 w-8" />
              </div>
              <span className="text-4xl font-bold tracking-tight drop-shadow-md">
                {card.count}
              </span>
              <span className="text-sm font-bold mt-1 drop-shadow-md">
                {card.title}
              </span>
              <span className="text-xs font-semibold drop-shadow-sm">
                {card.subtitle}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}