import { Injectable, NotFoundException } from '@nestjs/common';
import { CaseStatus, Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';

const num = (v: Prisma.Decimal | number | null | undefined): number =>
  v == null ? 0 : typeof v === 'number' ? v : Number(v);

const CLOSED: CaseStatus[] = [
  CaseStatus.DECIDED,
  CaseStatus.DISPOSED,
  CaseStatus.WITHDRAWN,
  CaseStatus.ABATED,
];

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async activeCases() {
    const rows = await this.prisma.case.findMany({
      where: { deletedAt: null, status: CaseStatus.ACTIVE },
      orderBy: { nextHearingDate: 'asc' },
      select: {
        caseRef: true, mactCaseNumber: true, stage: true, nextHearingDate: true,
        court: { select: { name: true } },
        leadAdvocate: { select: { fullName: true } },
      },
    });
    return rows.map((c) => ({
      caseRef: c.caseRef,
      mactCaseNumber: c.mactCaseNumber ?? '',
      court: c.court?.name ?? '',
      advocate: c.leadAdvocate?.fullName ?? '',
      stage: c.stage,
      nextHearing: c.nextHearingDate?.toISOString().slice(0, 10) ?? '',
    }));
  }

  async closedCases(q: ReportQueryDto) {
    const where: Prisma.CaseWhereInput = { deletedAt: null, status: { in: CLOSED } };
    if (q.from || q.to) {
      where.updatedAt = {
        ...(q.from ? { gte: new Date(q.from) } : {}),
        ...(q.to ? { lte: new Date(q.to) } : {}),
      };
    }
    const rows = await this.prisma.case.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        caseRef: true, mactCaseNumber: true, status: true, outcome: true, updatedAt: true,
        court: { select: { name: true } },
        claimPetition: { select: { compensationAwarded: true } },
      },
    });
    return rows.map((c) => ({
      caseRef: c.caseRef,
      mactCaseNumber: c.mactCaseNumber ?? '',
      court: c.court?.name ?? '',
      status: c.status,
      outcome: c.outcome,
      awarded: num(c.claimPetition?.compensationAwarded),
      closedOn: c.updatedAt.toISOString().slice(0, 10),
    }));
  }

  async monthlyIncome(year?: number) {
    const y = year ?? new Date().getFullYear();
    const start = new Date(y, 0, 1);
    const end = new Date(y + 1, 0, 1);
    const payments = await this.prisma.feePayment.findMany({
      where: { paymentDate: { gte: start, lt: end } },
      select: { amount: true, paymentDate: true },
    });
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: `${y}-${String(i + 1).padStart(2, '0')}`,
      total: 0,
      count: 0,
    }));
    for (const p of payments) {
      const idx = p.paymentDate.getMonth();
      months[idx].total += num(p.amount);
      months[idx].count += 1;
    }
    return months;
  }

  async pendingFees() {
    const arrangements = await this.prisma.feeArrangement.findMany({
      include: {
        payments: { select: { amount: true } },
        case: { select: { caseRef: true, mactCaseNumber: true } },
      },
    });
    return arrangements
      .map((a) => {
        const received = a.payments.reduce((s, p) => s + num(p.amount), 0);
        const expected = num(a.agreedAmount) || num(a.fixedAmount) || 0;
        return {
          caseRef: a.case.caseRef,
          mactCaseNumber: a.case.mactCaseNumber ?? '',
          expected,
          received,
          pending: expected - received,
        };
      })
      .filter((r) => r.pending > 0)
      .sort((x, y) => y.pending - x.pending);
  }

  async upcomingHearings(days = 7) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    const rows = await this.prisma.case.findMany({
      where: { deletedAt: null, nextHearingDate: { gte: start, lt: end } },
      orderBy: { nextHearingDate: 'asc' },
      select: {
        caseRef: true, mactCaseNumber: true, nextHearingDate: true, stage: true,
        court: { select: { name: true } },
      },
    });
    return rows.map((c) => ({
      caseRef: c.caseRef,
      mactCaseNumber: c.mactCaseNumber ?? '',
      court: c.court?.name ?? '',
      stage: c.stage,
      hearing: c.nextHearingDate?.toISOString().slice(0, 10) ?? '',
    }));
  }

  async compensationAwarded(q: ReportQueryDto) {
    const where: Prisma.ClaimPetitionWhereInput = {
      compensationAwarded: { not: null },
    };
    if (q.from || q.to) {
      where.awardDate = {
        ...(q.from ? { gte: new Date(q.from) } : {}),
        ...(q.to ? { lte: new Date(q.to) } : {}),
      };
    }
    const rows = await this.prisma.claimPetition.findMany({
      where,
      orderBy: { awardDate: 'desc' },
      select: {
        petitionNumber: true, claimAmount: true, compensationAwarded: true, awardDate: true,
        case: { select: { caseRef: true, mactCaseNumber: true } },
      },
    });
    return rows.map((p) => ({
      caseRef: p.case.caseRef,
      mactCaseNumber: p.case.mactCaseNumber ?? '',
      claimed: num(p.claimAmount),
      awarded: num(p.compensationAwarded),
      awardDate: p.awardDate?.toISOString().slice(0, 10) ?? '',
    }));
  }

  async insuranceCompanyWise() {
    const grouped = await this.prisma.insurance.groupBy({
      by: ['insuranceCompanyId'],
      _count: { _all: true },
    });
    const companies = await this.prisma.insuranceCompany.findMany({
      select: { id: true, name: true },
    });
    const nameById = new Map(companies.map((c) => [c.id, c.name]));
    return grouped.map((g) => ({
      insurer: g.insuranceCompanyId ? nameById.get(g.insuranceCompanyId) ?? 'Unknown' : 'Unlinked',
      caseCount: g._count._all,
    }));
  }

  async courtWise() {
    const grouped = await this.prisma.case.groupBy({
      by: ['courtId'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    const courts = await this.prisma.court.findMany({ select: { id: true, name: true } });
    const nameById = new Map(courts.map((c) => [c.id, c.name]));
    return grouped.map((g) => ({
      court: g.courtId ? nameById.get(g.courtId) ?? 'Unknown' : 'Unassigned',
      caseCount: g._count._all,
    }));
  }

  /** Dispatcher used by the export endpoint. */
  async getReportData(key: string, q: ReportQueryDto): Promise<{ title: string; rows: any[] }> {
    switch (key) {
      case 'active-cases': return { title: 'Active Cases', rows: await this.activeCases() };
      case 'closed-cases': return { title: 'Closed Cases', rows: await this.closedCases(q) };
      case 'monthly-income': return { title: 'Monthly Income', rows: await this.monthlyIncome(q.year) };
      case 'pending-fees': return { title: 'Pending Fees', rows: await this.pendingFees() };
      case 'upcoming-hearings': return { title: 'Upcoming Hearings', rows: await this.upcomingHearings(q.days) };
      case 'compensation-awarded': return { title: 'Compensation Awarded', rows: await this.compensationAwarded(q) };
      case 'insurance-company-wise': return { title: 'Insurance Company-wise', rows: await this.insuranceCompanyWise() };
      case 'court-wise': return { title: 'Court-wise', rows: await this.courtWise() };
      default: throw new NotFoundException(`Unknown report: ${key}`);
    }
  }

  async toXlsx(title: string, rows: any[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(title.slice(0, 31));
    const keys = rows.length ? Object.keys(rows[0]) : ['info'];
    ws.columns = keys.map((k) => ({ header: k, key: k, width: 22 }));
    ws.getRow(1).font = { bold: true };
    rows.forEach((r) => ws.addRow(r));
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async toPdf(title: string, rows: any[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text(`MACT CMS — ${title}`, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#555').text(`Generated: ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`);
      doc.moveDown(0.8).fillColor('#000');

      if (!rows.length) {
        doc.fontSize(11).text('No data for the selected criteria.');
      } else {
        const keys = Object.keys(rows[0]);
        doc.fontSize(9).text(keys.join('  |  '), { continued: false });
        doc.moveTo(doc.x, doc.y).lineTo(800, doc.y).stroke();
        doc.moveDown(0.3);
        rows.forEach((r) => {
          doc.fontSize(8).text(keys.map((k) => String(r[k] ?? '')).join('  |  '));
        });
      }
      doc.end();
    });
  }
}
