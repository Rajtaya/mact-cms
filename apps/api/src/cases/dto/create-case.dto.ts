import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CaseOutcome, CaseStage, CaseStatus, Priority } from '@prisma/client';
import {
  AccidentInput,
  ClaimPetitionInput,
  ClaimantInput,
  RespondentInput,
  VehicleInput,
  VictimInput,
  WitnessInput,
} from './nested.dto';

export class CreateCaseDto {
  @IsOptional() @IsString() mactCaseNumber?: string;
  @IsOptional() @IsString() courtId?: string;
  @IsOptional() @IsString() courtNumber?: string;
  @IsOptional() @IsString() presidingOfficer?: string;
  @IsOptional() @IsString() benchDetails?: string;
  @IsOptional() @IsString() physicalFileLocation?: string;

  @IsOptional() @IsDateString() filingDate?: string;
  @IsOptional() @IsDateString() registrationDate?: string;
  @IsOptional() @IsDateString() institutionDate?: string;
  @IsOptional() @IsDateString() nextHearingDate?: string;

  @IsOptional() @IsEnum(CaseStatus) status?: CaseStatus;
  @IsOptional() @IsEnum(CaseOutcome) outcome?: CaseOutcome;
  @IsOptional() @IsEnum(CaseStage) stage?: CaseStage;
  @IsOptional() @IsEnum(Priority) priority?: Priority;

  @IsOptional() @IsString() caseSummary?: string;
  @IsOptional() @IsString() internalNotes?: string;
  @IsOptional() @IsString() leadAdvocateId?: string;

  // Nested aggregate blocks
  @IsOptional()
  @ValidateNested()
  @Type(() => ClaimPetitionInput)
  claimPetition?: ClaimPetitionInput;

  @IsOptional()
  @ValidateNested()
  @Type(() => AccidentInput)
  accident?: AccidentInput;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimantInput)
  claimants?: ClaimantInput[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VictimInput)
  victims?: VictimInput[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleInput)
  vehicles?: VehicleInput[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespondentInput)
  respondents?: RespondentInput[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WitnessInput)
  witnesses?: WitnessInput[];
}
