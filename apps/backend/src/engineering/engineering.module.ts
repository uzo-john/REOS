import { Module } from '@nestjs/common';
import { EngineeringService } from './engineering.service';
import { EngineeringController } from './engineering.controller';

@Module({
  providers: [EngineeringService],
  controllers: [EngineeringController],
  exports: [EngineeringService],
})
export class EngineeringModule {}
