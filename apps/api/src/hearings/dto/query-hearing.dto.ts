import { IsEnum, IsOptional } from 'class-validator';
import { HearingStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

/** List query for a case's hearings timeline: pagination + optional status filter. */
export class QueryHearingDto extends PaginationDto {
  @IsOptional()
  @IsEnum(HearingStatus)
  status?: HearingStatus;
}
