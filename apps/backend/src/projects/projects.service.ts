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
    if (!this.prisma.isConnected) {
      const mockProject = {
        id: `mock-project-${Date.now()}`,
        userId,
        name: dto.name,
        description: dto.description || null,
        location: dto.location || null,
        peakSunHours: Number((dto as any).peakSunHours || 5),
        loadSafetyFactor: Number((dto as any).loadSafetyFactor || 1.2),
        batteryDepthOfDischarge: Number((dto as any).batteryDepthOfDischarge || 0.8),
        systemVoltage: Number((dto as any).systemVoltage || 48),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return mockProject;
    }

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
    if (!this.prisma.isConnected) {
      return [];
    }
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    if (!this.prisma.isConnected) {
      if (id.startsWith('mock-project-')) {
        return {
          id,
          userId,
          name: 'Offline Mock Project',
          description: null,
          location: null,
          peakSunHours: 5,
          loadSafetyFactor: 1.2,
          batteryDepthOfDischarge: 0.8,
          systemVoltage: 48,
          createdAt: new Date(),
          updatedAt: new Date(),
          appliances: [],
          designs: [],
          simulations: [],
        };
      }
      throw new NotFoundException('Project not found (Database offline)');
    }

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
    if (!this.prisma.isConnected) {
      return {
        id,
        userId,
        name: dto.name || 'Offline Mock Project',
        description: dto.description || null,
        location: dto.location || null,
        peakSunHours: Number((dto as any).peakSunHours || 5),
        loadSafetyFactor: Number((dto as any).loadSafetyFactor || 1.2),
        batteryDepthOfDischarge: Number((dto as any).batteryDepthOfDischarge || 0.8),
        systemVoltage: Number((dto as any).systemVoltage || 48),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    await this.findOne(userId, id); // validates existence & ownership

    const project = await this.prisma.project.update({
      where: { id },
      data: dto,
    });

    await this.auditLog.log('PROJECT_UPDATE', { projectId: project.id, updates: dto }, userId);
    return project;
  }

  async remove(userId: string, id: string) {
    if (!this.prisma.isConnected) {
      return { success: true };
    }

    await this.findOne(userId, id);

    await this.prisma.project.delete({
      where: { id },
    });

    await this.auditLog.log('PROJECT_DELETE', { projectId: id }, userId);
    return { success: true };
  }
}
