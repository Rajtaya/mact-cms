import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CasesModule } from './cases/cases.module';
import { HearingsModule } from './hearings/hearings.module';
import { DocumentsModule } from './documents/documents.module';
import { FeesModule } from './fees/fees.module';
import { CompensationModule } from './compensation/compensation.module';
import { SettingsModule } from './settings/settings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { MaskingInterceptor } from './common/interceptors/masking.interceptor';
import { DateCoercionInterceptor } from './common/interceptors/date-coercion.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    CasesModule,
    HearingsModule,
    DocumentsModule,
    FeesModule,
    CompensationModule,
    SettingsModule,
    DashboardModule,
    ReportsModule,
    NotificationsModule,
  ],
  providers: [
    // Order matters: throttle → authenticate → authorize
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // Normalize date-only inputs to ISO before validation/persistence
    { provide: APP_INTERCEPTOR, useClass: DateCoercionInterceptor },
    // KYC masking applied to every response for non-privileged roles
    { provide: APP_INTERCEPTOR, useClass: MaskingInterceptor },
  ],
})
export class AppModule {}
