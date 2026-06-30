import { IsOptional, IsString } from 'class-validator';

export class CreatePoliceStationDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  state?: string;
}

export class UpdatePoliceStationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  state?: string;
}
