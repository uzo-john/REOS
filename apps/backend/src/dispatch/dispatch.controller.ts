import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SetPlantRuleDto, TriggerOverrideDto } from './dto/dispatch.dto';

@ApiTags('DERMS Dispatch Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dispatch')
export class DispatchController {
  constructor(private readonly service: DispatchService) {}

  @Get(':plantId/overview')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Get live dispatch telemetry overview' })
  getLiveOverview(@Param('plantId') plantId: string) {
    return this.service.getLiveDispatchOverview(plantId);
  }

  @Get(':plantId/rules')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Get configured dispatch rules' })
  getRules(@Param('plantId') plantId: string) {
    return this.service.getPlantRules(plantId);
  }

  @Post('rules')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Create or update dispatch rules' })
  setRules(
    @Body() dto: SetPlantRuleDto,
    @CurrentUser('id') operatorId: string,
  ) {
    return this.service.setPlantRules(dto, operatorId);
  }

  @Post('override')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Trigger operator manual override control command' })
  triggerOverride(
    @Body() dto: TriggerOverrideDto,
    @CurrentUser('id') operatorId: string,
    @CurrentUser('role') operatorRole: string,
  ) {
    return this.service.triggerOverride(dto, operatorId, operatorRole);
  }

  @Get(':plantId/curtailments')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Get curtailment events history' })
  getCurtailmentEvents(@Param('plantId') plantId: string) {
    return this.service.getCurtailmentEvents(plantId);
  }

  @Get(':plantId/constraints')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Get grid operator export constraints' })
  getGridConstraints(@Param('plantId') plantId: string) {
    return this.service.getGridConstraints(plantId);
  }

  @Get(':plantId/safety-logs')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Get safety interlock event logs' })
  getSafetyInterlockLogs(@Param('plantId') plantId: string) {
    return this.service.getSafetyInterlockLogs(plantId);
  }

  @Get(':plantId/control-logs')
  @Roles(
    UserRole.COMMERCIAL_ENERGY_PRODUCER,
    UserRole.ADMIN,
    UserRole.SYSTEM_OWNER,
  )
  @ApiOperation({ summary: 'Get full control command logs' })
  getControlLogs(@Param('plantId') plantId: string) {
    return this.service.getControlLogs(plantId);
  }
}
