import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BaseSettingService, SettingDelegate } from './base-setting.service';

/** Concrete master-data services. Each binds the generic CRUD base to a
 *  Prisma delegate, the audit entity name, and its searchable fields. */

@Injectable()
export class CourtsService extends BaseSettingService<SettingDelegate> {
  constructor(prisma: PrismaService, audit: AuditService) {
    super(prisma.court as any, 'Court', ['name', 'district', 'presidingOfficer'], audit);
  }
}

@Injectable()
export class JudgesService extends BaseSettingService<SettingDelegate> {
  constructor(prisma: PrismaService, audit: AuditService) {
    super(prisma.judge as any, 'Judge', ['name', 'designation'], audit);
  }
}

@Injectable()
export class InsuranceCompaniesService extends BaseSettingService<SettingDelegate> {
  constructor(prisma: PrismaService, audit: AuditService) {
    super(
      prisma.insuranceCompany as any,
      'InsuranceCompany',
      ['name', 'shortName', 'irdaCode'],
      audit,
    );
  }
}

@Injectable()
export class PoliceStationsService extends BaseSettingService<SettingDelegate> {
  constructor(prisma: PrismaService, audit: AuditService) {
    super(prisma.policeStation as any, 'PoliceStation', ['name', 'district'], audit);
  }
}

@Injectable()
export class HospitalsService extends BaseSettingService<SettingDelegate> {
  constructor(prisma: PrismaService, audit: AuditService) {
    super(prisma.hospital as any, 'Hospital', ['name', 'city', 'district'], audit);
  }
}
