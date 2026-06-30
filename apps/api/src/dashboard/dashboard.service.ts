import { Injectable } from '@nestjs/common';
import { CaseStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type DateRange = { gte: Date; lt: Date };

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private dayRange(offsetDays = 0): DateRange {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offsetDays);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return { gte: d, lt: next };
  }

  /** Adaptive entry point — shape depends on the signed-in user's tier. */
  async forUser(role: Role) {
    const isSenior = role === Role.ADMINISTRATOR || role === Role.ADVOCATE;
    const [common, tier] = await Promise.all([
      this.commonWidgets(),
      isSenior ? this.seniorPortfolio() : this.operationalGrid(),
    ]);
    return { perspective: isSenior ? 'SENIOR' : 'OPERATIONAL', ...common, ...tier };
  }

  /** Widgets shown to everyone (the original dashboard spec). */
  private async commonWidgets() {
    const today = this.dayRange(0);
    const tomorrow = this.dayRange(1);
    const next7 = { gte: this.dayRange(0).gte, lt: this.dayRange(7).lt };

    const [
      totalActiveCases,
      casesListedToday,
      casesListedTomorrow,
      casesDecided,
      upcomingHearings,
      recentActivities,
    ] = await this.prisma.$transaction([
      this.prisma.case.count({
        where: { deletedAt: null, status: CaseStatus.ACTIVE },
      }),
      this.prisma.case.count({
        where: { deletedAt: null, nextHearingDate: today },
      }),
      this.prisma.case.count({
        where: { deletedAt: null, nextHearingDate: tomorrow },
      }),
      this.prisma.case.count({
        where: {
          deletedAt: null,
          status: { in: [CaseStatus.DECIDED, CaseStatus.DISPOSED] },
        },
      }),
      this.prisma.case.findMany({
        where: { deletedAt: null, nextHearingDate: next7 },
        orderBy: { nextHearingDate: 'asc' },
        take: 25,
        select: {
          id: true,
          caseRef: true,
          mactCaseNumber: true,
          nextHearingDate: true,
          stage: true,
          court: { select: { name: true } },
        },
      }),
      this.prisma.activity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: { user: { select: { fullName: true } } },
      }),
    ]);

    return {
      kpis: {
        totalActiveCases,
        casesListedToday,
        casesListedTomorrow,
        casesDecided,
      },
      upcomingHearings,
      recentActivities,
    };
  }

  /** Senior / analytical portfolio (PRD §2). */
  private async seniorPortfolio() {
    const [decided, favourable, awardAgg, feeAgg, paymentAgg, insurerDensity] =
      await Promise.all([
        this.prisma.case.count({
          where: {
            deletedAt: null,
            status: { in: [CaseStatus.DECIDED, CaseStatus.DISPOSED] },
          },
        }),
        this.prisma.case.count({
          where: {
            deletedAt: null,
            outcome: { in: ['ALLOWED', 'PARTLY_ALLOWED', 'COMPROMISED'] },
          },
        }),
        this.prisma.claimPetition.aggregate({
          _sum: { compensationAwarded: true },
        }),
        this.prisma.feeArrangement.aggregate({
          _sum: { agreedAmount: true, fixedAmount: true },
        }),
        this.prisma.feePayment.aggregate({ _sum: { amount: true } }),
        this.prisma.insurance.groupBy({
          by: ['insuranceCompanyId'],
          _count: { _all: true },
        }),
      ]);

    const agreed =
      Number(feeAgg._sum.agreedAmount ?? 0) ||
      Number(feeAgg._sum.fixedAmount ?? 0);
    const received = Number(paymentAgg._sum.amount ?? 0);

    return {
      executive: {
        litigationSuccessRatePct:
          decided > 0 ? Math.round((favourable / decided) * 1000) / 10 : 0,
        aggregateCourtAwards: Number(awardAgg._sum.compensationAwarded ?? 0),
        cumulativeUncollectedFees: Math.max(agreed - received, 0),
        totalFeesCollected: received,
      },
      trends: {
        cashflowByMonth: await this.cashflowByMonth(),
        agingProfile: await this.agingProfile(),
        insurerDensity,
      },
    };
  }

  /** Operational workflow grid for lower management (PRD §2). */
  private async operationalGrid() {
    const today = this.dayRange(0);
    const tomorrow = this.dayRange(1);

    const [dailyHub, missingFir, missingRc, pendingDocs] = await Promise.all([
      this.prisma.case.findMany({
        where: {
          deletedAt: null,
          OR: [{ nextHearingDate: today }, { nextHearingDate: tomorrow }],
        },
        orderBy: [{ courtNumber: 'asc' }, { nextHearingDate: 'asc' }],
        select: {
          id: true,
          caseRef: true,
          mactCaseNumber: true,
          courtNumber: true,
          nextHearingDate: true,
          stage: true,
          court: { select: { name: true } },
          claimants: { select: { name: true }, take: 1 },
        },
      }),
      this.missingDocCases('FIR'),
      this.missingDocCases('RC'),
      this.prisma.case.count({
        where: {
          deletedAt: null,
          status: CaseStatus.ACTIVE,
          documents: { none: { deletedAt: null } },
        },
      }),
    ]);

    return {
      dailyActionHub: dailyHub,
      missingDocumentIndex: {
        missingFIR: missingFir,
        missingRC: missingRc,
        casesWithNoDocuments: pendingDocs,
      },
    };
  }

  /** Active cases lacking a document of the given mandatory category. */
  private missingDocCases(category: 'FIR' | 'RC') {
    return this.prisma.case.findMany({
      where: {
        deletedAt: null,
        status: CaseStatus.ACTIVE,
        documents: { none: { category, deletedAt: null } },
      },
      take: 50,
      select: {
        id: true,
        caseRef: true,
        mactCaseNumber: true,
        nextHearingDate: true,
      },
    });
  }

  /** Last 6 months of fee collections, grouped by YYYY-MM. */
  private async cashflowByMonth() {
    const since = new Date();
    since.setMonth(since.getMonth() - 5);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    const rows = await this.prisma.feePayment.findMany({
      where: { paymentDate: { gte: since } },
      select: { amount: true, paymentDate: true },
    });
    const buckets: Record<string, number> = {};
    for (const r of rows) {
      const key = `${r.paymentDate.getFullYear()}-${String(
        r.paymentDate.getMonth() + 1,
      ).padStart(2, '0')}`;
      buckets[key] = (buckets[key] ?? 0) + Number(r.amount);
    }
    return Object.entries(buckets)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /** Aging profile of pending (active) files by days since filing. */
  private async agingProfile() {
    const cases = await this.prisma.case.findMany({
      where: { deletedAt: null, status: CaseStatus.ACTIVE },
      select: { filingDate: true, createdAt: true },
    });
    const buckets = { '0-90': 0, '91-180': 0, '181-365': 0, '365+': 0 };
    const now = Date.now();
    for (const c of cases) {
      const start = (c.filingDate ?? c.createdAt).getTime();
      const days = Math.floor((now - start) / 86_400_000);
      if (days <= 90) buckets['0-90']++;
      else if (days <= 180) buckets['91-180']++;
      else if (days <= 365) buckets['181-365']++;
      else buckets['365+']++;
    }
    return buckets;
  }
}
