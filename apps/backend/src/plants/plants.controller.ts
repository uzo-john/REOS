import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlantsService } from './plants.service';
import {
  CreatePlantDto,
  UpdatePlantDto,
  CreateSiteDto,
  AssignDeviceDto,
} from './dto/plant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Plants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plants')
export class PlantsController {
  constructor(private readonly service: PlantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new plant' })
  create(@Body() dto: CreatePlantDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all plants' })
  findAll(@Query() pagination: PaginationDto, @Query('orgId') orgId?: string) {
    return this.service.findAll(pagination, orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plant details' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get plant operational summary' })
  summary(@Param('id') id: string) {
    return this.service.getPlantSummary(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update plant' })
  update(@Param('id') id: string, @Body() dto: UpdatePlantDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Decommission plant' })
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }

  @Post(':id/sites')
  @ApiOperation({ summary: 'Create site within plant' })
  createSite(
    @Param('id') plantId: string,
    @Body() dto: CreateSiteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.createSite(plantId, dto, userId);
  }

  @Get(':id/sites')
  @ApiOperation({ summary: 'List plant sites' })
  getSites(@Param('id') plantId: string) {
    return this.service.getSites(plantId);
  }

  @Delete(':id/sites/:siteId')
  @ApiOperation({ summary: 'Delete site' })
  deleteSite(@Param('siteId') siteId: string) {
    return this.service.deleteSite(siteId);
  }

  @Post(':id/devices')
  @ApiOperation({ summary: 'Assign device to plant' })
  assignDevice(@Param('id') plantId: string, @Body() dto: AssignDeviceDto) {
    return this.service.assignDevice(plantId, dto);
  }

  @Delete(':id/devices/:deviceId')
  @ApiOperation({ summary: 'Unassign device from plant' })
  unassignDevice(
    @Param('id') plantId: string,
    @Param('deviceId') deviceId: string,
  ) {
    return this.service.unassignDevice(plantId, deviceId);
  }
}
