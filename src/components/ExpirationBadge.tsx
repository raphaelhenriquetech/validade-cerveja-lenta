import { differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
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
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Vencido há {Math.abs(daysUntilExpiration)} dia{Math.abs(daysUntilExpiration) !== 1 ? 's' : ''}
      </Badge>
    );
  }

  if (daysUntilExpiration === 0) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Vence hoje!
      </Badge>
    );
  }

  if (daysUntilExpiration <= 7) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
        <AlertTriangle className="h-3 w-3" />
        CRÍTICO - {daysUntilExpiration} dia{daysUntilExpiration !== 1 ? 's' : ''}
      </Badge>
    );
  }

  if (daysUntilExpiration <= 15) {
    return (
      <Badge className={cn("flex items-center gap-1 bg-orange-500 hover:bg-orange-600")}>
        <Clock className="h-3 w-3" />
        Faltam {daysUntilExpiration} dias
      </Badge>
    );
  }

  if (daysUntilExpiration <= 30) {
    return (
      <Badge className={cn("flex items-center gap-1 bg-amber-500 hover:bg-amber-600")}>
        <Clock className="h-3 w-3" />
        Faltam {daysUntilExpiration} dias
      </Badge>
    );
  }

  if (daysUntilExpiration <= 60) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Faltam {daysUntilExpiration} dias
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1 border-primary text-primary">
      <CheckCircle className="h-3 w-3" />
      Faltam {daysUntilExpiration} dias
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
