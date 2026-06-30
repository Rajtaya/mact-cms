import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: string, onlyUnread = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(onlyUnread ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  private dayRange(offsetDays: number) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offsetDays);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return { gte: d, lt: next };
  }

  /** Already-created-today guard so reminders aren't duplicated per run. */
  private async exists(
    userId: string,
    type: NotificationType,
    caseId: string | null,
  ): Promise<boolean> {
    const today = this.dayRange(0);
    const found = await this.prisma.notification.findFirst({
      where: { userId, type, caseId, createdAt: { gte: today.gte, lt: today.lt } },
      select: { id: true },
    });
    return !!found;
  }

  /**
   * Scans for hearings tomorrow and policies expiring within 30 days and
   * creates reminders for the relevant lead advocate. Idempotent per day.
   */
  async generateReminders() {
    const tomorrow = this.dayRange(1);
    let created = 0;

    // 1) Hearings listed tomorrow
    const hearingCases = await this.prisma.case.findMany({
      where: { deletedAt: null, nextHearingDate: tomorrow, leadAdvocateId: { not: null } },
      select: { id: true, caseRef: true, mactCaseNumber: true, leadAdvocateId: true, nextHearingDate: true },
    });
    for (const c of hearingCases) {
      const userId = c.leadAdvocateId!;
      if (await this.exists(userId, NotificationType.HEARING_TOMORROW, c.id)) continue;
      await this.prisma.notification.create({
        data: {
          userId,
          caseId: c.id,
          type: NotificationType.HEARING_TOMORROW,
          title: `Hearing tomorrow — ${c.mactCaseNumber ?? c.caseRef}`,
          body: 'This case is listed for hearing tomorrow.',
          dueAt: c.nextHearingDate,
        },
      });
      created++;
    }

    // 2) Insurance policies expiring within 30 days
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    const expiring = await this.prisma.insurance.findMany({
      where: { policyExpiryDate: { gte: new Date(), lte: in30 } },
      select: {
        policyNumber: true,
        policyExpiryDate: true,
        vehicle: {
          select: { case: { select: { id: true, caseRef: true, leadAdvocateId: true } } },
        },
      },
    });
    for (const ins of expiring) {
      const kase = ins.vehicle?.case;
      if (!kase?.leadAdvocateId) continue;
      if (await this.exists(kase.leadAdvocateId, NotificationType.INSURANCE_EXPIRY, kase.id))
        continue;
      await this.prisma.notification.create({
        data: {
          userId: kase.leadAdvocateId,
          caseId: kase.id,
          type: NotificationType.INSURANCE_EXPIRY,
          title: `Policy expiring — ${ins.policyNumber ?? 'unknown'}`,
          body: `Insurance policy expires on ${ins.policyExpiryDate?.toDateString()}.`,
          dueAt: ins.policyExpiryDate,
        },
      });
      created++;
    }

    return { created };
  }
}
