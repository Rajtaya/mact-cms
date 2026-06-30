'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Badge, Button, Card, Input } from '@/components/ui';
import { Field, Modal, Select, Empty } from '@/components/ui-kit';
import { formatDate } from '@/lib/utils';

const ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
  'UPLOAD',
  'DOWNLOAD',
] as const;

type Action = (typeof ACTIONS)[number];

interface AuditUser {
  fullName: string;
  email: string;
  role: string;
}

interface AuditLog {
  id: string;
  createdAt: string;
  action: Action;
  entity: string;
  entityId: string;
  ipAddress: string | null;
  user: AuditUser | null;
  before: unknown;
  after: unknown;
}

const ACTION_CLASS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  DELETE: 'bg-red-100 text-red-700',
};

function actionClass(action: string): string {
  return ACTION_CLASS[action] ?? '';
}

function shortId(id?: string | null): string {
  if (!id) return '';
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function jsonText(value: unknown): string {
  if (value == null) return '—';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AuditPage() {
  const { user } = useAuth();
  const allowed = user?.role === 'ADMINISTRATOR' || user?.role === 'ADVOCATE';

  const [entity, setEntity] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', entity, page],
    queryFn: async () =>
      (
        await api.get('/audit-logs', {
          params: {
            page,
            pageSize: 10,
            entity: entity || undefined,
          },
        })
      ).data,
    enabled: allowed,
  });

  if (!allowed) {
    return <Empty message="You don't have access to audit logs." />;
  }

  const rows: AuditLog[] = data?.data ?? [];
  const meta = data?.meta;

  // Action filtering is client-side: the server only supports entity/entityId/userId.
  const visibleRows = actionFilter
    ? rows.filter((r) => r.action === actionFilter)
    : rows;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Immutable change history</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Filter by entity (e.g. Case, User)…"
          value={entity}
          onChange={(e) => {
            setEntity(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="max-w-[12rem]"
        >
          <option value="">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entity</th>
              <th className="px-4 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : visibleRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              visibleRows.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelected(log)}
                  className="cursor-pointer border-t border-border hover:bg-secondary/50"
                >
                  <td className="px-4 py-3">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3">{log.user?.fullName ?? 'System'}</td>
                  <td className="px-4 py-3">
                    <Badge className={actionClass(log.action)}>{log.action}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{log.entity}</span>
                    {log.entityId && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        {shortId(log.entityId)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {log.ipAddress ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} entries
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.action} · ${selected.entity}` : 'Audit entry'}
        className="max-w-4xl"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Time: </span>
                {formatDate(selected.createdAt)}
              </div>
              <div>
                <span className="text-muted-foreground">User: </span>
                {selected.user?.fullName ?? 'System'}
                {selected.user?.email && (
                  <span className="text-muted-foreground"> ({selected.user.email})</span>
                )}
              </div>
              <div>
                <span className="text-muted-foreground">Entity: </span>
                {selected.entity} {shortId(selected.entityId)}
              </div>
              <div>
                <span className="text-muted-foreground">IP: </span>
                {selected.ipAddress ?? '—'}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Before">
                <pre className="max-h-80 overflow-auto rounded-md border border-border bg-secondary/50 p-3 text-xs">
                  {jsonText(selected.before)}
                </pre>
              </Field>
              <Field label="After">
                <pre className="max-h-80 overflow-auto rounded-md border border-border bg-secondary/50 p-3 text-xs">
                  {jsonText(selected.after)}
                </pre>
              </Field>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
