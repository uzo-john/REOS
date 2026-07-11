import {
  Controller, Get, Post, Body, Param, UseGuards, Patch, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateSystemSettingDto, UpdateSystemSettingDto } from './dto/admin.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Platform Administration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get overall platform registration & database counts (Admin only)' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getStats() {
    return this.service.getPlatformStats();
  }

  @Post('settings')
  @ApiOperation({ summary: 'Register a new global configuration key' })
  @Roles('SUPER_ADMIN')
  createSetting(@Body() dto: CreateSystemSettingDto, @CurrentUser('id') userId: string) {
    return this.service.createSetting(dto, userId);
  }

  @Public() // Allow clients to retrieve public configurations without logging in
  @Get('settings/public')
  @ApiOperation({ summary: 'List public system configuration keys' })
  getPublicSettings(@Query('category') category?: string) {
    return this.service.getSettings(category, true);
  }

  @Get('settings')
  @ApiOperation({ summary: 'List all configuration keys (Admin only)' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getSettings(@Query('category') category?: string) {
    return this.service.getSettings(category, false);
  }

  @Patch('settings/:key')
  @ApiOperation({ summary: 'Update system configuration key' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSystemSettingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.updateSetting(key, dto, userId);
  }
}
