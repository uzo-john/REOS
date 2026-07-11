import {
  Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto, AddMemberDto } from './dto/organization.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  create(@Body() dto: CreateOrganizationDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all organizations with pagination' })
  findAll(@Query() pagination: PaginationDto, @Query('type') type?: string) {
    return this.service.findAll(pagination, type);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get organizations I belong to' })
  getMyOrgs(@CurrentUser('id') userId: string) {
    return this.service.getUserOrganizations(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update organization' })
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to organization' })
  addMember(@Param('id') orgId: string, @Body() dto: AddMemberDto) {
    return this.service.addMember(orgId, dto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from organization' })
  removeMember(
    @Param('id') orgId: string,
    @Param('userId') userId: string,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.service.removeMember(orgId, userId, requesterId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete organization (soft)' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
