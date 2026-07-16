import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

class ChangeRoleDto {
  @ApiProperty({
    enum: [
      'CUSTOMER',
      'CONSUMER',
      'SYSTEM_OWNER',
      'ADMIN',
      'SUPER_ADMIN',
      'INSTALLER',
      'ENGINEER',
      'PLANT_OPERATOR',
      'ENERGY_TRADER',
      'UTILITY_PROVIDER',
      'MAINTENANCE_ENGINEER',
    ],
  })
  @IsEnum([
    'CUSTOMER',
    'CONSUMER',
    'SYSTEM_OWNER',
    'ADMIN',
    'SUPER_ADMIN',
    'INSTALLER',
    'ENGINEER',
    'PLANT_OPERATOR',
    'ENERGY_TRADER',
    'UTILITY_PROVIDER',
    'MAINTENANCE_ENGINEER',
  ])
  role: UserRole;
}

class SetStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED'] })
  @IsEnum(['ACTIVE', 'SUSPENDED'])
  status: 'ACTIVE' | 'SUSPENDED';
}

@ApiTags('Admin — User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users (paginated, filterable)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false })
  listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('status') status?: string,
  ) {
    return this.usersService.adminListUsers({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search,
      role,
      status,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user summary stats for admin dashboard' })
  getUserStats() {
    return this.usersService.adminUserStats();
  }

  @Patch(':id/role')
  @ApiOperation({
    summary: "Change a user's role (promote to admin, demote, etc.)",
  })
  changeRole(
    @Param('id') id: string,
    @Body() dto: ChangeRoleDto,
    @CurrentUser('id') requestingUserId: string,
  ) {
    return this.usersService.changeUserRole(id, dto.role, requestingUserId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Suspend or reactivate a user account' })
  setStatus(
    @Param('id') id: string,
    @Body() dto: SetStatusDto,
    @CurrentUser('id') requestingUserId: string,
  ) {
    return this.usersService.setUserStatus(id, dto.status, requestingUserId);
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Soft-delete (remove) a user account — anonymises PII, preserves audit trail',
  })
  removeUser(
    @Param('id') id: string,
    @CurrentUser('id') requestingUserId: string,
  ) {
    return this.usersService.removeUser(id, requestingUserId);
  }
}
