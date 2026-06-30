'use client';

import { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ROLE_LABELS } from '@/lib/permissions';
import { Button, Card, Input } from '@/components/ui';
import { Field } from '@/components/ui-kit';

export default function AccountPage() {
  const { user, changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDone(false);
    if (next.length < 8) return setError('New password must be at least 8 characters.');
    if (next !== confirm) return setError('New password and confirmation do not match.');
    setLoading(true);
    try {
      await changePassword(current, next);
      setDone(true);
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not change password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-sm text-muted-foreground">Your profile and security settings</p>
      </div>

      <Card className="p-5">
        <h3 className="mb-3 font-medium">Profile</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium">{user?.fullName}</p></div>
          <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{user?.email}</p></div>
          <div><p className="text-xs text-muted-foreground">Role</p><p className="font-medium">{user && ROLE_LABELS[user.role]}</p></div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-1 flex items-center gap-2 font-medium"><KeyRound className="h-4 w-4" /> Change password</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          For your security, changing your password signs out all other devices.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Current password">
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
          </Field>
          <Field label="New password (min 8 characters)">
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required />
          </Field>
          <Field label="Confirm new password">
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {done && (
            <p className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
              <ShieldCheck className="h-4 w-4" /> Password changed successfully.
            </p>
          )}
          <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Update password'}</Button>
        </form>
      </Card>
    </div>
  );
}
