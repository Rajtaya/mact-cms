/**
 * MACT compensation estimator.
 *
 * Implements the settled Indian methodology:
 *  - Multiplier table from Sarla Verma v. DTC (2009) 6 SCC 121, affirmed in
 *    National Insurance Co. v. Pranay Sethi (2017) 16 SCC 680.
 *  - Future-prospects additions and conventional heads (loss of estate,
 *    funeral, consortium) per Pranay Sethi.
 *  - Death claims: loss of dependency = income × (1+FP) × (1−personal deduction)
 *    × multiplier. Injury claims: loss of earning capacity = income × (1+FP)
 *    × disability% × multiplier.
 *
 * All amounts are plain numbers (INR). The caller persists the structured
 * breakdown for audit/printing. This is an ESTIMATE aid, not legal advice.
 */

export type ClaimNature = 'DEATH' | 'INJURY';

export interface CompensationInput {
  nature?: ClaimNature; // inferred from disabilityPct if omitted
  age?: number;
  monthlyIncome?: number;
  /** Future prospects % override. If omitted, derived from age + salaryType. */
  futureProspectsPct?: number;
  salaryType?: 'PERMANENT' | 'SELF_EMPLOYED'; // affects derived FP
  /** Personal/living-expense deduction % (death claims). Default by dependents. */
  dependents?: number;
  dependencyDeductionPct?: number;
  disabilityPct?: number; // injury claims
  // Conventional / special heads
  medicalExpenses?: number;
  funeralExpenses?: number;
  consortium?: number;
  attendantCharges?: number;
  transportCharges?: number;
  specialDiet?: number;
  painAndSuffering?: number;
  lossOfEstate?: number;
}

export interface CompensationBreakdown {
  nature: ClaimNature;
  age: number | null;
  multiplier: number;
  annualIncome: number;
  futureProspectsPct: number;
  incomeWithProspects: number;
  dependencyDeductionPct: number | null;
  disabilityPct: number | null;
  lossOfDependencyOrEarning: number;
  heads: Record<string, number>;
  total: number;
  notes: string[];
}

/** Sarla Verma multiplier by age band. */
export function multiplierForAge(age?: number): number {
  if (age == null) return 0;
  if (age <= 15) return 15;
  if (age <= 25) return 18;
  if (age <= 30) return 17;
  if (age <= 35) return 16;
  if (age <= 40) return 15;
  if (age <= 45) return 14;
  if (age <= 50) return 13;
  if (age <= 55) return 11;
  if (age <= 60) return 9;
  if (age <= 65) return 7;
  return 5;
}

/** Pranay Sethi future-prospects addition (% of income). */
export function derivedFutureProspectsPct(
  age?: number,
  salaryType: 'PERMANENT' | 'SELF_EMPLOYED' = 'SELF_EMPLOYED',
): number {
  if (age == null) return 0;
  const permanent = salaryType === 'PERMANENT';
  if (age < 40) return permanent ? 50 : 40;
  if (age <= 50) return permanent ? 30 : 25;
  if (age <= 60) return permanent ? 15 : 10;
  return 0;
}

/** Personal-expense deduction by number of dependents (Sarla Verma). */
export function dependencyDeductionForDependents(dependents?: number): number {
  if (dependents == null) return 33.33; // default: 2–3 dependents
  if (dependents <= 1) return 50; // bachelor / self
  if (dependents <= 3) return 33.33;
  if (dependents <= 6) return 25;
  return 20;
}

export function computeCompensation(
  input: CompensationInput,
): CompensationBreakdown {
  const notes: string[] = [];
  const nature: ClaimNature =
    input.nature ??
    ((input.disabilityPct ?? 0) > 0 ? 'INJURY' : 'DEATH');

  const age = input.age ?? null;
  const multiplier = multiplierForAge(input.age);
  if (multiplier === 0 && input.age == null) {
    notes.push('Age not supplied — multiplier-based component is zero.');
  }

  const monthlyIncome = input.monthlyIncome ?? 0;
  const annualIncome = monthlyIncome * 12;

  const futureProspectsPct =
    input.futureProspectsPct ??
    derivedFutureProspectsPct(input.age, input.salaryType);
  const incomeWithProspects = annualIncome * (1 + futureProspectsPct / 100);

  let lossOfDependencyOrEarning = 0;
  let dependencyDeductionPct: number | null = null;
  let disabilityPct: number | null = null;

  if (nature === 'DEATH') {
    dependencyDeductionPct =
      input.dependencyDeductionPct ??
      dependencyDeductionForDependents(input.dependents);
    lossOfDependencyOrEarning =
      incomeWithProspects *
      (1 - dependencyDeductionPct / 100) *
      multiplier;
  } else {
    disabilityPct = input.disabilityPct ?? 0;
    lossOfDependencyOrEarning =
      incomeWithProspects * (disabilityPct / 100) * multiplier;
  }

  const heads: Record<string, number> = {
    medicalExpenses: input.medicalExpenses ?? 0,
    funeralExpenses: input.funeralExpenses ?? 0,
    consortium: input.consortium ?? 0,
    attendantCharges: input.attendantCharges ?? 0,
    transportCharges: input.transportCharges ?? 0,
    specialDiet: input.specialDiet ?? 0,
    painAndSuffering: input.painAndSuffering ?? 0,
    lossOfEstate: input.lossOfEstate ?? 0,
  };

  const headsTotal = Object.values(heads).reduce((a, b) => a + b, 0);
  const total = round2(lossOfDependencyOrEarning + headsTotal);

  return {
    nature,
    age,
    multiplier,
    annualIncome: round2(annualIncome),
    futureProspectsPct,
    incomeWithProspects: round2(incomeWithProspects),
    dependencyDeductionPct,
    disabilityPct,
    lossOfDependencyOrEarning: round2(lossOfDependencyOrEarning),
    heads,
    total,
    notes,
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
