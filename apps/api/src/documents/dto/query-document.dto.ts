import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DocumentCategory } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryDocumentDto extends PaginationDto {
  @IsOptional() @IsEnum(DocumentCategory) category?: DocumentCategory;
  @IsOptional() @IsString() tag?: string;
}
