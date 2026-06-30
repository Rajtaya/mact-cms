import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CalculateDto, SaveEstimateDto } from './dto/calculate.dto';
import { computeCompensation } from './compensation.calculator';

@Injectable()
export class CompensationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Pure computation — no persistence. Powers the standalone calculator page. */
  calculate(dto: CalculateDto) {
    return computeCompensation(dto);
  }

  /** Compute and persist an estimate against a case (a "what-if" scenario). */
  async saveForCase(caseId: string, dto: SaveEstimateDto, actorId?: string) {
    const exists = await this.prisma.case.findFirst({
      where: { id: caseId, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Case not found');

    const breakdown = computeCompensation(dto);
    const estimate = await this.prisma.compensationEstimate.create({
      data: {
        caseId,
        label: dto.label,
        age: dto.age,
        monthlyIncome: dto.monthlyIncome,
        futureProspectsPct: dto.futureProspectsPct ?? breakdown.futureProspectsPct,
        disabilityPct: dto.disabilityPct,
        medicalExpenses: dto.medicalExpenses,
        funeralExpenses: dto.funeralExpenses,
        consortium: dto.consortium,
        attendantCharges: dto.attendantCharges,
        transportCharges: dto.transportCharges,
        specialDiet: dto.specialDiet,
        painAndSuffering: dto.painAndSuffering,
        multiplier: breakdown.multiplier,
        dependencyDeduction: breakdown.dependencyDeductionPct,
        computedLossOfDependency: breakdown.lossOfDependencyOrEarning,
        totalCompensation: breakdown.total,
        breakdown: breakdown as unknown as Prisma.InputJsonValue,
      },
    });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.CREATE,
      entity: 'CompensationEstimate',
      entityId: estimate.id,
    });
    return { estimate, breakdown };
  }

  listForCase(caseId: string) {
    return this.prisma.compensationEstimate.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, actorId?: string) {
    await this.prisma.compensationEstimate.delete({ where: { id } });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.DELETE,
      entity: 'CompensationEstimate',
      entityId: id,
    });
    return { success: true };
  }
}
