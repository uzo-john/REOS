import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards, Delete, Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto, UpdateMaintenanceDto, ResolveFaultDto } from './dto/maintenance.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Maintenance & Diagnostics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}

  @Post('ticket')
  @ApiOperation({ summary: 'Create maintenance task / dispatch work order (Admin/Engineer)' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'ENGINEER', 'PLANT_OPERATOR')
  create(@Body() dto: CreateMaintenanceDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Get list of maintenance tickets with filters' })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('deviceId') deviceId?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.service.findAll(pagination, status, deviceId, assignedTo);
  }

  @Get('ticket/:id')
  @ApiOperation({ summary: 'Get detailed maintenance ticket metadata' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch('ticket/:id')
  @ApiOperation({ summary: 'Update ticket status, cost, or notes (Engineer/Admin)' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'ENGINEER', 'MAINTENANCE_ENGINEER')
  update(@Param('id') id: string, @Body() dto: UpdateMaintenanceDto) {
    return this.service.update(id, dto);
  }

  @Delete('ticket/:id')
  @ApiOperation({ summary: 'Cancel/Delete maintenance ticket' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }

  @Get('faults')
  @ApiOperation({ summary: 'List active unresolved device faults/alarms' })
  getActiveFaults(@Query() pagination: PaginationDto, @Query('severity') severity?: string) {
    return this.service.getActiveFaults(pagination, severity);
  }

  @Post('faults/:id/resolve')
  @ApiOperation({ summary: 'Acknowledge and mark a device fault as resolved' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'ENGINEER', 'MAINTENANCE_ENGINEER')
  resolveFault(
    @Param('id') id: string,
    @Body() dto: ResolveFaultDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.resolveFault(id, dto, userId);
  }
}
