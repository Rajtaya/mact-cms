'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';

/** Controlled tab bar. Caller renders content based on `value`. */
export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: string; label: string; badge?: number }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            'relative -mb-px border-b-2 px-4 py-2 text-sm font-medium transition',
            value === t.key
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
          {t.badge != null && t.badge > 0 && (
            <span className="ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 text-xs">
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-[80px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring',
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

/** Labelled field wrapper for forms. */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Lightweight modal dialog. */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className={cn(
          'my-8 w-full max-w-lg rounded-lg border border-border bg-card shadow-xl',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
      {label ?? 'Loading…'}
    </div>
  );
}

/** Empty-state placeholder. */
export function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
