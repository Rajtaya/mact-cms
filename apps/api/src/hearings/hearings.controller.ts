import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { HearingsService } from './hearings.service';
import { CreateHearingDto } from './dto/create-hearing.dto';
import { UpdateHearingDto } from './dto/update-hearing.dto';
import { QueryHearingDto } from './dto/query-hearing.dto';

@ApiTags('hearings')
@ApiBearerAuth()
@Controller('cases/:caseId/hearings')
export class HearingsController {
  constructor(private readonly hearings: HearingsService) {}

  @Roles(Role.ADVOCATE, Role.JUNIOR_ADVOCATE, Role.OFFICE_STAFF)
  @Post()
  create(
    @Param('caseId') caseId: string,
    @Body() dto: CreateHearingDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.hearings.create(caseId, dto, actorId);
  }

  @Get()
  findAll(@Param('caseId') caseId: string, @Query() dto: QueryHearingDto) {
    return this.hearings.findAll(caseId, dto);
  }

  @Get(':id')
  findOne(@Param('caseId') caseId: string, @Param('id') id: string) {
    return this.hearings.findOne(caseId, id);
  }

  @Roles(Role.ADVOCATE, Role.JUNIOR_ADVOCATE, Role.OFFICE_STAFF)
  @Patch(':id')
  update(
    @Param('caseId') caseId: string,
    @Param('id') id: string,
    @Body() dto: UpdateHearingDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.hearings.update(caseId, id, dto, actorId);
  }

  @Roles(Role.ADVOCATE, Role.JUNIOR_ADVOCATE, Role.OFFICE_STAFF)
  @Delete(':id')
  remove(
    @Param('caseId') caseId: string,
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.hearings.remove(caseId, id, actorId);
  }
}
