import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SAFE_SELECT = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateUserDto, actorId?: string) {
    const passwordHash = await AuthService.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        role: dto.role,
      },
      select: SAFE_SELECT,
    });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.CREATE,
      entity: 'User',
      entityId: user.id,
      after: user as unknown as Prisma.InputJsonValue,
    });
    return user;
  }

  async findAll(dto: PaginationDto) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(dto.search
        ? {
            OR: [
              { fullName: { contains: dto.search, mode: 'insensitive' } },
              { email: { contains: dto.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: SAFE_SELECT,
        skip: dto.skip,
        take: dto.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(data, total, dto);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: SAFE_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string) {
    const data: Prisma.UserUpdateInput = {
      fullName: dto.fullName,
      phone: dto.phone,
      role: dto.role,
      isActive: dto.isActive,
      email: dto.email,
    };
    if (dto.password) data.passwordHash = await AuthService.hash(dto.password);

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: SAFE_SELECT,
    });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.UPDATE,
      entity: 'User',
      entityId: id,
      after: user as unknown as Prisma.InputJsonValue,
    });
    return user;
  }

  async remove(id: string, actorId?: string) {
    // Soft-delete + revoke tokens
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, tokenVersion: { increment: 1 } },
    });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.DELETE,
      entity: 'User',
      entityId: id,
    });
    return { success: true };
  }
}
