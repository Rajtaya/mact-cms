'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Card, Input } from '@/components/ui';
import { formatINR } from '@/lib/utils';

type Form = Record<string, string>;

const FIELDS: { key: string; label: string; type?: string }[] = [
  { key: 'age', label: 'Age at accident' },
  { key: 'monthlyIncome', label: 'Monthly income (₹)' },
  { key: 'futureProspectsPct', label: 'Future prospects %' },
  { key: 'dependents', label: 'No. of dependents' },
  { key: 'disabilityPct', label: 'Disability % (injury)' },
  { key: 'medicalExpenses', label: 'Medical expenses (₹)' },
  { key: 'funeralExpenses', label: 'Funeral expenses (₹)' },
  { key: 'consortium', label: 'Consortium (₹)' },
  { key: 'attendantCharges', label: 'Attendant charges (₹)' },
  { key: 'transportCharges', label: 'Transport charges (₹)' },
  { key: 'specialDiet', label: 'Special diet (₹)' },
  { key: 'painAndSuffering', label: 'Pain & suffering (₹)' },
];

export default function CalculatorPage() {
  const [form, setForm] = useState<Form>({ age: '38', monthlyIncome: '25000' });
  const [nature, setNature] = useState<'DEATH' | 'INJURY'>('DEATH');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function calculate() {
    setLoading(true);
    try {
      const payload: any = { nature };
      for (const [k, v] of Object.entries(form)) {
        if (v !== '') payload[k] = Number(v);
      }
      const { data } = await api.post('/compensation/calculate', payload);
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Compensation Calculator</h1>
        <p className="text-sm text-muted-foreground">
          Sarla Verma multiplier · Pranay Sethi prospects &amp; heads · Raj Kumar (injury)
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex gap-2">
            {(['DEATH', 'INJURY'] as const).map((n) => (
              <Button
                key={n}
                variant={nature === n ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setNature(n)}
              >
                {n === 'DEATH' ? 'Death claim' : 'Injury claim'}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs text-muted-foreground">
                  {f.label}
                </label>
                <Input
                  type="number"
                  value={form[f.key] ?? ''}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, [f.key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <Button className="mt-4 w-full" onClick={calculate} disabled={loading}>
            <Calculator className="h-4 w-4" />
            {loading ? 'Calculating…' : 'Calculate'}
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 font-medium">Estimated Award</h3>
          {!result ? (
            <p className="text-sm text-muted-foreground">
              Enter parameters and calculate to see the structured breakdown.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg bg-primary/10 p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Estimated Compensation</p>
                <p className="text-3xl font-bold text-primary">
                  {formatINR(result.total)}
                </p>
              </div>
              <Row label="Claim nature" value={result.nature} />
              <Row label="Age multiplier" value={result.multiplier} />
              <Row label="Annual income" value={formatINR(result.annualIncome)} />
              <Row label="Future prospects" value={`${result.futureProspectsPct}%`} />
              <Row label="Income with prospects" value={formatINR(result.incomeWithProspects)} />
              {result.dependencyDeductionPct != null && (
                <Row label="Personal-expense deduction" value={`${result.dependencyDeductionPct}%`} />
              )}
              {result.disabilityPct != null && (
                <Row label="Disability" value={`${result.disabilityPct}%`} />
              )}
              <Row
                label={result.nature === 'DEATH' ? 'Loss of dependency' : 'Loss of earning'}
                value={formatINR(result.lossOfDependencyOrEarning)}
                strong
              />
              <div className="border-t border-border pt-2">
                {Object.entries(result.heads ?? {})
                  .filter(([, v]) => (v as number) > 0)
                  .map(([k, v]) => (
                    <Row key={k} label={k.replace(/([A-Z])/g, ' $1')} value={formatINR(v as number)} />
                  ))}
              </div>
              {result.notes?.length > 0 && (
                <p className="text-xs text-muted-foreground">{result.notes.join(' ')}</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: any; strong?: boolean }) {
  return (
    <div className="flex justify-between text-sm capitalize">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? 'font-semibold' : ''}>{value}</span>
    </div>
  );
}
