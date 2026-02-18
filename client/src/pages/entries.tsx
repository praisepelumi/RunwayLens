import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { EntryForm } from '@/components/entries/entry-form';
import { EntryTable } from '@/components/entries/entry-table';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function EntriesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);

  const utils = trpc.useUtils();
  const entriesQuery = trpc.entries.list.useQuery();

  function invalidateAll() {
    utils.entries.list.invalidate();
    utils.forecast.compute.invalidate();
  }

  const createMutation = trpc.entries.create.useMutation({
    onSuccess: () => invalidateAll(),
  });
  const updateMutation = trpc.entries.update.useMutation({
    onSuccess: () => {
      invalidateAll();
      setEditEntry(null);
    },
  });
  const deleteMutation = trpc.entries.delete.useMutation({
    onSuccess: () => invalidateAll(),
  });

  const entries = entriesQuery.data ?? [];

  function handleCreate(data: any) {
    createMutation.mutate(data);
  }

  function handleUpdate(data: any) {
    if (!editEntry) return;
    updateMutation.mutate({ id: editEntry.id, data });
  }

  function handleDelete(id: string) {
    if (window.confirm('Delete this entry?')) {
      deleteMutation.mutate({ id });
    }
  }

  function handleEdit(entry: any) {
    setEditEntry(entry);
  }

  // Summary stats
  const totalIncome = entries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = entries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>Income: <span className="font-mono font-medium text-success">{formatCurrency(totalIncome)}</span></span>
            <span>Expenses: <span className="font-mono font-medium text-danger">{formatCurrency(totalExpenses)}</span></span>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* Table */}
      <EntryTable
        entries={entries}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Create form */}
      <EntryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* Edit form */}
      {editEntry && (
        <EntryForm
          open={!!editEntry}
          onClose={() => setEditEntry(null)}
          onSubmit={handleUpdate}
          mode="edit"
          defaultValues={{
            type: editEntry.type,
            category: editEntry.category,
            description: editEntry.description,
            amount: String((editEntry.amount / 100).toFixed(2)),
            is_recurring: !!editEntry.is_recurring,
            recurrence_interval: editEntry.recurrence_interval ?? undefined,
            start_date: editEntry.start_date,
            end_date: editEntry.end_date ?? '',
            growth_rate: String((editEntry.growth_rate ?? 0) * 100),
          }}
        />
      )}
    </div>
  );
}
