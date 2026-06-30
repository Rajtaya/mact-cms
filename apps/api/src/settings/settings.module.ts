import { Module } from '@nestjs/common';
import {
  CourtsController,
  HospitalsController,
  InsuranceCompaniesController,
  JudgesController,
  PoliceStationsController,
} from './settings.controllers';
import {
  CourtsService,
  HospitalsService,
  InsuranceCompaniesService,
  JudgesService,
  PoliceStationsService,
} from './settings.services';

@Module({
  controllers: [
    CourtsController,
    JudgesController,
    InsuranceCompaniesController,
    PoliceStationsController,
    HospitalsController,
  ],
  providers: [
    CourtsService,
    JudgesService,
    InsuranceCompaniesService,
    PoliceStationsService,
    HospitalsService,
  ],
  exports: [
    CourtsService,
    JudgesService,
    InsuranceCompaniesService,
    PoliceStationsService,
    HospitalsService,
  ],
})
export class SettingsModule {}
