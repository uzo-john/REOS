import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(action: string, details?: any, userId?: string, ipAddress?: string) {
    return this.prisma.auditLog.create({
      data: {
        action,
        details: details ? JSON.stringify(details) : null,
        userId,
        ipAddress,
      },
    });
  }
}
