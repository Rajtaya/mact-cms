import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateInsuranceCompanyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  shortName?: string;

  @IsOptional()
  @IsString()
  irdaCode?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  contactNo?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdateInsuranceCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  shortName?: string;

  @IsOptional()
  @IsString()
  irdaCode?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  contactNo?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
