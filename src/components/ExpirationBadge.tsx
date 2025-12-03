import { differenceInDays, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
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
      <Badge 
        className={cn(
          "flex items-center gap-1.5 font-medium px-2.5 py-1",
          "bg-[hsl(0,85%,60%)] hover:bg-[hsl(0,85%,55%)]",
          "text-white border-0 shadow-sm"
        )}
      >
        <XCircle className="h-3.5 w-3.5" />
        Vencido ({Math.abs(daysUntilExpiration)}d)
      </Badge>
    );
  }

  if (daysUntilExpiration === 0) {
    return (
      <Badge 
        className={cn(
          "flex items-center gap-1.5 font-medium px-2.5 py-1 animate-pulse",
          "bg-[hsl(0,85%,60%)] hover:bg-[hsl(0,85%,55%)]",
          "text-white border-0 shadow-sm"
        )}
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
          "bg-[hsl(35,95%,55%)] hover:bg-[hsl(35,95%,50%)]",
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
          "bg-[hsl(45,100%,50%)] hover:bg-[hsl(45,100%,45%)]",
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
          "bg-[hsl(195,100%,50%)] hover:bg-[hsl(195,100%,45%)]",
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
        "bg-[hsl(160,84%,45%)] hover:bg-[hsl(160,84%,40%)]",
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
  const expDate = parseISO(expirationDate);
  return differenceInDays(expDate, today);
}