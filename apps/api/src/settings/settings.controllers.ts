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
import { QuerySettingDto } from './dto/query-setting.dto';
import {
  CourtsService,
  HospitalsService,
  InsuranceCompaniesService,
  JudgesService,
  PoliceStationsService,
} from './settings.services';
import { CreateCourtDto, UpdateCourtDto } from './dto/court.dto';
import { CreateJudgeDto, UpdateJudgeDto } from './dto/judge.dto';
import {
  CreateInsuranceCompanyDto,
  UpdateInsuranceCompanyDto,
} from './dto/insurance-company.dto';
import {
  CreatePoliceStationDto,
  UpdatePoliceStationDto,
} from './dto/police-station.dto';
import { CreateHospitalDto, UpdateHospitalDto } from './dto/hospital.dto';

/**
 * Master-data CRUD. Reads are open to any authenticated user (case-entry
 * screens need them for dropdowns); writes are Administrator-only per PRD §1.
 */

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings/courts')
export class CourtsController {
  constructor(private readonly svc: CourtsService) {}
  @Get() findAll(@Query() q: QuerySettingDto) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Roles(Role.ADMINISTRATOR) @Post()
  create(@Body() dto: CreateCourtDto, @CurrentUser('id') a: string) { return this.svc.create(dto, a); }
  @Roles(Role.ADMINISTRATOR) @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCourtDto, @CurrentUser('id') a: string) { return this.svc.update(id, dto, a); }
  @Roles(Role.ADMINISTRATOR) @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') a: string) { return this.svc.remove(id, a); }
}

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings/judges')
export class JudgesController {
  constructor(private readonly svc: JudgesService) {}
  @Get() findAll(@Query() q: QuerySettingDto) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Roles(Role.ADMINISTRATOR) @Post()
  create(@Body() dto: CreateJudgeDto, @CurrentUser('id') a: string) { return this.svc.create(dto, a); }
  @Roles(Role.ADMINISTRATOR) @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJudgeDto, @CurrentUser('id') a: string) { return this.svc.update(id, dto, a); }
  @Roles(Role.ADMINISTRATOR) @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') a: string) { return this.svc.remove(id, a); }
}

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings/insurance-companies')
export class InsuranceCompaniesController {
  constructor(private readonly svc: InsuranceCompaniesService) {}
  @Get() findAll(@Query() q: QuerySettingDto) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Roles(Role.ADMINISTRATOR) @Post()
  create(@Body() dto: CreateInsuranceCompanyDto, @CurrentUser('id') a: string) { return this.svc.create(dto, a); }
  @Roles(Role.ADMINISTRATOR) @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInsuranceCompanyDto, @CurrentUser('id') a: string) { return this.svc.update(id, dto, a); }
  @Roles(Role.ADMINISTRATOR) @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') a: string) { return this.svc.remove(id, a); }
}

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings/police-stations')
export class PoliceStationsController {
  constructor(private readonly svc: PoliceStationsService) {}
  @Get() findAll(@Query() q: QuerySettingDto) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Roles(Role.ADMINISTRATOR) @Post()
  create(@Body() dto: CreatePoliceStationDto, @CurrentUser('id') a: string) { return this.svc.create(dto, a); }
  @Roles(Role.ADMINISTRATOR) @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePoliceStationDto, @CurrentUser('id') a: string) { return this.svc.update(id, dto, a); }
  @Roles(Role.ADMINISTRATOR) @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') a: string) { return this.svc.remove(id, a); }
}

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings/hospitals')
export class HospitalsController {
  constructor(private readonly svc: HospitalsService) {}
  @Get() findAll(@Query() q: QuerySettingDto) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Roles(Role.ADMINISTRATOR) @Post()
  create(@Body() dto: CreateHospitalDto, @CurrentUser('id') a: string) { return this.svc.create(dto, a); }
  @Roles(Role.ADMINISTRATOR) @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHospitalDto, @CurrentUser('id') a: string) { return this.svc.update(id, dto, a); }
  @Roles(Role.ADMINISTRATOR) @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') a: string) { return this.svc.remove(id, a); }
}
