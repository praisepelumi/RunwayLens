import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Plus,
  Pencil,
  Trash2,
  GitBranch,
  Users,
  UserMinus,
  TrendingUp,
  Shield,
} from 'lucide-react';

export default function ScenariosPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formRevMult, setFormRevMult] = useState('1.0');
  const [formExpMult, setFormExpMult] = useState('1.0');

  const utils = trpc.useUtils();
  const scenariosQuery = trpc.scenarios.list.useQuery();

  function invalidateAll() {
    utils.scenarios.list.invalidate();
    utils.forecast.compute.invalidate();
  }

  const createMutation = trpc.scenarios.create.useMutation({
    onSuccess: () => { invalidateAll(); setCreateOpen(false); resetForm(); },
  });
  const updateMutation = trpc.scenarios.update.useMutation({
    onSuccess: () => { invalidateAll(); setEditId(null); resetForm(); },
  });
  const deleteMutation = trpc.scenarios.delete.useMutation({
    onSuccess: () => invalidateAll(),
  });

  const scenarios = scenariosQuery.data ?? [];
  const defaultScenarios = scenarios.filter((s) => s.is_default);
  const presetScenarios = scenarios.filter((s) => s.is_preset);
  const customScenarios = scenarios.filter((s) => !s.is_default && !s.is_preset);

  function resetForm() {
    setFormName('');
    setFormRevMult('1.0');
    setFormExpMult('1.0');
  }

  function openEdit(s: typeof scenarios[0]) {
    setEditId(s.id);
    setFormName(s.name);
    setFormRevMult(String(s.revenue_multiplier));
    setFormExpMult(String(s.expense_multiplier));
  }

  function handleSave() {
    if (editId) {
      updateMutation.mutate({
        id: editId,
        data: {
          name: formName,
          revenue_multiplier: parseFloat(formRevMult),
          expense_multiplier: parseFloat(formExpMult),
        },
      });
    } else {
      createMutation.mutate({
        name: formName,
        revenue_multiplier: parseFloat(formRevMult),
        expense_multiplier: parseFloat(formExpMult),
      });
    }
  }

  function handleDelete(id: string) {
    if (window.confirm('Delete this scenario?')) {
      deleteMutation.mutate({ id });
    }
  }

  const presetIcons: Record<string, React.ElementType> = {
    'Hire Employee': Users,
    'Lose Major Client': UserMinus,
    'Growth Scenario': TrendingUp,
  };

  function formatMultiplier(v: number) {
    if (v === 1) return 'No change';
    const pct = Math.round((v - 1) * 100);
    return pct > 0 ? `+${pct}%` : `${pct}%`;
  }

  return (
    <div className="space-y-8">
      {/* ── Default Scenarios ── */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Default Scenarios
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {defaultScenarios.map((s) => (
            <Card key={s.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <p className="font-medium">{s.name}</p>
                </div>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Revenue</span>
                    <span className={cn('font-mono', s.revenue_multiplier > 1 ? 'text-success' : s.revenue_multiplier < 1 ? 'text-danger' : '')}>
                      {formatMultiplier(s.revenue_multiplier)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expenses</span>
                    <span className={cn('font-mono', s.expense_multiplier > 1 ? 'text-danger' : s.expense_multiplier < 1 ? 'text-success' : '')}>
                      {formatMultiplier(s.expense_multiplier)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-7 w-7"
                  onClick={() => openEdit(s)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Preset Toggles (from ChatGPT idea) ── */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick What-If Toggles
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {presetScenarios.map((s) => {
            const Icon = presetIcons[s.name] ?? GitBranch;
            return (
              <Card key={s.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-chart-3/10">
                      <Icon className="h-5 w-5 text-chart-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{s.preset_label ?? s.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {s.preset_description ?? `Rev: ${formatMultiplier(s.revenue_multiplier)}, Exp: ${formatMultiplier(s.expense_multiplier)}`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="flex gap-4 text-muted-foreground">
                      <span>Rev: <span className="font-mono">{formatMultiplier(s.revenue_multiplier)}</span></span>
                      <span>Exp: <span className="font-mono">{formatMultiplier(s.expense_multiplier)}</span></span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(s)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Custom Scenarios ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Custom Scenarios
          </h3>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-3.5 w-3.5" /> New Scenario
          </Button>
        </div>
        {customScenarios.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No custom scenarios yet. Create one to model specific business situations.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {customScenarios.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <p className="font-medium">{s.name}</p>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Revenue</span>
                      <span className="font-mono">{formatMultiplier(s.revenue_multiplier)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expenses</span>
                      <span className="font-mono">{formatMultiplier(s.expense_multiplier)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Create/Edit Dialog ── */}
      <Dialog open={createOpen || !!editId} onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditId(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Scenario' : 'New Scenario'}</DialogTitle>
            <DialogDescription>
              Adjust revenue and expense multipliers to model different outcomes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Aggressive Growth" />
            </div>
            <div className="space-y-1.5">
              <Label>Revenue Multiplier</Label>
              <Input type="number" step="0.05" min="0" max="5" value={formRevMult} onChange={(e) => setFormRevMult(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                1.0 = no change, 1.2 = +20%, 0.8 = -20%
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Expense Multiplier</Label>
              <Input type="number" step="0.05" min="0" max="5" value={formExpMult} onChange={(e) => setFormExpMult(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                1.0 = no change, 1.15 = +15%, 0.9 = -10%
              </p>
            </div>
            {/* Live preview */}
            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Preview Effect</p>
              <p>Revenue will be <span className="font-mono font-medium">{formatMultiplier(parseFloat(formRevMult) || 1)}</span></p>
              <p>Expenses will be <span className="font-mono font-medium">{formatMultiplier(parseFloat(formExpMult) || 1)}</span></p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditId(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName || createMutation.isPending || updateMutation.isPending}>
              {editId ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
