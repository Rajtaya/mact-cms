import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { paginate } from '../common/dto/pagination.dto';
import { CreateHearingDto } from './dto/create-hearing.dto';
import { UpdateHearingDto } from './dto/update-hearing.dto';
import { QueryHearingDto } from './dto/query-hearing.dto';

@Injectable()
export class HearingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(caseId: string, dto: CreateHearingDto, actorId?: string) {
    // Confirm the parent case exists (and isn't soft-deleted) up-front so we
    // can roll the case's hearing pointers forward inside one transaction.
    const parent = await this.prisma.case.findFirst({
      where: { id: caseId, deletedAt: null },
      select: { id: true, nextHearingDate: true },
    });
    if (!parent) throw new NotFoundException('Case not found');

    const created = await this.prisma.$transaction(async (tx) => {
      const hearing = await tx.hearing.create({
        data: {
          case: { connect: { id: caseId } },
          hearingDate: dto.hearingDate,
          status: dto.status,
          proceedings: dto.proceedings,
          judgeRemarks: dto.judgeRemarks,
          advocateNotes: dto.advocateNotes,
          nextHearingDate: dto.nextHearingDate,
          orderDocument: dto.orderDocumentId
            ? { connect: { id: dto.orderDocumentId } }
            : undefined,
          createdBy: actorId ? { connect: { id: actorId } } : undefined,
        },
      });

      // Roll the case timeline forward: the date that *was* "next" becomes the
      // previous hearing, and this hearing's nextHearingDate becomes the new one.
      await tx.case.update({
        where: { id: caseId },
        data: {
          prevHearingDate: parent.nextHearingDate ?? undefined,
          nextHearingDate: dto.nextHearingDate,
          activities: {
            create: { userId: actorId, verb: 'added hearing' },
          },
        },
      });

      return hearing;
    });

    await this.audit.record({
      userId: actorId,
      action: AuditAction.CREATE,
      entity: 'Hearing',
      entityId: created.id,
      after: { caseId, hearingDate: created.hearingDate },
    });
    return created;
  }

  async findAll(caseId: string, dto: QueryHearingDto) {
    const where: Prisma.HearingWhereInput = {
      caseId,
      ...(dto.status ? { status: dto.status } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.hearing.findMany({
        where,
        skip: dto.skip,
        take: dto.take,
        orderBy: { hearingDate: 'desc' }, // newest first — timeline view
        include: {
          createdBy: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.hearing.count({ where }),
    ]);
    return paginate(rows, total, dto);
  }

  async findOne(caseId: string, id: string) {
    const found = await this.prisma.hearing.findFirst({
      where: { id, caseId },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        orderDocument: true,
      },
    });
    if (!found) throw new NotFoundException('Hearing not found');
    return found;
  }

  async update(
    caseId: string,
    id: string,
    dto: UpdateHearingDto,
    actorId?: string,
  ) {
    await this.ensureExists(caseId, id);
    const updated = await this.prisma.hearing.update({
      where: { id },
      data: {
        hearingDate: dto.hearingDate,
        status: dto.status,
        proceedings: dto.proceedings,
        judgeRemarks: dto.judgeRemarks,
        advocateNotes: dto.advocateNotes,
        nextHearingDate: dto.nextHearingDate,
        orderDocument: dto.orderDocumentId
          ? { connect: { id: dto.orderDocumentId } }
          : undefined,
      },
    });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.UPDATE,
      entity: 'Hearing',
      entityId: id,
    });
    return updated;
  }

  async remove(caseId: string, id: string, actorId?: string) {
    await this.ensureExists(caseId, id);
    // No soft-delete column on Hearing — this is a hard delete.
    await this.prisma.hearing.delete({ where: { id } });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.DELETE,
      entity: 'Hearing',
      entityId: id,
    });
    return { success: true };
  }

  private async ensureExists(caseId: string, id: string) {
    const h = await this.prisma.hearing.findFirst({
      where: { id, caseId },
      select: { id: true },
    });
    if (!h) throw new NotFoundException('Hearing not found');
  }
}
