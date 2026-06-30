'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ROLE_LABELS, type Role } from '@/lib/permissions';
import { Badge, Button, Card, Input } from '@/components/ui';
import { Empty, Field, Modal, Select } from '@/components/ui-kit';
import { formatDate } from '@/lib/utils';

const ROLES: Role[] = [
  'ADMINISTRATOR',
  'ADVOCATE',
  'JUNIOR_ADVOCATE',
  'OFFICE_STAFF',
  'READ_ONLY',
];

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string | null;
}

interface UserForm {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
  isActive: boolean;
}

const EMPTY_FORM: UserForm = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  role: 'READ_ONLY',
  isActive: true,
};

export default function UsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, page],
    queryFn: async () =>
      (
        await api.get('/users', {
          params: { search: search || undefined, page, pageSize: 10 },
        })
      ).data,
    enabled: user?.role === 'ADMINISTRATOR',
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: UserForm) => {
      if (editing) {
        const body: Record<string, unknown> = {
          fullName: payload.fullName,
          email: payload.email,
          phone: payload.phone || undefined,
          role: payload.role,
          isActive: payload.isActive,
        };
        return (await api.patch(`/users/${editing.id}`, body)).data;
      }
      return (
        await api.post('/users', {
          fullName: payload.fullName,
          email: payload.email,
          password: payload.password,
          phone: payload.phone || undefined,
          role: payload.role,
        })
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? 'Failed to save user.');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/users/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  if (user?.role !== 'ADMINISTRATOR') {
    return <Empty message="Administrator access required." />;
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(row: UserRow) {
    setEditing(row);
    setForm({
      fullName: row.fullName,
      email: row.email,
      password: '',
      phone: row.phone ?? '',
      role: row.role,
      isActive: row.isActive,
    });
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    saveMutation.mutate(form);
  }

  const rows: UserRow[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage accounts and roles</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New User
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search name, email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last login</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-secondary/50">
                  <td className="px-4 py-3 font-medium">{u.fullName}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge>{ROLE_LABELS[u.role] ?? u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        u.isActive
                          ? 'bg-primary/10 text-primary'
                          : 'bg-destructive/10 text-destructive'
                      }
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{formatDate(u.lastLoginAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                        Edit
                      </Button>
                      {u.isActive && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={
                            deactivateMutation.isPending || u.id === user?.id
                          }
                          onClick={() => {
                            if (
                              window.confirm(`Deactivate ${u.fullName}?`)
                            ) {
                              deactivateMutation.mutate(u.id);
                            }
                          }}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
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
            Page {meta.page} of {meta.totalPages} · {meta.total} users
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
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit User' : 'New User'}
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name">
            <Input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </Field>

          <Field label="Email">
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>

          {!editing && (
            <Field label="Password">
              <Input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
          )}

          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>

          <Field label="Role">
            <Select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as Role })
              }
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>

          {editing && (
            <Field label="Status">
              <Select
                value={form.isActive ? 'active' : 'inactive'}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.value === 'active' })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? 'Saving…'
                : editing
                  ? 'Save Changes'
                  : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
