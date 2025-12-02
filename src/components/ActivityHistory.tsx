import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useActivityLogs, ActivityLog } from '@/hooks/useActivityLogs';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Mail, History, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function getActivityIcon(actionType: string) {
  switch (actionType) {
    case 'batch_created':
    case 'email_added':
      return Plus;
    case 'batch_updated':
      return Pencil;
    case 'batch_deleted':
    case 'email_deleted':
      return Trash2;
    default:
      return History;
  }
}

function getActivityColor(actionType: string) {
  switch (actionType) {
    case 'batch_created':
    case 'email_added':
      return 'text-green-500 bg-green-500/10';
    case 'batch_updated':
      return 'text-yellow-500 bg-yellow-500/10';
    case 'batch_deleted':
    case 'email_deleted':
      return 'text-destructive bg-destructive/10';
    default:
      return 'text-muted-foreground bg-secondary';
  }
}

function formatActivityDate(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return `Hoje, ${format(date, 'HH:mm', { locale: ptBR })}`;
  }
  if (isYesterday(date)) {
    return `Ontem, ${format(date, 'HH:mm', { locale: ptBR })}`;
  }
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

function ActivityItem({ log }: { log: ActivityLog }) {
  const Icon = getActivityIcon(log.action_type);
  const colorClass = getActivityColor(log.action_type);

  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
      <div className={cn('p-2 rounded-lg h-fit', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{log.description}</p>
        {log.old_values && log.new_values && typeof log.old_values === 'object' && typeof log.new_values === 'object' && (
          <p className="text-xs text-muted-foreground mt-1">
            {Object.entries(log.new_values as Record<string, any>).map(([key, value]) => {
              const oldValue = (log.old_values as Record<string, any>)?.[key];
              if (oldValue !== value) {
                return (
                  <span key={key}>
                    {key === 'quantity' && `${oldValue} → ${value} unidades`}
                    {key === 'expiration_date' && `Validade: ${oldValue} → ${value}`}
                    {key === 'beer_name' && `Nome: ${oldValue} → ${value}`}
                  </span>
                );
              }
              return null;
            })}
          </p>
        )}
        <p className="text-xs text-muted-foreground/70 mt-1">
          {formatActivityDate(log.created_at)}
        </p>
      </div>
    </div>
  );
}

export function ActivityHistory() {
  const { logs, loading } = useActivityLogs();

  return (
    <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-card to-secondary/20">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <History className="h-5 w-5 text-primary" />
          </div>
          Histórico de Atividades
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-secondary/50 mb-4">
              <History className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">
              Nenhuma atividade registrada
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              As alterações aparecerão aqui
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-1">
              {logs.map((log) => (
                <ActivityItem key={log.id} log={log} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
