import { IsOptional, IsString } from 'class-validator';

export class CreateCourtDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  courtNumber?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  presidingOfficer?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateCourtDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  courtNumber?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  presidingOfficer?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
