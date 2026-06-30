import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { paginate } from '../common/dto/pagination.dto';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { QueryCaseDto } from './dto/query-case.dto';
import { VehicleInput } from './dto/nested.dto';

@Injectable()
export class CasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Generates the next human-friendly reference: MACT-2026-00042. */
  private async nextCaseRef(tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    const countThisYear = await tx.case.count({
      where: { createdAt: { gte: start, lt: end } },
    });
    const seq = String(countThisYear + 1).padStart(5, '0');
    return `MACT-${year}-${seq}`;
  }

  private mapVehicle(v: VehicleInput): Prisma.VehicleCreateWithoutCaseInput {
    return {
      role: v.role ?? 'OFFENDING',
      registrationNo: v.registrationNo,
      vehicleType: v.vehicleType,
      make: v.make,
      model: v.model,
      chassisNumber: v.chassisNumber,
      engineNumber: v.engineNumber,
      registrationDate: v.registrationDate,
      permitNumber: v.permitNumber,
      permitValidity: v.permitValidity,
      fitnessValidity: v.fitnessValidity,
      driver: v.driver ? { create: { ...v.driver } } : undefined,
      owner: v.owner ? { create: { ...v.owner } } : undefined,
      insurance: v.insurance
        ? {
            create: {
              policyNumber: v.insurance.policyNumber,
              policyStartDate: v.insurance.policyStartDate,
              policyExpiryDate: v.insurance.policyExpiryDate,
              isThirdParty: v.insurance.isThirdParty ?? true,
              surveyor: v.insurance.surveyor,
              claimNumber: v.insurance.claimNumber,
              companyNameText: v.insurance.companyNameText,
              insuranceCompany: v.insurance.insuranceCompanyId
                ? { connect: { id: v.insurance.insuranceCompanyId } }
                : undefined,
            },
          }
        : undefined,
    };
  }

  async create(dto: CreateCaseDto, actorId?: string) {
    const created = await this.prisma.$transaction(async (tx) => {
      const caseRef = await this.nextCaseRef(tx);
      return tx.case.create({
        data: {
          caseRef,
          mactCaseNumber: dto.mactCaseNumber,
          courtNumber: dto.courtNumber,
          presidingOfficer: dto.presidingOfficer,
          benchDetails: dto.benchDetails,
          physicalFileLocation: dto.physicalFileLocation,
          filingDate: dto.filingDate,
          registrationDate: dto.registrationDate,
          institutionDate: dto.institutionDate,
          nextHearingDate: dto.nextHearingDate,
          status: dto.status,
          outcome: dto.outcome,
          stage: dto.stage,
          priority: dto.priority,
          caseSummary: dto.caseSummary,
          internalNotes: dto.internalNotes,
          court: dto.courtId ? { connect: { id: dto.courtId } } : undefined,
          leadAdvocate: dto.leadAdvocateId
            ? { connect: { id: dto.leadAdvocateId } }
            : undefined,
          claimPetition: dto.claimPetition
            ? { create: { ...dto.claimPetition } }
            : undefined,
          accident: dto.accident
            ? {
                create: {
                  ...dto.accident,
                  policeStation: dto.accident.policeStationId
                    ? { connect: { id: dto.accident.policeStationId } }
                    : undefined,
                  policeStationId: undefined,
                },
              }
            : undefined,
          claimants: dto.claimants?.length
            ? { create: dto.claimants }
            : undefined,
          victims: dto.victims?.length ? { create: dto.victims } : undefined,
          respondents: dto.respondents?.length
            ? {
                create: dto.respondents.map((r) => ({
                  type: r.type,
                  name: r.name,
                  address: r.address,
                  mobile: r.mobile,
                  remarks: r.remarks,
                  insurer: r.insurerId
                    ? { connect: { id: r.insurerId } }
                    : undefined,
                })),
              }
            : undefined,
          witnesses: dto.witnesses?.length
            ? { create: dto.witnesses }
            : undefined,
          vehicles: dto.vehicles?.length
            ? { create: dto.vehicles.map((v) => this.mapVehicle(v)) }
            : undefined,
          activities: {
            create: { userId: actorId, verb: 'created case' },
          },
        },
        include: { claimPetition: true },
      });
    });

    await this.audit.record({
      userId: actorId,
      action: AuditAction.CREATE,
      entity: 'Case',
      entityId: created.id,
      after: { caseRef: created.caseRef },
    });
    return created;
  }

  async findAll(dto: QueryCaseDto) {
    const where: Prisma.CaseWhereInput = {
      deletedAt: null,
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.stage ? { stage: dto.stage } : {}),
      ...(dto.priority ? { priority: dto.priority } : {}),
      ...(dto.courtId ? { courtId: dto.courtId } : {}),
      ...(dto.leadAdvocateId ? { leadAdvocateId: dto.leadAdvocateId } : {}),
      ...(dto.search
        ? {
            OR: [
              { caseRef: { contains: dto.search, mode: 'insensitive' } },
              { mactCaseNumber: { contains: dto.search, mode: 'insensitive' } },
              {
                claimants: {
                  some: {
                    name: { contains: dto.search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const orderBy = dto.sortBy
      ? { [dto.sortBy]: dto.sortDir ?? 'desc' }
      : { createdAt: 'desc' as const };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.case.findMany({
        where,
        skip: dto.skip,
        take: dto.take,
        orderBy,
        include: {
          court: { select: { name: true } },
          leadAdvocate: { select: { fullName: true } },
          claimants: { select: { name: true }, take: 1 },
          _count: { select: { hearings: true, documents: true } },
        },
      }),
      this.prisma.case.count({ where }),
    ]);
    return paginate(rows, total, dto);
  }

  async findOne(id: string) {
    const found = await this.prisma.case.findFirst({
      where: { id, deletedAt: null },
      include: {
        court: true,
        leadAdvocate: { select: { id: true, fullName: true, email: true } },
        claimPetition: true,
        accident: { include: { policeStation: true } },
        claimants: true,
        victims: true,
        vehicles: { include: { driver: true, owner: true, insurance: true } },
        respondents: { include: { insurer: true } },
        witnesses: true,
        medicalDetails: { include: { hospital: true } },
        fee: { include: { payments: true } },
        hearings: { orderBy: { hearingDate: 'desc' } },
        documents: { where: { deletedAt: null } },
        compensations: true,
        assignees: { include: { user: { select: { fullName: true, role: true } } } },
      },
    });
    if (!found) throw new NotFoundException('Case not found');
    return found;
  }

  async update(id: string, dto: UpdateCaseDto, actorId?: string) {
    await this.ensureExists(id);
    const updated = await this.prisma.case.update({
      where: { id },
      data: {
        mactCaseNumber: dto.mactCaseNumber,
        courtNumber: dto.courtNumber,
        presidingOfficer: dto.presidingOfficer,
        benchDetails: dto.benchDetails,
        physicalFileLocation: dto.physicalFileLocation,
        filingDate: dto.filingDate,
        registrationDate: dto.registrationDate,
        institutionDate: dto.institutionDate,
        nextHearingDate: dto.nextHearingDate,
        status: dto.status,
        outcome: dto.outcome,
        stage: dto.stage,
        priority: dto.priority,
        caseSummary: dto.caseSummary,
        internalNotes: dto.internalNotes,
        court: dto.courtId ? { connect: { id: dto.courtId } } : undefined,
        leadAdvocate: dto.leadAdvocateId
          ? { connect: { id: dto.leadAdvocateId } }
          : undefined,
        claimPetition: dto.claimPetition
          ? {
              upsert: {
                create: { ...dto.claimPetition },
                update: { ...dto.claimPetition },
              },
            }
          : undefined,
      },
    });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.UPDATE,
      entity: 'Case',
      entityId: id,
    });
    return updated;
  }

  async remove(id: string, actorId?: string) {
    await this.ensureExists(id);
    await this.prisma.case.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.DELETE,
      entity: 'Case',
      entityId: id,
    });
    return { success: true };
  }

  private async ensureExists(id: string) {
    const c = await this.prisma.case.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!c) throw new NotFoundException('Case not found');
  }

  /** Cross-entity global search (case no, claimant, vehicle, driver, FIR,
   *  policy, mobile) used by the top-bar search box. */
  async globalSearch(term: string) {
    if (!term || term.trim().length < 2) return [];
    const t = term.trim();
    const rows = await this.prisma.case.findMany({
      where: {
        deletedAt: null,
        OR: [
          { caseRef: { contains: t, mode: 'insensitive' } },
          { mactCaseNumber: { contains: t, mode: 'insensitive' } },
          { claimants: { some: { name: { contains: t, mode: 'insensitive' } } } },
          { claimants: { some: { mobile: { contains: t } } } },
          { vehicles: { some: { registrationNo: { contains: t, mode: 'insensitive' } } } },
          { vehicles: { some: { driver: { name: { contains: t, mode: 'insensitive' } } } } },
          { vehicles: { some: { insurance: { policyNumber: { contains: t, mode: 'insensitive' } } } } },
          { accident: { firNumber: { contains: t, mode: 'insensitive' } } },
        ],
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        caseRef: true,
        mactCaseNumber: true,
        status: true,
        stage: true,
        nextHearingDate: true,
        claimants: { select: { name: true }, take: 1 },
      },
    });
    return rows;
  }
}
