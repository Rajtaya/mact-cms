import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpsertFeeDto } from './dto/upsert-fee.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class FeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Converts a Prisma Decimal-ish value to a plain number (0 when null). */
  private toNumber(value: Prisma.Decimal | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : Number(value);
  }

  /** Generates the next receipt number: RCPT-2026-00042. */
  private async nextReceiptNumber(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    const countThisYear = await tx.feePayment.count({
      where: { createdAt: { gte: start, lt: end } },
    });
    const seq = String(countThisYear + 1).padStart(5, '0');
    return `RCPT-${year}-${seq}`;
  }

  private async ensureCaseExists(caseId: string): Promise<void> {
    const c = await this.prisma.case.findFirst({
      where: { id: caseId, deletedAt: null },
      select: { id: true },
    });
    if (!c) throw new NotFoundException('Case not found');
  }

  /** Upserts the 0..1 FeeArrangement for a case. */
  async upsertArrangement(
    caseId: string,
    dto: UpsertFeeDto,
    actorId?: string,
  ) {
    await this.ensureCaseExists(caseId);

    const data = {
      feeType: dto.feeType,
      fixedAmount: dto.fixedAmount,
      percentage: dto.percentage,
      agreedAmount: dto.agreedAmount,
    };

    const arrangement = await this.prisma.feeArrangement.upsert({
      where: { caseId },
      create: { caseId, ...data },
      update: data,
    });

    await this.audit.record({
      userId: actorId,
      action: AuditAction.UPDATE,
      entity: 'FeeArrangement',
      entityId: arrangement.id,
      after: { caseId, feeType: arrangement.feeType },
    });

    return arrangement;
  }

  /** Returns the arrangement with payments and computed totals. */
  async getForCase(caseId: string) {
    await this.ensureCaseExists(caseId);

    const arrangement = await this.prisma.feeArrangement.findUnique({
      where: { caseId },
      include: { payments: { orderBy: { paymentDate: 'desc' } } },
    });

    if (!arrangement) {
      return {
        arrangement: null,
        payments: [],
        totalReceived: 0,
        pendingAmount: 0,
      };
    }

    const totalReceived = arrangement.payments.reduce(
      (sum, p) => sum + this.toNumber(p.amount),
      0,
    );
    const expected =
      this.toNumber(arrangement.agreedAmount) ||
      this.toNumber(arrangement.fixedAmount) ||
      0;
    const pendingAmount = expected - totalReceived;

    return {
      ...arrangement,
      totalReceived,
      pendingAmount,
    };
  }

  /** Adds a payment, auto-generating the receipt number when not supplied. */
  async addPayment(
    caseId: string,
    dto: CreatePaymentDto,
    actorId?: string,
  ) {
    await this.ensureCaseExists(caseId);

    const payment = await this.prisma.$transaction(async (tx) => {
      // Ensure an arrangement exists so a payment always has a parent.
      const arrangement = await tx.feeArrangement.upsert({
        where: { caseId },
        create: { caseId },
        update: {},
      });

      const receiptNumber =
        dto.receiptNumber ?? (await this.nextReceiptNumber(tx));

      return tx.feePayment.create({
        data: {
          fee: { connect: { id: arrangement.id } },
          amount: dto.amount,
          paymentDate: dto.paymentDate,
          paymentMode: dto.paymentMode,
          receiptNumber,
          reference: dto.reference,
          notes: dto.notes,
          recordedBy: actorId ? { connect: { id: actorId } } : undefined,
        },
      });
    });

    await this.audit.record({
      userId: actorId,
      action: AuditAction.CREATE,
      entity: 'FeePayment',
      entityId: payment.id,
      after: {
        receiptNumber: payment.receiptNumber,
        amount: this.toNumber(payment.amount),
      },
    });

    return payment;
  }

  /** Builds a structured JSON receipt payload for the frontend to render. */
  async getReceipt(paymentId: string) {
    const payment = await this.prisma.feePayment.findUnique({
      where: { id: paymentId },
      include: {
        recordedBy: { select: { fullName: true } },
        fee: {
          include: {
            case: {
              select: {
                caseRef: true,
                mactCaseNumber: true,
                claimants: {
                  select: { name: true },
                  orderBy: { createdAt: 'asc' },
                  take: 1,
                },
                leadAdvocate: { select: { fullName: true } },
              },
            },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    const kase = payment.fee.case;

    return {
      receiptNumber: payment.receiptNumber,
      date: payment.paymentDate,
      caseRef: kase.caseRef,
      mactCaseNumber: kase.mactCaseNumber,
      claimantName: kase.claimants[0]?.name ?? null,
      amount: this.toNumber(payment.amount),
      mode: payment.paymentMode,
      reference: payment.reference,
      notes: payment.notes,
      advocate: kase.leadAdvocate?.fullName ?? null,
      firm: 'MACT Case Management',
      recordedBy: payment.recordedBy?.fullName ?? null,
    };
  }
}
