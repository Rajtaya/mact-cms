import { NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { paginate } from '../common/dto/pagination.dto';
import { QuerySettingDto } from './dto/query-setting.dto';

/**
 * Minimal shape every master-data Prisma delegate satisfies. Kept loose on
 * purpose so a single generic CRUD base serves all five settings entities
 * without fighting Prisma's per-model generics.
 */
export interface SettingDelegate {
  findMany(args: any): Promise<any[]>;
  count(args: any): Promise<number>;
  findUnique(args: any): Promise<any>;
  create(args: any): Promise<any>;
  update(args: any): Promise<any>;
}

/**
 * Generic CRUD for the settings master-data entities. Soft-deletes via
 * isActive=false, supports ?search over the configured text fields, and
 * writes an audit entry for every mutation.
 */
export abstract class BaseSettingService<TDelegate extends SettingDelegate> {
  protected constructor(
    protected readonly delegate: TDelegate,
    /** Prisma model name, also used as the audit `entity`. */
    protected readonly entity: string,
    /** Fields a ?search term is matched against (case-insensitive). */
    protected readonly searchFields: string[],
    protected readonly audit: AuditService,
  ) {}

  async findAll(dto: QuerySettingDto) {
    const where: Record<string, any> = {
      ...(dto.includeInactive ? {} : { isActive: true }),
      ...(dto.search
        ? {
            OR: this.searchFields.map((field) => ({
              [field]: { contains: dto.search, mode: 'insensitive' },
            })),
          }
        : {}),
    };

    const orderBy = dto.sortBy
      ? { [dto.sortBy]: dto.sortDir ?? 'asc' }
      : { name: 'asc' as const };

    const [rows, total] = await Promise.all([
      this.delegate.findMany({
        where,
        skip: dto.skip,
        take: dto.take,
        orderBy,
      }),
      this.delegate.count({ where }),
    ]);

    return paginate(rows, total, dto);
  }

  async findOne(id: string) {
    const found = await this.delegate.findUnique({ where: { id } });
    if (!found) throw new NotFoundException(`${this.entity} not found`);
    return found;
  }

  async create(data: Record<string, any>, actorId?: string) {
    const created = await this.delegate.create({ data });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.CREATE,
      entity: this.entity,
      entityId: created.id,
      after: created,
    });
    return created;
  }

  async update(id: string, data: Record<string, any>, actorId?: string) {
    await this.findOne(id);
    const updated = await this.delegate.update({ where: { id }, data });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.UPDATE,
      entity: this.entity,
      entityId: id,
      after: updated,
    });
    return updated;
  }

  /** Soft delete — flips isActive to false. */
  async remove(id: string, actorId?: string) {
    await this.findOne(id);
    await this.delegate.update({ where: { id }, data: { isActive: false } });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.DELETE,
      entity: this.entity,
      entityId: id,
    });
    return { success: true };
  }
}
