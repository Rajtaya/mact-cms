/** Client-side mirror of the PRD RBAC matrix — drives nav/menu visibility.
 *  The backend remains the source of truth; this only shapes the UI. */
export type Role =
  | 'ADMINISTRATOR'
  | 'ADVOCATE'
  | 'JUNIOR_ADVOCATE'
  | 'OFFICE_STAFF'
  | 'READ_ONLY';

export type Capability =
  | 'cases.view'
  | 'cases.edit'
  | 'cases.delete'
  | 'fees.view'
  | 'fees.config'
  | 'fees.receipt'
  | 'calculator.use'
  | 'calculator.save'
  | 'masters.manage'
  | 'masters.view'
  | 'audit.view'
  | 'users.manage';

const MATRIX: Record<Role, Capability[]> = {
  ADMINISTRATOR: [
    'cases.view', 'cases.edit', 'cases.delete', 'fees.view', 'fees.config',
    'fees.receipt', 'calculator.use', 'calculator.save', 'masters.manage',
    'masters.view', 'audit.view', 'users.manage',
  ],
  ADVOCATE: [
    'cases.view', 'cases.edit', 'cases.delete', 'fees.view', 'fees.config',
    'fees.receipt', 'calculator.use', 'calculator.save', 'masters.view',
    'audit.view',
  ],
  JUNIOR_ADVOCATE: [
    'cases.view', 'cases.edit', 'fees.view', 'calculator.use', 'calculator.save',
  ],
  OFFICE_STAFF: ['cases.view', 'cases.edit', 'fees.view', 'fees.receipt'],
  READ_ONLY: ['cases.view', 'calculator.use'],
};

export function can(role: Role | undefined, cap: Capability): boolean {
  if (!role) return false;
  return MATRIX[role]?.includes(cap) ?? false;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMINISTRATOR: 'System Admin',
  ADVOCATE: 'Senior Advocate',
  JUNIOR_ADVOCATE: 'Junior Advocate',
  OFFICE_STAFF: 'Office Staff',
  READ_ONLY: 'Read-Only User',
};
