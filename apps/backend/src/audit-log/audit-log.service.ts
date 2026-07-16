import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(
    action: string,
    details?: any,
    userId?: string,
    ipAddress?: string,
  ) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          action,
          details: details ? JSON.stringify(details) : null,
          userId,
          ipAddress,
        },
      });
    } catch (e) {
      console.warn('Offline mode: skipping audit log save.');
      return null;
    }
  }
}
