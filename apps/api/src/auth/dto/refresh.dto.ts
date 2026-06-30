import { IsOptional, IsString } from 'class-validator';

export class RefreshDto {
  // Optional: normally supplied via the httpOnly cookie, not the body.
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
