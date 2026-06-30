import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { HearingStatus } from '@prisma/client';

/** Payload to log a hearing against a case. */
export class CreateHearingDto {
  @IsDateString()
  hearingDate: string;

  @IsOptional()
  @IsEnum(HearingStatus)
  status?: HearingStatus;

  @IsOptional()
  @IsString()
  proceedings?: string;

  @IsOptional()
  @IsString()
  judgeRemarks?: string;

  @IsOptional()
  @IsString()
  advocateNotes?: string;

  @IsOptional()
  @IsDateString()
  nextHearingDate?: string;

  @IsOptional()
  @IsString()
  orderDocumentId?: string;
}
