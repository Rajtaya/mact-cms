import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

const num = (v: Prisma.Decimal | number | null | undefined): number =>
  v == null ? 0 : typeof v === 'number' ? v : Number(v);

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async ensureCase(caseId: string): Promise<void> {
    const c = await this.prisma.case.findFirst({
      where: { id: caseId, deletedAt: null },
      select: { id: true },
    });
    if (!c) throw new NotFoundException('Case not found');
  }

  async create(caseId: string, dto: CreateExpenseDto, actorId?: string) {
    await this.ensureCase(caseId);
    const expense = await this.prisma.caseExpense.create({
      data: {
        caseId,
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        expenseDate: dto.expenseDate,
        isReimbursable: dto.isReimbursable,
        reimbursed: dto.reimbursed,
        receiptRef: dto.receiptRef,
        createdById: actorId,
      },
    });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.CREATE,
      entity: 'CaseExpense',
      entityId: expense.id,
      after: { caseId, amount: num(expense.amount), category: expense.category },
    });
    return expense;
  }

  /** Expenses for a case with computed totals. */
  async listForCase(caseId: string) {
    await this.ensureCase(caseId);
    const expenses = await this.prisma.caseExpense.findMany({
      where: { caseId },
      orderBy: { expenseDate: 'desc' },
      include: { createdBy: { select: { fullName: true } } },
    });
    const total = expenses.reduce((s, e) => s + num(e.amount), 0);
    const reimbursable = expenses
      .filter((e) => e.isReimbursable && !e.reimbursed)
      .reduce((s, e) => s + num(e.amount), 0);
    return { expenses, total, pendingReimbursement: reimbursable };
  }

  async update(id: string, dto: UpdateExpenseDto, actorId?: string) {
    const existing = await this.prisma.caseExpense.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Expense not found');
    const expense = await this.prisma.caseExpense.update({
      where: { id },
      data: {
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        expenseDate: dto.expenseDate,
        isReimbursable: dto.isReimbursable,
        reimbursed: dto.reimbursed,
        receiptRef: dto.receiptRef,
      },
    });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.UPDATE,
      entity: 'CaseExpense',
      entityId: id,
    });
    return expense;
  }

  async remove(id: string, actorId?: string) {
    const existing = await this.prisma.caseExpense.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Expense not found');
    await this.prisma.caseExpense.delete({ where: { id } });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.DELETE,
      entity: 'CaseExpense',
      entityId: id,
    });
    return { success: true };
  }
}
