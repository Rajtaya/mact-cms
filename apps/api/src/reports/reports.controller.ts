import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import { ExportQueryDto, ReportQueryDto } from './dto/report-query.dto';

/** Reports may expose financials — Administrator & Senior Advocate only. */
@ApiTags('reports')
@ApiBearerAuth()
@Roles(Role.ADMINISTRATOR, Role.ADVOCATE)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('active-cases') activeCases() { return this.reports.activeCases(); }
  @Get('closed-cases') closedCases(@Query() q: ReportQueryDto) { return this.reports.closedCases(q); }
  @Get('monthly-income') monthlyIncome(@Query() q: ReportQueryDto) { return this.reports.monthlyIncome(q.year); }
  @Get('pending-fees') pendingFees() { return this.reports.pendingFees(); }
  @Get('upcoming-hearings') upcoming(@Query() q: ReportQueryDto) { return this.reports.upcomingHearings(q.days); }
  @Get('compensation-awarded') compensation(@Query() q: ReportQueryDto) { return this.reports.compensationAwarded(q); }
  @Get('insurance-company-wise') insurerWise() { return this.reports.insuranceCompanyWise(); }
  @Get('court-wise') courtWise() { return this.reports.courtWise(); }

  /** Generic export: /reports/:report/export?format=xlsx|pdf */
  @Get(':report/export')
  async export(
    @Param('report') report: string,
    @Query() q: ExportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { title, rows } = await this.reports.getReportData(report, q);
    const format = q.format === 'pdf' ? 'pdf' : 'xlsx';
    const fileName = `${report}.${format}`;

    if (format === 'pdf') {
      const buf = await this.reports.toPdf(title, rows);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      });
      return new StreamableFile(buf);
    }

    const buf = await this.reports.toXlsx(title, rows);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    return new StreamableFile(buf);
  }
}
