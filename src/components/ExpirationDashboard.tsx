import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { BeerBatch } from '@/hooks/useBeers';

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

    return { expired, critical, attention, alert, ok };
  }, [batches]);

  const cards = [
    {
      id: 'expired',
      label: 'Vencidos',
      count: stats.expired,
      icon: XCircle,
      bgClass: 'bg-destructive/10 hover:bg-destructive/20',
      textClass: 'text-destructive',
      borderClass: 'border-destructive/30',
    },
    {
      id: 'critical',
      label: 'Crítico (≤7d)',
      count: stats.critical,
      icon: AlertTriangle,
      bgClass: 'bg-orange-500/10 hover:bg-orange-500/20',
      textClass: 'text-orange-600',
      borderClass: 'border-orange-500/30',
    },
    {
      id: '15days',
      label: 'Atenção (8-15d)',
      count: stats.attention,
      icon: AlertCircle,
      bgClass: 'bg-yellow-500/10 hover:bg-yellow-500/20',
      textClass: 'text-yellow-600',
      borderClass: 'border-yellow-500/30',
    },
    {
      id: '30days',
      label: 'Alerta (16-30d)',
      count: stats.alert,
      icon: Clock,
      bgClass: 'bg-blue-500/10 hover:bg-blue-500/20',
      textClass: 'text-blue-600',
      borderClass: 'border-blue-500/30',
    },
    {
      id: 'ok',
      label: 'OK (31d+)',
      count: stats.ok,
      icon: CheckCircle,
      bgClass: 'bg-green-500/10 hover:bg-green-500/20',
      textClass: 'text-green-600',
      borderClass: 'border-green-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {cards.map(card => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;
        
        return (
          <Card
            key={card.id}
            className={`cursor-pointer transition-all ${card.bgClass} border ${card.borderClass} ${
              isActive ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onFilterChange(isActive ? 'all' : card.id)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Icon className={`h-6 w-6 ${card.textClass} mb-2`} />
              <span className={`text-2xl font-bold ${card.textClass}`}>{card.count}</span>
              <span className="text-xs text-muted-foreground mt-1">{card.label}</span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
