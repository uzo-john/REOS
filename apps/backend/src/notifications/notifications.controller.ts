import {
  Controller, Get, Post, Body, Param, Query, UseGuards, Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/notifications.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('In-App Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send alert/notification to a user manually (Admin only)' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  send(@Body() dto: SendNotificationDto) {
    return this.service.create(dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get list of notifications for currently logged in user' })
  getMyNotifications(
    @Query() pagination: PaginationDto,
    @Query('unreadOnly') unreadOnly?: string,
    @CurrentUser('id') userId?: string,
  ) {
    const unread = unreadOnly === 'true';
    return this.service.getUserNotifications(userId!, pagination, unread);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark single notification as read' })
  markRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.markAsRead(id, userId);
  }

  @Patch('read/all')
  @ApiOperation({ summary: 'Mark all user notifications as read' })
  markAllRead(@CurrentUser('id') userId: string) {
    return this.service.markAllAsRead(userId);
  }
}
