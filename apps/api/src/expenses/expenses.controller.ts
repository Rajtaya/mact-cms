import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

const WRITERS = [Role.ADVOCATE, Role.JUNIOR_ADVOCATE, Role.OFFICE_STAFF] as const;

@ApiTags('expenses')
@ApiBearerAuth()
@Controller()
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Roles(...WRITERS)
  @Post('cases/:caseId/expenses')
  create(
    @Param('caseId') caseId: string,
    @Body() dto: CreateExpenseDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.expenses.create(caseId, dto, actorId);
  }

  @Get('cases/:caseId/expenses')
  list(@Param('caseId') caseId: string) {
    return this.expenses.listForCase(caseId);
  }

  @Roles(...WRITERS)
  @Patch('expenses/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.expenses.update(id, dto, actorId);
  }

  @Roles(...WRITERS)
  @Delete('expenses/:id')
  remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.expenses.remove(id, actorId);
  }
}
