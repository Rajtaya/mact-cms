import {
  computeCompensation,
  derivedFutureProspectsPct,
  dependencyDeductionForDependents,
  multiplierForAge,
} from './compensation.calculator';

describe('multiplierForAge (Sarla Verma table)', () => {
  it.each([
    [15, 15],
    [25, 18],
    [30, 17],
    [38, 15],
    [45, 14],
    [50, 13],
    [55, 11],
    [60, 9],
    [65, 7],
    [80, 5],
  ])('age %i → multiplier %i', (age, expected) => {
    expect(multiplierForAge(age)).toBe(expected);
  });

  it('returns 0 when age is undefined', () => {
    expect(multiplierForAge(undefined)).toBe(0);
  });
});

describe('derivedFutureProspectsPct (Pranay Sethi)', () => {
  it('self-employed under 40 → 40%', () => {
    expect(derivedFutureProspectsPct(38, 'SELF_EMPLOYED')).toBe(40);
  });
  it('permanent under 40 → 50%', () => {
    expect(derivedFutureProspectsPct(38, 'PERMANENT')).toBe(50);
  });
  it('self-employed 40–50 → 25%', () => {
    expect(derivedFutureProspectsPct(45, 'SELF_EMPLOYED')).toBe(25);
  });
  it('over 60 → 0%', () => {
    expect(derivedFutureProspectsPct(62)).toBe(0);
  });
});

describe('dependencyDeductionForDependents (Sarla Verma)', () => {
  it.each([
    [1, 50],
    [3, 33.33],
    [5, 25],
    [8, 20],
  ])('%i dependents → %f%%', (deps, pct) => {
    expect(dependencyDeductionForDependents(deps)).toBe(pct);
  });
});

describe('computeCompensation', () => {
  it('death claim: age 38, ₹25k/mo, 3 dependents', () => {
    const r = computeCompensation({
      nature: 'DEATH',
      age: 38,
      monthlyIncome: 25000,
      dependents: 3,
      funeralExpenses: 15000,
      consortium: 40000,
    });
    expect(r.multiplier).toBe(15);
    expect(r.futureProspectsPct).toBe(40);
    expect(r.annualIncome).toBe(300000);
    expect(r.incomeWithProspects).toBe(420000);
    expect(r.dependencyDeductionPct).toBe(33.33);
    // 420000 * (1 - 0.3333) * 15 = 4,200,210
    expect(r.lossOfDependencyOrEarning).toBe(4200210);
    expect(r.total).toBe(4200210 + 15000 + 40000);
  });

  it('infers INJURY when disability is provided', () => {
    const r = computeCompensation({
      age: 30,
      monthlyIncome: 20000,
      disabilityPct: 50,
    });
    expect(r.nature).toBe('INJURY');
    expect(r.multiplier).toBe(17);
    // 20000*12=240000; +40% FP (self-employed <40) = 336000; *50% *17
    expect(r.lossOfDependencyOrEarning).toBe(336000 * 0.5 * 17);
  });

  it('flags missing age in notes and yields zero multiplier component', () => {
    const r = computeCompensation({ nature: 'DEATH', monthlyIncome: 10000 });
    expect(r.multiplier).toBe(0);
    expect(r.lossOfDependencyOrEarning).toBe(0);
    expect(r.notes.length).toBeGreaterThan(0);
  });

  it('respects an explicit futureProspectsPct override', () => {
    const r = computeCompensation({
      nature: 'DEATH',
      age: 45,
      monthlyIncome: 50000,
      futureProspectsPct: 0,
      dependencyDeductionPct: 25,
    });
    expect(r.futureProspectsPct).toBe(0);
    expect(r.incomeWithProspects).toBe(600000);
    expect(r.lossOfDependencyOrEarning).toBe(600000 * 0.75 * 14);
  });
});
