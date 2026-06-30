import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import { AuditService } from './audit.service';

/** Immutable audit-trail viewer. PRD §1: Admin + Senior Advocate only. */
@ApiTags('audit')
@ApiBearerAuth()
@Roles(Role.ADMINISTRATOR, Role.ADVOCATE)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  async findAll(
    @Query() page: PaginationDto,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
  ) {
    const { data, total } = await this.audit.query({
      entity,
      entityId,
      userId,
      skip: page.skip,
      take: page.take,
    });
    return paginate(data, total, page);
  }
}
