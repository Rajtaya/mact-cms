import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FeesService } from './fees.service';
import { UpsertFeeDto } from './dto/upsert-fee.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('fees')
@ApiBearerAuth()
@Controller()
export class FeesController {
  constructor(private readonly fees: FeesService) {}

  // PRD fee matrix — config: Admin/Senior; receipts: + Office Staff;
  // view balances: + Junior. Read-Only is blocked from fees entirely.

  @Roles(Role.ADVOCATE)
  @Put('cases/:caseId/fee')
  upsert(
    @Param('caseId') caseId: string,
    @Body() dto: UpsertFeeDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.fees.upsertArrangement(caseId, dto, actorId);
  }

  @Roles(Role.ADVOCATE, Role.JUNIOR_ADVOCATE, Role.OFFICE_STAFF)
  @Get('cases/:caseId/fee')
  getForCase(@Param('caseId') caseId: string) {
    return this.fees.getForCase(caseId);
  }

  @Roles(Role.ADVOCATE, Role.OFFICE_STAFF)
  @Post('cases/:caseId/fee/payments')
  addPayment(
    @Param('caseId') caseId: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.fees.addPayment(caseId, dto, actorId);
  }

  @Roles(Role.ADVOCATE, Role.OFFICE_STAFF)
  @Get('fee/payments/:id/receipt')
  getReceipt(@Param('id') id: string) {
    return this.fees.getReceipt(id);
  }
}
