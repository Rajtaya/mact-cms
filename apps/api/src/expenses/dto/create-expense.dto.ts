import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ExpenseCategory } from '@prisma/client';

export class CreateExpenseDto {
  @IsOptional() @IsEnum(ExpenseCategory) category?: ExpenseCategory;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @IsPositive() amount: number;
  @IsOptional() @IsDateString() expenseDate?: string;
  @IsOptional() @IsBoolean() isReimbursable?: boolean;
  @IsOptional() @IsBoolean() reimbursed?: boolean;
  @IsOptional() @IsString() receiptRef?: string;
}
