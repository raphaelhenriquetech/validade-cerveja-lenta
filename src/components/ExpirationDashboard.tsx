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
      bgColor: 'bg-primary',
      shadowColor: 'shadow-primary/20',
      isPulse: false,
    },
    {
      id: 'expired',
      title: 'Vencidos',
      subtitle: 'Prazo expirado',
      count: stats.expired,
      icon: XCircle,
      bgColor: 'bg-red-500',
      shadowColor: 'shadow-red-500/20',
      isPulse: stats.expired > 0,
    },
    {
      id: 'critical',
      title: 'Crítico',
      subtitle: 'Até 7 dias',
      count: stats.critical,
      icon: AlertTriangle,
      bgColor: 'bg-orange-400',
      shadowColor: 'shadow-orange-400/20',
      isPulse: stats.critical > 0,
    },
    {
      id: '15days',
      title: 'Atenção',
      subtitle: '8 a 15 dias',
      count: stats.attention,
      icon: AlertCircle,
      bgColor: 'bg-amber-400',
      shadowColor: 'shadow-amber-400/20',
      isPulse: false,
    },
    {
      id: '30days',
      title: 'Alerta',
      subtitle: '16 a 30 dias',
      count: stats.alert,
      icon: Clock,
      bgColor: 'bg-cyan-500',
      shadowColor: 'shadow-cyan-500/20',
      isPulse: false,
    },
    {
      id: 'ok',
      title: 'OK',
      subtitle: 'Mais de 30 dias',
      count: stats.ok,
      icon: CheckCircle,
      bgColor: 'bg-green-500',
      shadowColor: 'shadow-green-500/20',
      isPulse: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;
        
        return (
          <div
            key={card.id}
            className={cn(
              'cursor-pointer transition-all duration-200 rounded-xl p-4 md:p-5 flex flex-col justify-between min-h-[140px] shadow-lg',
              card.bgColor,
              card.shadowColor,
              isActive && 'ring-4 ring-white/30 scale-[1.02]',
              card.isPulse && 'animate-pulse',
              'hover:scale-[1.02] hover:shadow-xl'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => onFilterChange(isActive ? 'all' : card.id)}
          >
            <div className="flex justify-end">
              <Icon className="h-8 w-8 md:h-10 md:w-10 text-white/50" />
            </div>
            <div className="text-white">
              <p className="text-3xl md:text-4xl font-bold">{card.count}</p>
              <p className="font-semibold text-sm md:text-base">{card.title}</p>
              <p className="text-xs md:text-sm text-white/80">{card.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
