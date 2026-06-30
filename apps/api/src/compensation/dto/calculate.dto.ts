import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { ClaimNature } from '../compensation.calculator';

export class CalculateDto {
  @IsOptional() @IsEnum(['DEATH', 'INJURY']) nature?: ClaimNature;
  @IsOptional() @IsInt() age?: number;
  @IsOptional() @IsNumber() monthlyIncome?: number;
  @IsOptional() @IsNumber() futureProspectsPct?: number;
  @IsOptional() @IsEnum(['PERMANENT', 'SELF_EMPLOYED'])
  salaryType?: 'PERMANENT' | 'SELF_EMPLOYED';
  @IsOptional() @IsInt() dependents?: number;
  @IsOptional() @IsNumber() dependencyDeductionPct?: number;
  @IsOptional() @IsNumber() disabilityPct?: number;
  @IsOptional() @IsNumber() medicalExpenses?: number;
  @IsOptional() @IsNumber() funeralExpenses?: number;
  @IsOptional() @IsNumber() consortium?: number;
  @IsOptional() @IsNumber() attendantCharges?: number;
  @IsOptional() @IsNumber() transportCharges?: number;
  @IsOptional() @IsNumber() specialDiet?: number;
  @IsOptional() @IsNumber() painAndSuffering?: number;
  @IsOptional() @IsNumber() lossOfEstate?: number;
}

export class SaveEstimateDto extends CalculateDto {
  @IsOptional() @IsString() label?: string;
}
