import { Module } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { FinancialController } from './financial.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [FinancialService],
  controllers: [FinancialController],
  exports: [FinancialService],
})
export class FinancialModule {}
