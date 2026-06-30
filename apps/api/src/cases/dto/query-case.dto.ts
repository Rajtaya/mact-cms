import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CaseStage, CaseStatus, Priority } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryCaseDto extends PaginationDto {
  @IsOptional() @IsEnum(CaseStatus) status?: CaseStatus;
  @IsOptional() @IsEnum(CaseStage) stage?: CaseStage;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsString() courtId?: string;
  @IsOptional() @IsString() leadAdvocateId?: string;
}
