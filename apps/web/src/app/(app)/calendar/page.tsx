'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { api } from '@/lib/api';
import { Badge, Button, Card } from '@/components/ui';
import { Tabs, Empty, Spinner } from '@/components/ui-kit';
import { cn } from '@/lib/utils';

interface CaseEvent {
  id: string;
  caseRef: string;
  mactCaseNumber: string | null;
  nextHearingDate: string | null;
  stage: string | null;
  status: string | null;
  court: { name: string } | null;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const [view, setView] = useState<'month' | 'week'>('month');
  const [cursor, setCursor] = useState(() => new Date());
  const today = new Date();

  const { data, isLoading } = useQuery({
    queryKey: ['calendar-cases'],
    queryFn: async () =>
      (await api.get('/cases', { params: { pageSize: 100 } })).data,
  });

  const cases: CaseEvent[] = data?.data ?? [];

  // Index hearings by calendar day for quick lookup.
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CaseEvent[]>();
    for (const c of cases) {
      if (!c.nextHearingDate) continue;
      const d = new Date(c.nextHearingDate);
      if (Number.isNaN(d.getTime())) continue;
      const key = format(d, 'yyyy-MM-dd');
      const list = map.get(key);
      if (list) list.push(c);
      else map.set(key, [c]);
    }
    return map;
  }, [cases]);

  const eventsForDay = (day: Date) => eventsByDay.get(format(day, 'yyyy-MM-dd')) ?? [];

  // Visible range (also used to count hearings in view).
  const rangeStart =
    view === 'month'
      ? startOfWeek(startOfMonth(cursor))
      : startOfWeek(cursor);
  const rangeEnd =
    view === 'month' ? endOfWeek(endOfMonth(cursor)) : endOfWeek(cursor);

  const days = useMemo(
    () => eachDayOfInterval({ start: rangeStart, end: rangeEnd }),
    [rangeStart.getTime(), rangeEnd.getTime()],
  );

  const weekDays = view === 'week' ? days : [];

  const hearingsInView = useMemo(
    () => days.reduce((sum, d) => sum + eventsForDay(d).length, 0),
    [days, eventsByDay],
  );

  const label =
    view === 'month'
      ? format(cursor, 'MMMM yyyy')
      : `${format(startOfWeek(cursor), 'd MMM')} – ${format(
          endOfWeek(cursor),
          'd MMM yyyy',
        )}`;

  function go(dir: -1 | 1) {
    setCursor((c) =>
      view === 'month'
        ? dir === 1
          ? addMonths(c, 1)
          : subMonths(c, 1)
        : dir === 1
          ? addWeeks(c, 1)
          : subWeeks(c, 1),
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <p className="text-sm text-muted-foreground">Hearing schedule</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={[
            { key: 'month', label: 'Month' },
            { key: 'week', label: 'Week' },
          ]}
          value={view}
          onChange={(k) => setView(k as 'month' | 'week')}
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => go(-1)} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => go(1)} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{label}</h2>
        <span className="text-sm text-muted-foreground">
          {hearingsInView} hearing{hearingsInView === 1 ? '' : 's'} in view
        </span>
      </div>

      {isLoading ? (
        <Spinner label="Loading hearings…" />
      ) : hearingsInView === 0 ? (
        <Empty message="No hearings scheduled in this period." />
      ) : view === 'month' ? (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border bg-secondary text-center text-xs font-medium text-muted-foreground">
            {WEEKDAYS.map((w) => (
              <div key={w} className="px-2 py-2">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const events = eventsForDay(day);
              const inMonth = isSameMonth(day, cursor);
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'min-h-[7rem] border-b border-r border-border p-1.5 align-top',
                    !inMonth && 'bg-secondary/40 text-muted-foreground',
                    isToday && 'bg-primary/5',
                  )}
                >
                  <div
                    className={cn(
                      'mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                      isToday && 'bg-primary font-semibold text-primary-foreground',
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {events.map((c) => (
                      <Link key={c.id} href={`/cases/${c.id}`} className="block">
                        <Badge className="w-full justify-start truncate bg-primary/10 text-primary hover:bg-primary/20">
                          {c.mactCaseNumber ?? c.caseRef}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {weekDays.map((day) => {
            const events = eventsForDay(day);
            const isToday = isSameDay(day, today);
            return (
              <Card
                key={day.toISOString()}
                className={cn('p-3', isToday && 'ring-2 ring-primary')}
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {format(day, 'EEE')}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      isToday && 'text-primary',
                    )}
                  >
                    {format(day, 'd MMM')}
                  </span>
                </div>
                <div className="space-y-2">
                  {events.length === 0 ? (
                    <p className="text-xs text-muted-foreground">—</p>
                  ) : (
                    events.map((c) => (
                      <Link
                        key={c.id}
                        href={`/cases/${c.id}`}
                        className="block rounded-md border border-border p-2 text-xs hover:bg-secondary"
                      >
                        <p className="font-medium text-primary">
                          {c.mactCaseNumber ?? c.caseRef}
                        </p>
                        <p className="text-muted-foreground">
                          {c.court?.name ?? '—'}
                        </p>
                        {c.stage && <Badge className="mt-1">{c.stage}</Badge>}
                      </Link>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
