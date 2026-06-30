'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Badge, Card, StatCard } from '@/components/ui';
import { Empty, Spinner } from '@/components/ui-kit';
import { formatINR } from '@/lib/utils';

export default function FeesPage() {
  const { user } = useAuth();
  const allowed = ['ADMINISTRATOR', 'ADVOCATE', 'JUNIOR_ADVOCATE', 'OFFICE_STAFF'].includes(user?.role ?? '');

  const { data, isLoading } = useQuery({
    queryKey: ['pending-fees'],
    queryFn: async () => (await api.get('/reports/pending-fees')).data as any[],
    enabled: allowed,
  });

  if (!allowed) return <Empty message="You don't have access to fees." />;
  if (isLoading) return <Spinner label="Loading fees…" />;

  const rows = data ?? [];
  const totalPending = rows.reduce((s, r) => s + (r.pending ?? 0), 0);
  const totalReceived = rows.reduce((s, r) => s + (r.received ?? 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Fees</h1>
        <p className="text-sm text-muted-foreground">Outstanding balances across all cases</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Cases with pending fees" value={rows.length} />
        <StatCard label="Total pending" value={formatINR(totalPending)} />
        <StatCard label="Total received" value={formatINR(totalReceived)} />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Case</th>
              <th className="px-4 py-3 font-medium">Expected</th>
              <th className="px-4 py-3 font-medium">Received</th>
              <th className="px-4 py-3 font-medium">Pending</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No pending fees 🎉</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className="border-t border-border hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium">{r.mactCaseNumber || r.caseRef}</td>
                <td className="px-4 py-3">{formatINR(r.expected)}</td>
                <td className="px-4 py-3">{formatINR(r.received)}</td>
                <td className="px-4 py-3"><Badge className="bg-destructive/15 text-destructive">{formatINR(r.pending)}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
