import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/** Shared query params for the reporting endpoints. */
export class ReportQueryDto {
  /** ISO date (inclusive). Filters the report's date range start. */
  @IsOptional()
  @IsString()
  from?: string;

  /** ISO date (inclusive). Filters the report's date range end. */
  @IsOptional()
  @IsString()
  to?: string;

  /** Calendar year for the monthly-income report. Defaults to current year. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  /** Look-ahead window (days) for the upcoming-hearings report. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}

/** Output format for the generic export endpoint. */
export class ExportQueryDto extends ReportQueryDto {
  @IsOptional()
  @IsString()
  format?: 'xlsx' | 'pdf';
}
