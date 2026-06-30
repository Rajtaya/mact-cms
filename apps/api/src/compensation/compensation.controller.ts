import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompensationService } from './compensation.service';
import { CalculateDto, SaveEstimateDto } from './dto/calculate.dto';

@ApiTags('compensation')
@ApiBearerAuth()
@Controller()
export class CompensationController {
  constructor(private readonly comp: CompensationService) {}

  /** Stateless calculator. PRD: Office Staff blocked; Read-Only may view. */
  @Roles(Role.ADVOCATE, Role.JUNIOR_ADVOCATE, Role.READ_ONLY)
  @Post('compensation/calculate')
  calculate(@Body() dto: CalculateDto) {
    return this.comp.calculate(dto);
  }

  @Roles(Role.ADVOCATE, Role.JUNIOR_ADVOCATE)
  @Post('cases/:caseId/compensation')
  save(
    @Param('caseId') caseId: string,
    @Body() dto: SaveEstimateDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.comp.saveForCase(caseId, dto, actorId);
  }

  @Roles(Role.ADVOCATE, Role.JUNIOR_ADVOCATE, Role.READ_ONLY)
  @Get('cases/:caseId/compensation')
  list(@Param('caseId') caseId: string) {
    return this.comp.listForCase(caseId);
  }

  @Roles(Role.ADVOCATE, Role.JUNIOR_ADVOCATE)
  @Delete('compensation/:id')
  remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.comp.remove(id, actorId);
  }
}
