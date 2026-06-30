'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Badge, Button, Card, Input } from '@/components/ui';
import { Field, Modal, Spinner, Tabs } from '@/components/ui-kit';

interface FieldDef {
  name: string;
  label: string;
  required?: boolean;
}

interface EntityDef {
  key: string;
  label: string;
  fields: FieldDef[];
  columns: { name: string; label: string }[];
}

const ENTITIES: EntityDef[] = [
  {
    key: 'courts',
    label: 'Courts',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'courtNumber', label: 'Court Number' },
      { name: 'district', label: 'District' },
      { name: 'state', label: 'State' },
      { name: 'presidingOfficer', label: 'Presiding Officer' },
      { name: 'address', label: 'Address' },
    ],
    columns: [
      { name: 'name', label: 'Name' },
      { name: 'courtNumber', label: 'Court No.' },
      { name: 'district', label: 'District' },
      { name: 'state', label: 'State' },
      { name: 'presidingOfficer', label: 'Presiding Officer' },
    ],
  },
  {
    key: 'judges',
    label: 'Judges',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'designation', label: 'Designation' },
    ],
    columns: [
      { name: 'name', label: 'Name' },
      { name: 'designation', label: 'Designation' },
    ],
  },
  {
    key: 'insurance-companies',
    label: 'Insurance Companies',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'shortName', label: 'Short Name' },
      { name: 'irdaCode', label: 'IRDA Code' },
      { name: 'contactNo', label: 'Contact No.' },
      { name: 'email', label: 'Email' },
    ],
    columns: [
      { name: 'name', label: 'Name' },
      { name: 'shortName', label: 'Short Name' },
      { name: 'irdaCode', label: 'IRDA Code' },
      { name: 'contactNo', label: 'Contact No.' },
      { name: 'email', label: 'Email' },
    ],
  },
  {
    key: 'police-stations',
    label: 'Police Stations',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'district', label: 'District' },
      { name: 'state', label: 'State' },
    ],
    columns: [
      { name: 'name', label: 'Name' },
      { name: 'district', label: 'District' },
      { name: 'state', label: 'State' },
    ],
  },
  {
    key: 'hospitals',
    label: 'Hospitals',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'city', label: 'City' },
      { name: 'district', label: 'District' },
      { name: 'state', label: 'State' },
    ],
    columns: [
      { name: 'name', label: 'Name' },
      { name: 'city', label: 'City' },
      { name: 'district', label: 'District' },
      { name: 'state', label: 'State' },
    ],
  },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeKey, setActiveKey] = useState(ENTITIES[0].key);
  const entity = ENTITIES.find((e) => e.key === activeKey) ?? ENTITIES[0];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Master data configuration</p>
      </div>

      <Tabs
        tabs={ENTITIES.map((e) => ({ key: e.key, label: e.label }))}
        value={activeKey}
        onChange={setActiveKey}
      />

      <EntityTable key={entity.key} entity={entity} canWrite={user?.role === 'ADMINISTRATOR'} />
    </div>
  );
}

function EntityTable({ entity, canWrite }: { entity: EntityDef; canWrite: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['settings', entity.key, search, page],
    queryFn: async () =>
      (
        await api.get(`/settings/${entity.key}`, {
          params: { search: search || undefined, page, pageSize: 10 },
        })
      ).data,
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['settings', entity.key] });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/settings/${entity.key}/${id}`),
    onSuccess: invalidate,
  });

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(row: any) {
    setEditing(row);
    setModalOpen(true);
  }

  function handleDelete(row: any) {
    if (confirm(`Delete "${row.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(row.id);
    }
  }

  const colSpan = entity.columns.length + (canWrite ? 1 : 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add {entity.label.replace(/s$/, '')}
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-muted-foreground">
            <tr>
              {entity.columns.map((c) => (
                <th key={c.name} className="px-4 py-3 font-medium">
                  {c.label}
                </th>
              ))}
              {canWrite && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-6 text-center text-muted-foreground">
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((row: any) => (
                <tr key={row.id} className="border-t border-border hover:bg-secondary/50">
                  {entity.columns.map((c, i) => (
                    <td key={c.name} className="px-4 py-3">
                      {i === 0 ? (
                        <span className="font-medium">{row[c.name] ?? '—'}</span>
                      ) : (
                        row[c.name] ?? '—'
                      )}
                    </td>
                  ))}
                  {canWrite && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(row)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} records
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

      {modalOpen && (
        <EntityFormModal
          entity={entity}
          record={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            invalidate();
          }}
        />
      )}
    </div>
  );
}

function EntityFormModal({
  entity,
  record,
  onClose,
  onSaved,
}: {
  entity: EntityDef;
  record: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial: Record<string, string> = {};
  for (const f of entity.fields) initial[f.name] = record?.[f.name] ?? '';
  const [form, setForm] = useState<Record<string, string>>(initial);

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      if (record) {
        return api.patch(`/settings/${entity.key}/${record.id}`, payload);
      }
      return api.post(`/settings/${entity.key}`, payload);
    },
    onSuccess: onSaved,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, string> = {};
    for (const f of entity.fields) {
      const v = form[f.name]?.trim() ?? '';
      if (v) payload[f.name] = v;
    }
    mutation.mutate(payload);
  }

  const singular = entity.label.replace(/s$/, '');

  return (
    <Modal
      open
      onClose={onClose}
      title={record ? `Edit ${singular}` : `Add ${singular}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {entity.fields.map((f) => (
          <Field key={f.name} label={f.required ? `${f.label} *` : f.label}>
            <Input
              value={form[f.name] ?? ''}
              required={f.required}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
            />
          </Field>
        ))}

        {mutation.isError && (
          <p className="text-sm text-destructive">
            Failed to save. Please try again.
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Spinner /> : record ? 'Save Changes' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
