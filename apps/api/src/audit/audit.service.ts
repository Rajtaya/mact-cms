import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface AuditInput {
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Central audit trail. Never throws into the caller — a failed audit write
 * must not break the business operation it records.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Read-only, paginated audit trail for the viewer (Admin/Senior only). */
  async query(params: {
    entity?: string;
    entityId?: string;
    userId?: string;
    skip: number;
    take: number;
  }) {
    const where = {
      ...(params.entity ? { entity: params.entity } : {}),
      ...(params.entityId ? { entityId: params.entityId } : {}),
      ...(params.userId ? { userId: params.userId } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, email: true, role: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, total };
  }

  async record(input: AuditInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: input.userId ?? null,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId ?? null,
          before: input.before ?? Prisma.JsonNull,
          after: input.after ?? Prisma.JsonNull,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(`Audit write failed for ${input.entity}: ${err}`);
    }
  }
}
