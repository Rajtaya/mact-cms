'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Activity, AlertTriangle, Briefcase, CalendarClock, CheckCircle2,
  IndianRupee, TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Card, StatCard } from '@/components/ui';
import { formatDate, formatINR } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard')).data,
  });

  if (isLoading || !data) {
    return <p className="text-muted-foreground">Loading dashboard…</p>;
  }

  const k = data.kpis;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {data.perspective === 'SENIOR'
            ? 'Analytical portfolio overview'
            : 'Daily operational workflow'}
        </p>
      </div>

      {/* Common KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Cases" value={k.totalActiveCases} icon={<Briefcase />} />
        <StatCard label="Listed Today" value={k.casesListedToday} icon={<CalendarClock />} />
        <StatCard label="Listed Tomorrow" value={k.casesListedTomorrow} icon={<CalendarClock />} />
        <StatCard label="Cases Decided" value={k.casesDecided} icon={<CheckCircle2 />} />
      </div>

      {/* Senior analytical portfolio */}
      {data.perspective === 'SENIOR' && data.executive && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Litigation Success Rate"
              value={`${data.executive.litigationSuccessRatePct}%`}
              icon={<TrendingUp />}
            />
            <StatCard
              label="Aggregate Court Awards"
              value={formatINR(data.executive.aggregateCourtAwards)}
              icon={<IndianRupee />}
            />
            <StatCard
              label="Uncollected Fees"
              value={formatINR(data.executive.cumulativeUncollectedFees)}
              hint={`Collected: ${formatINR(data.executive.totalFeesCollected)}`}
              icon={<IndianRupee />}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-3 font-medium">Aging Profile (active files)</h3>
              <div className="space-y-2">
                {Object.entries(data.trends?.agingProfile ?? {}).map(
                  ([bucket, count]) => (
                    <div key={bucket} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{bucket} days</span>
                      <Badge>{count as number}</Badge>
                    </div>
                  ),
                )}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="mb-3 font-medium">Monthly Collections</h3>
              <div className="space-y-2">
                {(data.trends?.cashflowByMonth ?? []).map((m: any) => (
                  <div key={m.month} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{m.month}</span>
                    <span className="font-medium">{formatINR(m.total)}</span>
                  </div>
                ))}
                {(data.trends?.cashflowByMonth ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No collections yet.</p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Operational grid */}
      {data.perspective === 'OPERATIONAL' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-3 font-medium">Daily Action Hub</h3>
            <div className="space-y-2">
              {(data.dailyActionHub ?? []).map((c: any) => (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-secondary"
                >
                  <div>
                    <p className="font-medium">{c.mactCaseNumber ?? c.caseRef}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.court?.name} · Ct {c.courtNumber ?? '—'} · {c.claimants?.[0]?.name}
                    </p>
                  </div>
                  <Badge>{formatDate(c.nextHearingDate)}</Badge>
                </Link>
              ))}
              {(data.dailyActionHub ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No hearings today/tomorrow.</p>
              )}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Missing Document Index
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <MissBox label="Missing FIR" n={data.missingDocumentIndex?.missingFIR?.length ?? 0} />
              <MissBox label="Missing RC" n={data.missingDocumentIndex?.missingRC?.length ?? 0} />
              <MissBox label="No Docs" n={data.missingDocumentIndex?.casesWithNoDocuments ?? 0} />
            </div>
          </Card>
        </div>
      )}

      {/* Recent activity (everyone) */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center gap-2 font-medium">
          <Activity className="h-4 w-4" /> Recent Activity
        </h3>
        <ul className="space-y-2 text-sm">
          {(data.recentActivities ?? []).map((a: any) => (
            <li key={a.id} className="flex justify-between text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">
                  {a.user?.fullName ?? 'System'}
                </span>{' '}
                {a.verb}
              </span>
              <span>{formatDate(a.createdAt)}</span>
            </li>
          ))}
          {(data.recentActivities ?? []).length === 0 && (
            <li className="text-muted-foreground">No recent activity.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}

function MissBox({ label, n }: { label: string; n: number }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className={`text-2xl font-semibold ${n > 0 ? 'text-destructive' : ''}`}>{n}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
