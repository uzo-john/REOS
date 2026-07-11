import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendNotificationDto } from './dto/notifications.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate, buildPaginationQuery } from '../common/utils/pagination.util';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: SendNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type || 'INFO',
        channel: dto.channel || 'IN_APP',
        actionUrl: dto.actionUrl,
        metadata: dto.metadata || undefined,
      },
    });
  }

  async getUserNotifications(userId: string, pagination: PaginationDto, unreadOnly = false) {
    const query = buildPaginationQuery(pagination);
    const where = {
      userId,
      ...(unreadOnly && { read: false }),
    };

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        ...query,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return paginate(data, total, pagination);
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new NotFoundException('Notification not found for current user');

    return this.prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }
}
