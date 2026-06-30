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
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { QueryCaseDto } from './dto/query-case.dto';

@ApiTags('cases')
@ApiBearerAuth()
@Controller('cases')
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Roles(Role.ADVOCATE, Role.JUNIOR_ADVOCATE, Role.OFFICE_STAFF)
  @Post()
  create(@Body() dto: CreateCaseDto, @CurrentUser('id') actorId: string) {
    return this.cases.create(dto, actorId);
  }

  @Get()
  findAll(@Query() dto: QueryCaseDto) {
    return this.cases.findAll(dto);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.cases.globalSearch(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cases.findOne(id);
  }

  @Roles(Role.ADVOCATE, Role.JUNIOR_ADVOCATE, Role.OFFICE_STAFF)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCaseDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.cases.update(id, dto, actorId);
  }

  @Roles(Role.ADVOCATE)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.cases.remove(id, actorId);
  }
}
