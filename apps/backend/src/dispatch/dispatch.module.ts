import { Module } from '@nestjs/common';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { ModbusAdapter } from './adapters/modbus.adapter';
import { MqttAdapter } from './adapters/mqtt.adapter';
import { RestAdapter } from './adapters/rest.adapter';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [DispatchController],
  providers: [DispatchService, ModbusAdapter, MqttAdapter, RestAdapter],
  exports: [DispatchService],
})
export class DispatchModule {}
