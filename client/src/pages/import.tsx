import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileSpreadsheet, ArrowRight, Check } from 'lucide-react';
import { parseDollarsToCents } from '@/lib/utils';

type Step = 'upload' | 'map' | 'preview' | 'done';

const TARGET_FIELDS = ['description', 'amount', 'date', 'category', 'skip'] as const;

export default function ImportPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');

  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const utils = trpc.useUtils();
  const parseMutation = trpc.entries.parseCSV.useMutation();
  const bulkCreate = trpc.entries.bulkCreate.useMutation({
    onSuccess: () => {
      utils.entries.list.invalidate();
      utils.forecast.compute.invalidate();
    },
  });

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    const result = await parseMutation.mutateAsync({ csvText: text });
    setHeaders(result.headers);
    setRows(result.rows);
    setTotalRows(result.totalRows);

    const initialMapping: Record<string, string> = {};
    for (const header of result.headers) {
      const suggested = Object.entries(result.suggestedMapping).find(([, v]) => v === header);
      initialMapping[header] = suggested ? suggested[0] : 'skip';
    }
    setMapping(initialMapping);
    setStep('map');
  }, [parseMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const previewEntries = rows.slice(0, 20).map((row) => {
    const entry: Record<string, string> = {};
    headers.forEach((header, i) => {
      const target = mapping[header];
      if (target && target !== 'skip') entry[target] = row[i] ?? '';
    });
    return entry;
  });

  async function handleImport() {
    const today = new Date().toISOString().split('T')[0];
    const entries = rows.map((row) => {
      const mapped: Record<string, string> = {};
      headers.forEach((header, i) => {
        const target = mapping[header];
        if (target && target !== 'skip') mapped[target] = row[i] ?? '';
      });
      const amount = parseDollarsToCents(mapped.amount ?? '0');
      const isNegative = amount < 0 || (mapped.amount ?? '').includes('-');
      return {
        type: isNegative ? 'expense' as const : 'income' as const,
        category: mapped.category || (isNegative ? 'Other Expense' : 'Revenue'),
        description: mapped.description || 'Imported transaction',
        amount: Math.abs(amount),
        is_recurring: false,
        recurrence_interval: null,
        start_date: mapped.date || today,
        end_date: null,
        growth_rate: 0,
        tags: ['csv_import'],
      };
    }).filter((e) => e.amount > 0);

    await bulkCreate.mutateAsync({ entries });
    setStep('done');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import Bank Statement</CardTitle>
            <CardDescription>Upload a CSV or TSV file. Common formats are auto-detected.</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-border p-12 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Drag & drop your CSV file here</p>
                <p className="text-xs text-muted-foreground">or click to browse</p>
              </div>
              <label>
                <Button variant="outline" className="gap-2 cursor-pointer" asChild>
                  <span><FileSpreadsheet className="h-4 w-4" /> Choose File</span>
                </Button>
                <input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleInputChange} />
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'map' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Map Columns</CardTitle>
            <CardDescription>Detected {totalRows} rows in "{fileName}". Map each column to a field.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {headers.map((header) => (
              <div key={header} className="flex items-center gap-4">
                <div className="w-40 shrink-0">
                  <p className="text-sm font-medium truncate" title={header}>{header}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    e.g., "{rows[0]?.[headers.indexOf(header)] ?? ''}"
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select value={mapping[header] ?? 'skip'} onValueChange={(v) => setMapping((m) => ({ ...m, [header]: v }))}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TARGET_FIELDS.map((f) => (
                      <SelectItem key={f} value={f}>{f === 'skip' ? 'Skip this column' : f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button onClick={() => setStep('preview')} className="gap-2">Preview <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview Import</CardTitle>
            <CardDescription>Showing first {Math.min(20, totalRows)} of {totalRows} entries.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Description</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {previewEntries.map((entry, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-3 py-2">{entry.description || '—'}</td>
                      <td className="px-3 py-2 text-right font-mono">{entry.amount || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{entry.date || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{entry.category || 'Auto'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('map')}>Back</Button>
              <Button onClick={handleImport} disabled={bulkCreate.isPending} className="gap-2">
                <Check className="h-4 w-4" /> Import {totalRows} Entries
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'done' && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <Check className="h-7 w-7 text-success" />
            </div>
            <h3 className="font-display text-xl">Import Complete</h3>
            <p className="mt-1 text-sm text-muted-foreground">{totalRows} entries imported successfully.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" onClick={() => setStep('upload')}>Import Another</Button>
              <Button onClick={() => navigate('/')} className="gap-2">View Dashboard <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
