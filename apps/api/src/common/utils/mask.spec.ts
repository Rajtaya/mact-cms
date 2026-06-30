import { canViewRawKyc, maskValue } from './mask';

describe('maskValue', () => {
  it('formats a 12-digit Aadhaar as XXXX-XXXX-1234', () => {
    expect(maskValue('234512347890')).toBe('XXXX-XXXX-7890');
  });

  it('ignores spaces and hyphens in the input', () => {
    expect(maskValue('2345 1234 7890')).toBe('XXXX-XXXX-7890');
  });

  it('masks a bank account keeping the last 4 visible', () => {
    expect(maskValue('50100123456789')).toMatch(/^X+6789$/);
  });

  it('fully masks very short values', () => {
    expect(maskValue('123')).toBe('****');
  });
});

describe('canViewRawKyc', () => {
  it('allows Administrator and Advocate', () => {
    expect(canViewRawKyc('ADMINISTRATOR')).toBe(true);
    expect(canViewRawKyc('ADVOCATE')).toBe(true);
  });

  it('denies lower roles', () => {
    expect(canViewRawKyc('JUNIOR_ADVOCATE')).toBe(false);
    expect(canViewRawKyc('OFFICE_STAFF')).toBe(false);
    expect(canViewRawKyc('READ_ONLY')).toBe(false);
    expect(canViewRawKyc(undefined)).toBe(false);
  });
});
