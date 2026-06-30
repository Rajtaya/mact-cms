'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { can } from '@/lib/permissions';
import { Badge, Button, Card, Input } from '@/components/ui';
import { formatDate } from '@/lib/utils';

const STATUSES = ['', 'ACTIVE', 'RESERVED_FOR_ORDER', 'DECIDED', 'DISPOSED', 'DRAFT'];

export default function CasesPage() {
  const params = useSearchParams();
  const { user } = useAuth();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['cases', search, status, page],
    queryFn: async () =>
      (
        await api.get('/cases', {
          params: { search: search || undefined, status: status || undefined, page, pageSize: 10 },
        })
      ).data,
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cases</h1>
        {can(user?.role, 'cases.edit') && (
          <Link href="/cases/new">
            <Button><Plus className="h-4 w-4" /> New Case</Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search case no., claimant…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || 'All statuses'}</option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Case</th>
              <th className="px-4 py-3 font-medium">Court</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Next Hearing</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No cases found.</td></tr>
            ) : (
              rows.map((c: any) => (
                <tr key={c.id} className="border-t border-border hover:bg-secondary/50">
                  <td className="px-4 py-3">
                    <Link href={`/cases/${c.id}`} className="font-medium text-primary hover:underline">
                      {c.mactCaseNumber ?? c.caseRef}
                    </Link>
                    <p className="text-xs text-muted-foreground">{c.claimants?.[0]?.name ?? c.caseRef}</p>
                  </td>
                  <td className="px-4 py-3">{c.court?.name ?? '—'}</td>
                  <td className="px-4 py-3"><Badge>{c.stage}</Badge></td>
                  <td className="px-4 py-3"><Badge>{c.status}</Badge></td>
                  <td className="px-4 py-3">{formatDate(c.nextHearingDate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} cases
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
