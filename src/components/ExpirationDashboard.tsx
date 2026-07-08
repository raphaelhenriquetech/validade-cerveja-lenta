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
    let expired = 0, critical = 0, attention = 0, alert = 0, ok = 0;
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
    { id: 'all', title: 'Total', subtitle: 'Todos os lotes', count: stats.total, icon: Package, tone: 'primary', pulse: false },
    { id: 'expired', title: 'Vencidos', subtitle: 'Prazo expirado', count: stats.expired, icon: XCircle, tone: 'expired', pulse: stats.expired > 0 },
    { id: 'critical', title: 'Crítico', subtitle: 'Até 7 dias', count: stats.critical, icon: AlertTriangle, tone: 'critical', pulse: stats.critical > 0 },
    { id: '15days', title: 'Atenção', subtitle: '8 a 15 dias', count: stats.attention, icon: AlertCircle, tone: 'attention', pulse: false },
    { id: '30days', title: 'Alerta', subtitle: '16 a 30 dias', count: stats.alert, icon: Clock, tone: 'alert', pulse: false },
    { id: 'ok', title: 'OK', subtitle: 'Mais de 30 dias', count: stats.ok, icon: CheckCircle, tone: 'ok', pulse: false },
  ] as const;

  const toneClasses: Record<string, { ring: string; iconBg: string; iconFg: string; countFg: string; accent: string }> = {
    primary:   { ring: 'ring-primary/40',           iconBg: 'bg-primary/10',           iconFg: 'text-primary',           countFg: 'text-primary',           accent: 'bg-primary' },
    expired:   { ring: 'ring-destructive/40',       iconBg: 'bg-destructive/10',       iconFg: 'text-destructive',       countFg: 'text-destructive',       accent: 'bg-destructive' },
    critical:  { ring: 'ring-status-critical/40',   iconBg: 'bg-status-critical/10',   iconFg: 'text-status-critical',   countFg: 'text-status-critical',   accent: 'bg-status-critical' },
    attention: { ring: 'ring-status-attention/40',  iconBg: 'bg-status-attention/10',  iconFg: 'text-status-attention',  countFg: 'text-status-attention',  accent: 'bg-status-attention' },
    alert:     { ring: 'ring-accent/50',            iconBg: 'bg-accent/15',            iconFg: 'text-accent',            countFg: 'text-accent',            accent: 'bg-accent' },
    ok:        { ring: 'ring-status-ok/40',         iconBg: 'bg-status-ok/10',         iconFg: 'text-status-ok',         countFg: 'text-status-ok',         accent: 'bg-status-ok' },
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;
        const t = toneClasses[card.tone];
        return (
          <button
            key={card.id}
            type="button"
            className={cn(
              'group relative overflow-hidden text-left rounded-2xl border border-border bg-card p-4 md:p-5',
              'transition-all duration-200 shadow-sm hover:shadow-emerald hover:-translate-y-0.5',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive && `ring-2 ${t.ring} -translate-y-0.5 shadow-emerald`,
              card.pulse && 'pulse-glow'
            )}
            style={{ animationDelay: `${index * 40}ms` }}
            onClick={() => onFilterChange(isActive ? 'all' : card.id)}
          >
            <span className={cn('absolute inset-x-0 top-0 h-1', t.accent)} />
            <div className="flex items-start justify-between gap-2">
              <div className={cn('p-2 rounded-xl', t.iconBg)}>
                <Icon className={cn('h-5 w-5', t.iconFg)} />
              </div>
              <span className={cn('font-heading text-3xl md:text-4xl font-bold leading-none tabular-nums', t.countFg)}>
                {card.count}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-semibold text-foreground">{card.title}</p>
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
