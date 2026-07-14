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

  /**
   * Syncs the appliances list from inputs.appliances JSON into
   * the relational Appliance + ProjectAppliance tables.
   */
  private async syncAppliances(projectId: string, inputs: any) {
    if (!inputs?.appliances || !Array.isArray(inputs.appliances)) return;

    // Delete existing project appliances first to avoid duplicates
    await this.prisma.projectAppliance.deleteMany({ where: { projectId } });

    for (const app of inputs.appliances) {
      if (!app.name) continue;

      const applianceId = `app-${app.name.toLowerCase().replace(/\s+/g, '-')}`;

      // Upsert the master Appliance record
      const appliance = await this.prisma.appliance.upsert({
        where: { id: applianceId },
        create: {
          id: applianceId,
          name: app.name,
          defaultPower: app.powerW || 0,
          category: 'LOAD_PROFILE',
          isCustom: true,
        },
        update: {
          defaultPower: app.powerW || 0,
        },
      });

      // Create the ProjectAppliance link row
      await this.prisma.projectAppliance.create({
        data: {
          projectId,
          applianceId: appliance.id,
          quantity: app.quantity || 1,
          hoursOnDay: Array.isArray(app.hoursOn)
            ? app.hoursOn.map((h: number) => Number(h))
            : [],
        },
      });
    }
  }

  /**
   * Syncs sizing results into the ProjectDesign relational table.
   */
  private async syncDesign(projectId: string, results: any) {
    if (!results) return;

    const solar = results.solar;
    const battery = results.battery;
    const inverter = results.inverter;
    const cable = results.cable;

    if (!solar && !battery && !inverter && !cable) return;

    // Delete existing design rows
    await this.prisma.projectDesign.deleteMany({ where: { projectId } });

    await this.prisma.projectDesign.create({
      data: {
        projectId,
        pvModulePower: solar?.panelWattage ?? null,
        pvModuleQty: solar?.numberOfPanels ?? null,
        pvTotalPower: solar?.requiredPvSizeKw
          ? solar.requiredPvSizeKw * 1000
          : null,
        batteryCapacityAh: battery?.requiredCapacityAh ?? null,
        batteryVoltage: battery?.systemVoltage ?? null,
        batteryDepthOfDischarge: battery?.depthOfDischarge ?? null,
        batteryQty: battery?.numberOfBatteries ?? null,
        inverterPowerRating: inverter?.recommendedInverterKw
          ? inverter.recommendedInverterKw * 1000
          : null,
        inverterEfficiency: inverter?.efficiency ?? null,
        cableSizeMm2: cable?.recommendedCableSizeMm2 ?? null,
        fuseRatingAmps: cable?.fuseRatingAmps ?? null,
        circuitBreakerAmps: cable?.circuitBreakerAmps ?? null,
      },
    });
  }

  async create(userId: string, dto: CreateProjectDto) {
    if (!this.prisma.isConnected) {
      const mockProject = {
        id: `mock-project-${Date.now()}`,
        userId,
        name: dto.name,
        description: dto.description || null,
        location: dto.location || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        inputs: dto.inputs || null,
        results: dto.results || null,
      };
      return mockProject;
    }

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        location: dto.location,
        latitude: dto.latitude,
        longitude: dto.longitude,
        inputs: dto.inputs ?? undefined,
        results: dto.results ?? undefined,
        userId,
      },
    });

    // Sync relational tables
    await this.syncAppliances(project.id, dto.inputs);
    await this.syncDesign(project.id, dto.results);

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
          createdAt: new Date(),
          updatedAt: new Date(),
          appliances: [],
          designs: [],
          simulations: [],
          inputs: null,
          results: null,
        };
      }
      throw new NotFoundException('Project not found (Database offline)');
    }

    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: {
        appliances: { include: { appliance: true } },
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
        createdAt: new Date(),
        updatedAt: new Date(),
        inputs: dto.inputs || null,
        results: dto.results || null,
      };
    }

    await this.findOne(userId, id); // validates existence & ownership

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        location: dto.location,
        latitude: dto.latitude,
        longitude: dto.longitude,
        inputs: dto.inputs ?? undefined,
        results: dto.results ?? undefined,
      },
    });

    // Sync relational tables
    await this.syncAppliances(project.id, dto.inputs);
    await this.syncDesign(project.id, dto.results);

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
