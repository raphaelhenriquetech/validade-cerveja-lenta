import { differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpirationBadgeProps {
  expirationDate: string;
}

export function ExpirationBadge({ expirationDate }: ExpirationBadgeProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  const daysUntilExpiration = differenceInDays(expDate, today);

  if (daysUntilExpiration < 0) {
    return (
      <Badge 
        variant="destructive" 
        className="flex items-center gap-1.5 font-medium px-2.5 py-1 shadow-sm"
      >
        <XCircle className="h-3.5 w-3.5" />
        Vencido ({Math.abs(daysUntilExpiration)}d)
      </Badge>
    );
  }

  if (daysUntilExpiration === 0) {
    return (
      <Badge 
        variant="destructive" 
        className="flex items-center gap-1.5 font-medium px-2.5 py-1 animate-pulse shadow-sm"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Vence hoje!
      </Badge>
    );
  }

  if (daysUntilExpiration <= 7) {
    return (
      <Badge 
        className={cn(
          "flex items-center gap-1.5 font-medium px-2.5 py-1",
          "bg-gradient-to-r from-orange-500 to-orange-400",
          "text-white border-0 shadow-sm animate-pulse"
        )}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        {daysUntilExpiration}d - Crítico
      </Badge>
    );
  }

  if (daysUntilExpiration <= 15) {
    return (
      <Badge 
        className={cn(
          "flex items-center gap-1.5 font-medium px-2.5 py-1",
          "bg-gradient-to-r from-amber-500 to-yellow-400",
          "text-amber-950 border-0 shadow-sm"
        )}
      >
        <AlertCircle className="h-3.5 w-3.5" />
        {daysUntilExpiration}d - Atenção
      </Badge>
    );
  }

  if (daysUntilExpiration <= 30) {
    return (
      <Badge 
        className={cn(
          "flex items-center gap-1.5 font-medium px-2.5 py-1",
          "bg-gradient-to-r from-blue-500 to-blue-400",
          "text-white border-0 shadow-sm"
        )}
      >
        <Clock className="h-3.5 w-3.5" />
        {daysUntilExpiration}d - Alerta
      </Badge>
    );
  }

  if (daysUntilExpiration <= 60) {
    return (
      <Badge 
        variant="secondary" 
        className="flex items-center gap-1.5 font-medium px-2.5 py-1 shadow-sm"
      >
        <Clock className="h-3.5 w-3.5" />
        {daysUntilExpiration}d
      </Badge>
    );
  }

  return (
    <Badge 
      className={cn(
        "flex items-center gap-1.5 font-medium px-2.5 py-1",
        "bg-gradient-to-r from-emerald-500 to-green-400",
        "text-white border-0 shadow-sm"
      )}
    >
      <CheckCircle className="h-3.5 w-3.5" />
      {daysUntilExpiration}d - OK
    </Badge>
  );
}

export function getDaysUntilExpiration(expirationDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  return differenceInDays(expDate, today);
}
