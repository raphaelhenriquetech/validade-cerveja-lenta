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
      label: 'Total',
      count: stats.total,
      icon: Package,
      gradient: 'from-primary/20 to-accent/20',
      iconBg: 'bg-primary/20',
      textClass: 'text-primary',
      isPulse: false,
    },
    {
      id: 'expired',
      label: 'Vencidos',
      count: stats.expired,
      icon: XCircle,
      gradient: 'from-destructive/20 to-destructive/10',
      iconBg: 'bg-destructive/20',
      textClass: 'text-destructive',
      isPulse: stats.expired > 0,
    },
    {
      id: 'critical',
      label: 'Crítico (≤7d)',
      count: stats.critical,
      icon: AlertTriangle,
      gradient: 'from-orange-500/20 to-orange-400/10',
      iconBg: 'bg-orange-500/20',
      textClass: 'text-orange-600 dark:text-orange-400',
      isPulse: stats.critical > 0,
    },
    {
      id: '15days',
      label: 'Atenção (8-15d)',
      count: stats.attention,
      icon: AlertCircle,
      gradient: 'from-yellow-500/20 to-yellow-400/10',
      iconBg: 'bg-yellow-500/20',
      textClass: 'text-yellow-600 dark:text-yellow-400',
      isPulse: false,
    },
    {
      id: '30days',
      label: 'Alerta (16-30d)',
      count: stats.alert,
      icon: Clock,
      gradient: 'from-blue-500/20 to-blue-400/10',
      iconBg: 'bg-blue-500/20',
      textClass: 'text-blue-600 dark:text-blue-400',
      isPulse: false,
    },
    {
      id: 'ok',
      label: 'OK (31d+)',
      count: stats.ok,
      icon: CheckCircle,
      gradient: 'from-green-500/20 to-green-400/10',
      iconBg: 'bg-green-500/20',
      textClass: 'text-green-600 dark:text-green-400',
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
              'cursor-pointer transition-all duration-300 overflow-hidden group',
              'bg-gradient-to-br border-0 shadow-custom-sm hover:shadow-custom-md',
              card.gradient,
              isActive && 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-glow',
              card.isPulse && 'pulse-glow'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => onFilterChange(isActive ? 'all' : card.id)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center relative">
              <div className={cn(
                'p-2 rounded-xl mb-2 transition-transform duration-300 group-hover:scale-110',
                card.iconBg
              )}>
                <Icon className={cn('h-5 w-5', card.textClass)} />
              </div>
              <span className={cn('text-3xl font-bold tracking-tight', card.textClass)}>
                {card.count}
              </span>
              <span className="text-xs text-muted-foreground mt-1 font-medium">
                {card.label}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
