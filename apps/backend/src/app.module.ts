import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditLogModule,
    UsersModule,
    AuthModule,
    EngineeringModule,
    ProjectsModule,
    AiModule,
    FinancialModule,
    GridModule,
    ProcurementModule,
    IotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

