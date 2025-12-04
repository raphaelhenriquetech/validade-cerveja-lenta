import { differenceInDays, parseISO } from 'date-fns';
import { AlertTriangle, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpirationBadgeProps {
  expirationDate: string;
}

export function ExpirationBadge({ expirationDate }: ExpirationBadgeProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = parseISO(expirationDate);
  const daysUntilExpiration = differenceInDays(expDate, today);

  if (daysUntilExpiration < 0) {
    return (
      <span className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full",
        "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300"
      )}>
        <XCircle className="h-4 w-4" />
        Vencido ({Math.abs(daysUntilExpiration)}d)
      </span>
    );
  }

  if (daysUntilExpiration === 0) {
    return (
      <span className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse",
        "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300"
      )}>
        <AlertTriangle className="h-4 w-4" />
        Vence hoje!
      </span>
    );
  }

  if (daysUntilExpiration <= 7) {
    return (
      <span className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse",
        "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300"
      )}>
        <AlertTriangle className="h-4 w-4" />
        {daysUntilExpiration}d - Crítico
      </span>
    );
  }

  if (daysUntilExpiration <= 15) {
    return (
      <span className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full",
        "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
      )}>
        <AlertCircle className="h-4 w-4" />
        {daysUntilExpiration}d - Atenção
      </span>
    );
  }

  if (daysUntilExpiration <= 30) {
    return (
      <span className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full",
        "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300"
      )}>
        <Clock className="h-4 w-4" />
        {daysUntilExpiration}d - Alerta
      </span>
    );
  }

  if (daysUntilExpiration <= 60) {
    return (
      <span className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full",
        "bg-gray-100 text-gray-800 dark:bg-zinc-700 dark:text-gray-300"
      )}>
        <Clock className="h-4 w-4" />
        {daysUntilExpiration}d
      </span>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full",
      "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300"
    )}>
      <CheckCircle className="h-4 w-4" />
      {daysUntilExpiration}d - OK
    </span>
  );
}

export function getDaysUntilExpiration(expirationDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = parseISO(expirationDate);
  return differenceInDays(expDate, today);
}
