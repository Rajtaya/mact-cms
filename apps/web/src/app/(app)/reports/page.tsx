'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, Archive, CalendarClock, FileSpreadsheet, FileText,
  Gavel, IndianRupee, Landmark, ListChecks, Wallet,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { can } from '@/lib/permissions';
import { Badge, Button, Card } from '@/components/ui';
import { Empty, Field, Select, Spinner } from '@/components/ui-kit';
import { cn, formatDate, formatINR } from '@/lib/utils';

type ReportParam = 'year' | 'days';

interface ReportDef {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  param?: ReportParam;
}

const REPORTS: ReportDef[] = [
  { key: 'active-cases', label: 'Active Cases', description: 'All currently open files', icon: <Activity className="h-4 w-4" /> },
  { key: 'closed-cases', label: 'Closed Cases', description: 'Decided & disposed files', icon: <Archive className="h-4 w-4" /> },
  { key: 'monthly-income', label: 'Monthly Income', description: 'Fee collections by month', icon: <IndianRupee className="h-4 w-4" />, param: 'year' },
  { key: 'pending-fees', label: 'Pending Fees', description: 'Outstanding receivables', icon: <Wallet className="h-4 w-4" /> },
  { key: 'upcoming-hearings', label: 'Upcoming Hearings', description: 'Hearings in the next N days', icon: <CalendarClock className="h-4 w-4" />, param: 'days' },
  { key: 'compensation-awarded', label: 'Compensation Awarded', description: 'Awards granted by the tribunal', icon: <Gavel className="h-4 w-4" /> },
  { key: 'insurance-company-wise', label: 'Insurance Company-wise', description: 'Caseload grouped by insurer', icon: <Landmark className="h-4 w-4" /> },
  { key: 'court-wise', label: 'Court-wise', description: 'Caseload grouped by court', icon: <ListChecks className="h-4 w-4" /> },
];

const MONEY_RE = /amount|fee|awarded|pending|received|total|income|claimed|expected/i;
const DATE_RE = /date|hearing|closedOn|awardDate/i;

function humanize(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function formatCell(key: string, value: unknown): React.ReactNode {
  if (value == null || value === '') return '—';
  if (DATE_RE.test(key) && (typeof value === 'string' || value instanceof Date)) {
    return formatDate(value as string);
  }
  if (MONEY_RE.test(key) && (typeof value === 'number' || (typeof value === 'string' && value !== '' && !Number.isNaN(Number(value))))) {
    return formatINR(value as number);
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string>(REPORTS[0].key);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [days, setDays] = useState<number>(30);
  const [exporting, setExporting] = useState<'xlsx' | 'pdf' | null>(null);

  const allowed =
    can(user?.role, 'fees.view') &&
    (user?.role === 'ADMINISTRATOR' || user?.role === 'ADVOCATE');

  const def = REPORTS.find((r) => r.key === selected)!;

  const params = useMemo(() => {
    if (def.param === 'year') return { year };
    if (def.param === 'days') return { days };
    return {};
  }, [def.param, year, days]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', selected, params],
    queryFn: async () => (await api.get(`/reports/${selected}`, { params })).data,
    enabled: allowed,
  });

  const rows: Record<string, unknown>[] = Array.isArray(data) ? data : [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  // Sum the first money-looking column, if any, for the summary line.
  const moneyCol = columns.find((c) => MONEY_RE.test(c));
  const moneyTotal = useMemo(() => {
    if (!moneyCol) return null;
    return rows.reduce((acc, r) => {
      const v = r[moneyCol];
      const n = typeof v === 'string' ? Number(v) : (v as number);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [rows, moneyCol]);

  async function handleExport(format: 'xlsx' | 'pdf') {
    setExporting(format);
    try {
      const res = await api.get(`/reports/${selected}/export`, {
        params: { format, ...params },
        responseType: 'blob',
      });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selected}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      /* surfaced via disabled state reset below */
    } finally {
      setExporting(null);
    }
  }

  if (!allowed) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Operational and analytical reports
          </p>
        </div>
        <Empty message="You don't have access to reports." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Operational and analytical reports
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
        {/* Left: report picker */}
        <div className="space-y-2">
          {REPORTS.map((r) => (
            <button
              key={r.key}
              onClick={() => setSelected(r.key)}
              className={cn(
                'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition',
                selected === r.key
                  ? 'border-primary bg-secondary'
                  : 'border-border bg-card hover:bg-secondary/50',
              )}
            >
              <span className="mt-0.5 text-primary">{r.icon}</span>
              <span>
                <span className="block text-sm font-medium">{r.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {r.description}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* Right: results */}
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <h3 className="font-medium">{def.label}</h3>
                <p className="text-xs text-muted-foreground">{def.description}</p>
              </div>
              {def.param === 'year' && (
                <Field label="Year">
                  <Select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="h-9 w-28"
                  >
                    {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - i).map(
                      (y) => (
                        <option key={y} value={y}>{y}</option>
                      ),
                    )}
                  </Select>
                </Field>
              )}
              {def.param === 'days' && (
                <Field label="Days ahead">
                  <Select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="h-9 w-28"
                  >
                    {[7, 15, 30, 45, 60, 90].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={exporting !== null || rows.length === 0}
                onClick={() => handleExport('xlsx')}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {exporting === 'xlsx' ? 'Exporting…' : 'Excel'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={exporting !== null || rows.length === 0}
                onClick={() => handleExport('pdf')}
              >
                <FileText className="h-4 w-4" />
                {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
              </Button>
            </div>
          </div>

          {/* Summary line */}
          {!isLoading && !isError && rows.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-b border-border bg-secondary/40 px-4 py-2 text-sm">
              <Badge>{rows.length} {rows.length === 1 ? 'row' : 'rows'}</Badge>
              {moneyCol && moneyTotal != null && (
                <span className="text-muted-foreground">
                  Total {humanize(moneyCol)}:{' '}
                  <span className="font-medium text-foreground">
                    {formatINR(moneyTotal)}
                  </span>
                </span>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6">
                <Spinner label="Loading report…" />
              </div>
            ) : isError ? (
              <div className="p-4">
                <Empty message="Failed to load this report. Please try again." />
              </div>
            ) : rows.length === 0 ? (
              <div className="p-4">
                <Empty message="No data for this report." />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary text-left text-muted-foreground">
                  <tr>
                    {columns.map((c) => (
                      <th key={c} className="whitespace-nowrap px-4 py-3 font-medium">
                        {humanize(c)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-t border-border hover:bg-secondary/50">
                      {columns.map((c) => (
                        <td key={c} className="whitespace-nowrap px-4 py-3">
                          {formatCell(c, row[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
