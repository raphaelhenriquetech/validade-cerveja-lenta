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

  const toneClasses: Record<string, { gradient: string; ring: string; iconBg: string; iconFg: string; text: string; subtext: string; count: string }> = {
    primary: {
      gradient: 'bg-gradient-to-br from-slate-500 to-slate-700 dark:from-slate-600 dark:to-slate-800',
      ring: 'ring-slate-300 dark:ring-slate-500',
      iconBg: 'bg-white/20', iconFg: 'text-white',
      text: 'text-white', subtext: 'text-white/80', count: 'text-white',
    },
    expired: {
      gradient: 'bg-gradient-to-br from-red-500 to-rose-700',
      ring: 'ring-red-300',
      iconBg: 'bg-white/20', iconFg: 'text-white',
      text: 'text-white', subtext: 'text-white/85', count: 'text-white',
    },
    critical: {
      gradient: 'bg-gradient-to-br from-orange-500 to-red-500',
      ring: 'ring-orange-300',
      iconBg: 'bg-white/20', iconFg: 'text-white',
      text: 'text-white', subtext: 'text-white/85', count: 'text-white',
    },
    attention: {
      gradient: 'bg-gradient-to-br from-amber-400 to-orange-500',
      ring: 'ring-amber-300',
      iconBg: 'bg-white/25', iconFg: 'text-white',
      text: 'text-white', subtext: 'text-white/90', count: 'text-white',
    },
    alert: {
      gradient: 'bg-gradient-to-br from-yellow-400 to-amber-500',
      ring: 'ring-yellow-300',
      iconBg: 'bg-white/25', iconFg: 'text-white',
      text: 'text-white', subtext: 'text-white/90', count: 'text-white',
    },
    ok: {
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      ring: 'ring-emerald-300',
      iconBg: 'bg-white/20', iconFg: 'text-white',
      text: 'text-white', subtext: 'text-white/85', count: 'text-white',
    },
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
              'group relative overflow-hidden text-left rounded-2xl p-4 md:p-5',
              t.gradient,
              'transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-1',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              isActive && `ring-4 ${t.ring} -translate-y-1 shadow-xl scale-[1.02]`,
              card.pulse && 'pulse-glow'
            )}
            style={{ animationDelay: `${index * 40}ms` }}
            onClick={() => onFilterChange(isActive ? 'all' : card.id)}
          >
            {/* Decorative shine */}
            <span className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-start justify-between gap-2">
              <div className={cn('p-2 rounded-xl backdrop-blur-sm', t.iconBg)}>
                <Icon className={cn('h-5 w-5', t.iconFg)} />
              </div>
              <span className={cn('font-heading text-3xl md:text-4xl font-bold leading-none tabular-nums drop-shadow-sm', t.count)}>
                {card.count}
              </span>
            </div>
            <div className="relative mt-4">
              <p className={cn('text-sm font-semibold', t.text)}>{card.title}</p>
              <p className={cn('text-xs', t.subtext)}>{card.subtitle}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
