/** KYC masking helpers (PRD §1 — Enterprise Security Baseline). */

/** Roles permitted to see raw KYC values. Everyone else gets masked output. */
export const KYC_PRIVILEGED_ROLES = ['ADMINISTRATOR', 'ADVOCATE'];

/** Field names that hold sensitive identifiers and must be masked. */
export const SENSITIVE_FIELDS = new Set([
  'aadhaar',
  'pan',
  'bankAccountNo',
]);

/** XXXX-XXXX-1234 style mask — keeps only the last 4 chars visible. */
export function maskValue(value: string): string {
  const digits = value.replace(/\s|-/g, '');
  if (digits.length <= 4) return '****';
  const last4 = digits.slice(-4);
  if (digits.length === 12) {
    // Aadhaar — format as XXXX-XXXX-1234
    return `XXXX-XXXX-${last4}`;
  }
  return `${'X'.repeat(Math.max(4, digits.length - 4))}${last4}`;
}

export function canViewRawKyc(role?: string): boolean {
  return !!role && KYC_PRIVILEGED_ROLES.includes(role);
}
