import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { PrismaModule } from './prisma/prisma.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EngineeringModule } from './engineering/engineering.module';
import { ProjectsModule } from './projects/projects.module';
import { AiModule } from './ai/ai.module';
import { FinancialModule } from './financial/financial.module';
import { GridModule } from './grid/grid.module';
import { ProcurementModule } from './procurement/procurement.module';
import { IotModule } from './iot/iot.module';
import { ConsumerModule } from './consumer/consumer.module';

// New Modules
import { OrganizationsModule } from './organizations/organizations.module';
import { PlantsModule } from './plants/plants.module';
import { DevicesModule } from './devices/devices.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { WalletModule } from './wallet/wallet.module';
import { TradingModule } from './trading/trading.module';
import { BillingModule } from './billing/billing.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { MqttModule } from './mqtt/mqtt.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiter configured: default 100 requests per 60 seconds
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    
    // Core & Foundation
    PrismaModule,
    AuditLogModule,
    UsersModule,
    AuthModule,
    
    // Domain & Application Modules
    EngineeringModule,
    ProjectsModule,
    AiModule,
    FinancialModule,
    GridModule,
    ProcurementModule,
    IotModule,
    ConsumerModule,
    
    // Phase 1 Extended Modules
    OrganizationsModule,
    PlantsModule,
    DevicesModule,
    TelemetryModule,
    MonitoringModule,
    WalletModule,
    TradingModule,
    BillingModule,
    MaintenanceModule,
    NotificationsModule,
    ReportsModule,
    AdminModule,
    ApiKeysModule,
    MqttModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
