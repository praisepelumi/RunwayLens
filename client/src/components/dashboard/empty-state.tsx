import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Telescope } from 'lucide-react';

export function EmptyState() {
  const navigate = useNavigate();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center py-16 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Telescope className="h-8 w-8 text-primary" />
        </div>

        <h3 className="font-display text-2xl tracking-tight">
          Welcome to RunwayLens
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Get a clear picture of your business cash flow. Add your income and
          expenses to see runway projections, burn rate analysis, and financial
          risk insights.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => navigate('/entries')} className="gap-2">
            <Plus className="h-4 w-4" />
            Add First Entry
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/import')}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Import from CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
