import { IsOptional, IsString } from 'class-validator';

export class CreateJudgeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  courtId?: string;
}

export class UpdateJudgeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  courtId?: string;
}
