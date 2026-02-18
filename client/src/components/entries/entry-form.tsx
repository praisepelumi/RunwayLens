import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  RECURRENCE_INTERVALS,
} from '@cashflow/shared';
import { parseDollarsToCents } from '@/lib/utils';

// Form schema: accepts dollar amounts as strings for UX, converts to cents
const formSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  amount: z.string().min(1, 'Required'),
  is_recurring: z.boolean(),
  recurrence_interval: z.string().optional(),
  start_date: z.string().min(1, 'Required'),
  end_date: z.string().optional(),
  growth_rate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EntryFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: 'income' | 'expense';
    category: string;
    description: string;
    amount: number;
    is_recurring: boolean;
    recurrence_interval: string | null;
    start_date: string;
    end_date: string | null;
    growth_rate: number;
    tags: string[];
  }) => void;
  defaultValues?: Partial<FormValues>;
  mode?: 'create' | 'edit';
}

export function EntryForm({ open, onClose, onSubmit, defaultValues, mode = 'create' }: EntryFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'expense',
      category: '',
      description: '',
      amount: '',
      is_recurring: false,
      recurrence_interval: undefined,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      growth_rate: '0',
      ...defaultValues,
    },
  });

  const watchType = form.watch('type');
  const watchRecurring = form.watch('is_recurring');
  const categories = watchType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function handleSubmit(values: FormValues) {
    onSubmit({
      type: values.type as 'income' | 'expense',
      category: values.category,
      description: values.description,
      amount: parseDollarsToCents(values.amount),
      is_recurring: values.is_recurring,
      recurrence_interval: values.is_recurring && values.recurrence_interval
        ? values.recurrence_interval
        : null,
      start_date: values.start_date,
      end_date: values.end_date || null,
      growth_rate: values.growth_rate ? parseFloat(values.growth_rate) / 100 : 0,
      tags: [],
    });
    form.reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add Entry' : 'Edit Entry'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new income or expense entry.'
              : 'Update this entry.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={watchType === 'income' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => {
                form.setValue('type', 'income');
                form.setValue('category', '');
              }}
            >
              Income
            </Button>
            <Button
              type="button"
              variant={watchType === 'expense' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => {
                form.setValue('type', 'expense');
                form.setValue('category', '');
              }}
            >
              Expense
            </Button>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.watch('category')}
              onValueChange={(v) => form.setValue('category', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              {...form.register('description')}
              placeholder="e.g., Monthly office rent"
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              {...form.register('amount')}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
            {form.formState.errors.amount && (
              <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <Label htmlFor="start_date">Start Date</Label>
            <Input {...form.register('start_date')} type="date" />
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center gap-3">
            <Switch
              checked={watchRecurring}
              onCheckedChange={(v) => form.setValue('is_recurring', v)}
            />
            <Label>Recurring entry</Label>
          </div>

          {/* Recurrence Interval (conditional) */}
          {watchRecurring && (
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select
                value={form.watch('recurrence_interval') ?? ''}
                onValueChange={(v) => form.setValue('recurrence_interval', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency..." />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_INTERVALS.map((interval) => (
                    <SelectItem key={interval} value={interval}>
                      {interval.charAt(0).toUpperCase() + interval.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* End Date (conditional) */}
          {watchRecurring && (
            <div className="space-y-1.5">
              <Label htmlFor="end_date">End Date (optional)</Label>
              <Input {...form.register('end_date')} type="date" />
            </div>
          )}

          {/* Growth Rate (conditional) */}
          {watchRecurring && (
            <div className="space-y-1.5">
              <Label htmlFor="growth_rate">Monthly Growth Rate (%)</Label>
              <Input
                {...form.register('growth_rate')}
                type="number"
                step="0.1"
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Positive = increasing, negative = decreasing
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Add Entry' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
