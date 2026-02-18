import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';

interface EntryRow {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  is_recurring: boolean | number;
  recurrence_interval: string | null;
  start_date: string;
  growth_rate: number;
}

interface EntryTableProps {
  entries: EntryRow[];
  onEdit: (entry: EntryRow) => void;
  onDelete: (id: string) => void;
  currency?: string;
}

export function EntryTable({ entries, onEdit, onDelete, currency = 'USD' }: EntryTableProps) {
  if (entries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No entries yet. Click "Add Entry" to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          All Entries ({entries.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Description
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Category
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Amount
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Frequency
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Start
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isRecurring = entry.is_recurring === true || entry.is_recurring === 1;
                return (
                  <tr
                    key={entry.id}
                    className="border-b transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        {entry.type === 'income' ? (
                          <ArrowUpCircle className="h-4 w-4 text-success" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-danger" />
                        )}
                        <span
                          className={cn(
                            'text-xs font-medium uppercase',
                            entry.type === 'income' ? 'text-success' : 'text-danger'
                          )}
                        >
                          {entry.type}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{entry.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">{entry.category}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      {formatCurrency(entry.amount, currency)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {isRecurring ? (
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          {entry.recurrence_interval}
                        </span>
                      ) : (
                        'One-time'
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(entry.start_date)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onEdit(entry)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => onDelete(entry.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
