import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async create(userId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        ...dto,
        userId,
      },
    });

    await this.auditLog.log('PROJECT_CREATE', { projectId: project.id, name: project.name }, userId);
    return project;
  }

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: {
        appliances: true,
        designs: true,
        simulations: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(userId: string, id: string, dto: UpdateProjectDto) {
    await this.findOne(userId, id); // validates existence & ownership

    const project = await this.prisma.project.update({
      where: { id },
      data: dto,
    });

    await this.auditLog.log('PROJECT_UPDATE', { projectId: project.id, updates: dto }, userId);
    return project;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.project.delete({
      where: { id },
    });

    await this.auditLog.log('PROJECT_DELETE', { projectId: id }, userId);
    return { success: true };
  }
}
