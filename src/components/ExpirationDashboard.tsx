import { useMemo } from 'react';
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
      bgClass: 'bg-primary',
      shadowClass: 'shadow-primary/20',
      isPulse: false,
    },
    {
      id: 'expired',
      title: 'Vencidos',
      subtitle: 'Prazo expirado',
      count: stats.expired,
      icon: XCircle,
      bgClass: 'bg-red-500',
      shadowClass: 'shadow-red-500/20',
      isPulse: stats.expired > 0,
    },
    {
      id: 'critical',
      title: 'Crítico',
      subtitle: 'Até 7 dias',
      count: stats.critical,
      icon: AlertTriangle,
      bgClass: 'bg-orange-400',
      shadowClass: 'shadow-orange-400/20',
      isPulse: stats.critical > 0,
    },
    {
      id: '15days',
      title: 'Atenção',
      subtitle: '8 a 15 dias',
      count: stats.attention,
      icon: AlertCircle,
      bgClass: 'bg-amber-400',
      shadowClass: 'shadow-amber-400/20',
      isPulse: false,
    },
    {
      id: '30days',
      title: 'Alerta',
      subtitle: '16 a 30 dias',
      count: stats.alert,
      icon: Clock,
      bgClass: 'bg-cyan-500',
      shadowClass: 'shadow-cyan-500/20',
      isPulse: false,
    },
    {
      id: 'ok',
      title: 'OK',
      subtitle: 'Mais de 30 dias',
      count: stats.ok,
      icon: CheckCircle,
      bgClass: 'bg-green-500',
      shadowClass: 'shadow-green-500/20',
      isPulse: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;
        
        return (
          <div
            key={card.id}
            className={cn(
              'cursor-pointer transition-all duration-200 p-4 lg:p-5 rounded-xl flex flex-col justify-between min-h-[120px] lg:min-h-[140px]',
              card.bgClass,
              `shadow-lg ${card.shadowClass}`,
              'hover:scale-[1.02] hover:brightness-105',
              isActive && 'ring-4 ring-foreground/20 ring-offset-2 ring-offset-background scale-[1.02]',
              card.isPulse && 'animate-pulse'
            )}
            onClick={() => onFilterChange(isActive ? 'all' : card.id)}
          >
            <div className="flex justify-end">
              <Icon className="h-8 w-8 lg:h-10 lg:w-10 text-white/50" />
            </div>
            <div className="text-white">
              <p className="text-3xl lg:text-4xl font-bold">{card.count}</p>
              <p className="font-semibold text-sm lg:text-base">{card.title}</p>
              <p className="text-xs lg:text-sm text-white/80">{card.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
