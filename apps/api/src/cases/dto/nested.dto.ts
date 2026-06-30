import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  RespondentType,
  VehicleRole,
  VictimType,
  WitnessType,
} from '@prisma/client';

export class ClaimantInput {
  @IsString() name: string;
  @IsOptional() @IsString() guardianName?: string;
  @IsOptional() @IsString() relationToVictim?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() mobile?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() aadhaar?: string;
  @IsOptional() @IsString() pan?: string;
  @IsOptional() @IsString() occupation?: string;
  @IsOptional() @IsNumber() monthlyIncome?: number;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsInt() age?: number;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() bankAccountNo?: string;
  @IsOptional() @IsString() bankIfsc?: string;
  @IsOptional() @IsString() bankBranch?: string;
}

export class VictimInput {
  @IsEnum(VictimType) type: VictimType;
  @IsString() name: string;
  @IsOptional() @IsInt() age?: number;
  @IsOptional() @IsString() occupation?: string;
  @IsOptional() @IsNumber() monthlyIncome?: number;
  @IsOptional() @IsNumber() futureProspectsPct?: number;
  @IsOptional() @IsNumber() disabilityPct?: number;
  @IsOptional() @IsString() natureOfInjury?: string;
  @IsOptional() @IsDateString() dateOfDeath?: string;
}

export class DriverInput {
  @IsString() name: string;
  @IsOptional() @IsString() fatherName?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() mobile?: string;
  @IsOptional() @IsString() licenceNumber?: string;
  @IsOptional() @IsDateString() licenceValidity?: string;
  @IsOptional() @IsString() licenceCategory?: string;
}

export class OwnerInput {
  @IsString() name: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() mobile?: string;
  @IsOptional() @IsString() aadhaar?: string;
  @IsOptional() @IsString() pan?: string;
}

export class InsuranceInput {
  @IsOptional() @IsString() insuranceCompanyId?: string;
  @IsOptional() @IsString() companyNameText?: string;
  @IsOptional() @IsString() policyNumber?: string;
  @IsOptional() @IsDateString() policyStartDate?: string;
  @IsOptional() @IsDateString() policyExpiryDate?: string;
  @IsOptional() @IsBoolean() isThirdParty?: boolean;
  @IsOptional() @IsString() surveyor?: string;
  @IsOptional() @IsString() claimNumber?: string;
}

export class VehicleInput {
  @IsOptional() @IsEnum(VehicleRole) role?: VehicleRole;
  @IsOptional() @IsString() registrationNo?: string;
  @IsOptional() @IsString() vehicleType?: string;
  @IsOptional() @IsString() make?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() chassisNumber?: string;
  @IsOptional() @IsString() engineNumber?: string;
  @IsOptional() @IsDateString() registrationDate?: string;
  @IsOptional() @IsString() permitNumber?: string;
  @IsOptional() @IsDateString() permitValidity?: string;
  @IsOptional() @IsDateString() fitnessValidity?: string;

  @IsOptional() @ValidateNested() @Type(() => DriverInput) driver?: DriverInput;
  @IsOptional() @ValidateNested() @Type(() => OwnerInput) owner?: OwnerInput;
  @IsOptional()
  @ValidateNested()
  @Type(() => InsuranceInput)
  insurance?: InsuranceInput;
}

export class RespondentInput {
  @IsEnum(RespondentType) type: RespondentType;
  @IsString() name: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() mobile?: string;
  @IsOptional() @IsString() insurerId?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class WitnessInput {
  @IsString() name: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() mobile?: string;
  @IsOptional() @IsEnum(WitnessType) type?: WitnessType;
  @IsOptional() @IsString() statement?: string;
}

export class AccidentInput {
  @IsOptional() @IsDateString() accidentDate?: string;
  @IsOptional() @IsString() accidentTime?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() policeStationId?: string;
  @IsOptional() @IsString() firNumber?: string;
  @IsOptional() @IsString() ddrNumber?: string;
  @IsOptional() @IsString() description?: string;
}

export class ClaimPetitionInput {
  @IsOptional() @IsString() petitionNumber?: string;
  @IsOptional() @IsDateString() petitionDate?: string;
  @IsOptional() @IsNumber() claimAmount?: number;
  @IsOptional() @IsNumber() compensationAwarded?: number;
  @IsOptional() @IsNumber() interestRate?: number;
  @IsOptional() @IsDateString() awardDate?: string;
}

/** Re-export helper for arrays of nested inputs. */
export class NestedArrays {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimantInput)
  claimants?: ClaimantInput[];
}
