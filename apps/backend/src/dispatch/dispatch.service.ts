import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SetPlantRuleDto, TriggerOverrideDto } from './dto/dispatch.dto';
import { ModbusAdapter } from './adapters/modbus.adapter';
import { MqttAdapter } from './adapters/mqtt.adapter';
import { RestAdapter } from './adapters/rest.adapter';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  // In-Memory Database Fallbacks
  private static mockRules: any[] = [];
  private static mockPlans: any[] = [];
  private static mockHistories: any[] = [];
  private static mockConstraints: any[] = [];
  private static mockCommands: any[] = [];
  private static mockEvents: any[] = [];
  private static mockSystemEvents: any[] = [];

  // Live Simulated State (updated via timer ticks)
  private static liveSolarKw = 1680.0;
  private static liveLoadKw = 1120.0;
  private static liveBatterySoc = 72.0;
  private static liveBatteryKw = 250.0; // Positive = charging, negative = discharging
  private static liveGridKw = 260.0; // Positive = exporting, negative = importing
  private static liveCurtailmentKw = 0.0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly modbus: ModbusAdapter,
    private readonly mqtt: MqttAdapter,
    private readonly rest: RestAdapter,
  ) {
    this.startGridSimulationLoop();
  }

  private startGridSimulationLoop() {
    setInterval(() => {
      // Simulate typical solar generation noise + diurnal cycles
      const baseSolar = 1500 + Math.sin(Date.now() / 60000) * 300;
      DispatchService.liveSolarKw = Math.max(0, baseSolar);

      // Simulate consumer demand noise
      const baseLoad = 1100 + Math.cos(Date.now() / 80000) * 150;
      DispatchService.liveLoadKw = Math.max(100, baseLoad);

      // Execute dynamic dispatch logic based on the active rules
      this.evaluateAutomaticDispatchPlan();
    }, 4000);
  }

  private evaluateAutomaticDispatchPlan() {
    const rules = this.getActiveRulesInMemory();
    const solar = DispatchService.liveSolarKw;
    const load = DispatchService.liveLoadKw;
    let soc = DispatchService.liveBatterySoc;

    let dispatchPlan = ['CRITICAL', 'CONSUMERS', 'BATTERY', 'GRID', 'CURTAIL'];
    if (rules && rules.priorityOrder) {
      dispatchPlan = Array.isArray(rules.priorityOrder)
        ? rules.priorityOrder
        : JSON.parse(rules.priorityOrder as any);
    }

    let remainingPower = solar;
    let batteryPower = 0;
    let gridExport = 0;
    let curtailed = 0;

    // Loop through the operator priorities
    for (const stage of dispatchPlan) {
      if (stage === 'CRITICAL' || stage === 'CONSUMERS') {
        remainingPower = Math.max(0, remainingPower - load);
      } else if (stage === 'BATTERY') {
        if (remainingPower > 0 && soc < 100) {
          // Charge battery with surplus
          const maxCharge = Math.min(remainingPower, 500); // 500kW max charge limit
          batteryPower = maxCharge;
          remainingPower -= maxCharge;
          soc = Math.min(100, soc + 0.1);
        } else if (remainingPower === 0 && soc > (rules?.batteryMinSoc ?? 20)) {
          // Discharge battery to support load
          const deficit = load - solar;
          if (deficit > 0) {
            const maxDischarge = Math.min(deficit, 500);
            batteryPower = -maxDischarge;
            soc = Math.max(0, soc - 0.08);
          }
        }
      } else if (stage === 'GRID') {
        if (remainingPower > 0 && rules?.gridExportAllowed) {
          // Export surplus
          const maxAllowed = rules?.maxExportPowerKw ?? 500;
          gridExport = Math.min(remainingPower, maxAllowed);
          remainingPower -= gridExport;
        }
      } else if (stage === 'CURTAIL') {
        if (remainingPower > 0) {
          // Curtailed power (excess generation curtailed by inverter)
          curtailed = remainingPower;
          remainingPower = 0;
        }
      }
    }

    // Update live indicators
    DispatchService.liveBatterySoc = soc;
    DispatchService.liveBatteryKw = batteryPower;
    DispatchService.liveGridKw = gridExport;
    DispatchService.liveCurtailmentKw = curtailed;

    // Save curtailment events if substantial curtailment occurs
    if (curtailed > 50 && DispatchService.mockEvents.length < 10) {
      DispatchService.mockEvents.push({
        id: `curtail-${Date.now()}`,
        plantId: 'plant-default-123',
        triggeredAt: new Date(),
        curtailedKw: curtailed,
        originalCapacityKw: solar,
        reason: 'AUTOMATIC_CURTAILMENT_EXPORT_CAP',
        status: 'ACTIVE',
      });
    }
  }

  private getActiveRulesInMemory() {
    if (DispatchService.mockRules.length === 0) {
      DispatchService.mockRules.push({
        id: 'rules-default-123',
        plantId: 'plant-default-123',
        maxExportPowerKw: 500.0,
        maxDailyExportKwh: 5000.0,
        batteryMinSoc: 20.0,
        batteryReserveSoc: 50.0,
        gridExportAllowed: true,
        gridImportAllowed: true,
        priorityOrder: ['CRITICAL', 'CONSUMERS', 'BATTERY', 'GRID', 'CURTAIL'],
        updatedAt: new Date(),
      });
    }
    return DispatchService.mockRules[0];
  }

  // ── RULE CONFIGURATION ─────────────────────────────────────────────────────
  async getPlantRules(plantId: string) {
    if (!this.prisma.isConnected) {
      this.getActiveRulesInMemory();
      return (
        DispatchService.mockRules.find((r) => r.plantId === plantId) || null
      );
    }
    return this.prisma.plantRule.findUnique({ where: { plantId } });
  }

  async setPlantRules(dto: SetPlantRuleDto, operatorId: string) {
    if (!this.prisma.isConnected) {
      this.getActiveRulesInMemory();
      let rule = DispatchService.mockRules.find(
        (r) => r.plantId === dto.plantId,
      );
      if (!rule) {
        rule = { id: `rule-${Date.now()}`, plantId: dto.plantId };
        DispatchService.mockRules.push(rule);
      }
      Object.assign(rule, dto, { updatedAt: new Date() });
      await this.auditLog.log('DERMS_RULE_SET', dto, operatorId);
      return rule;
    }

    const rule = await this.prisma.plantRule.upsert({
      where: { plantId: dto.plantId },
      update: {
        maxExportPowerKw: dto.maxExportPowerKw,
        maxDailyExportKwh: dto.maxDailyExportKwh,
        batteryMinSoc: dto.batteryMinSoc,
        batteryReserveSoc: dto.batteryReserveSoc,
        gridExportAllowed: dto.gridExportAllowed,
        gridImportAllowed: dto.gridImportAllowed,
        priorityOrder: dto.priorityOrder,
      },
      create: {
        plantId: dto.plantId,
        maxExportPowerKw: dto.maxExportPowerKw,
        maxDailyExportKwh: dto.maxDailyExportKwh,
        batteryMinSoc: dto.batteryMinSoc,
        batteryReserveSoc: dto.batteryReserveSoc,
        gridExportAllowed: dto.gridExportAllowed,
        gridImportAllowed: dto.gridImportAllowed,
        priorityOrder: dto.priorityOrder,
      },
    });

    await this.auditLog.log('DERMS_RULE_SET', dto, operatorId);
    return rule;
  }

  // ── TELEMETRY & DISPATCH OVERVIEW ──────────────────────────────────────────
  async getLiveDispatchOverview(plantId: string) {
    this.getActiveRulesInMemory();
    const rules = DispatchService.mockRules[0];
    return {
      plantId,
      liveGenerationKw: DispatchService.liveSolarKw,
      liveLoadKw: DispatchService.liveLoadKw,
      batterySocPercent: Math.round(DispatchService.liveBatterySoc),
      batteryKw: DispatchService.liveBatteryKw,
      gridKw: DispatchService.liveGridKw,
      curtailedKw: DispatchService.liveCurtailmentKw,
      curtailmentStatus:
        DispatchService.liveCurtailmentKw > 5.0 ? 'ACTIVE' : 'INACTIVE',
      rules,
    };
  }

  // ── SAFETY INTERLOCKS & COMMAND OVERRIDES ──────────────────────────────────
  async triggerOverride(
    dto: TriggerOverrideDto,
    operatorId: string,
    operatorRole: string,
  ) {
    const rules = this.getActiveRulesInMemory();
    const isAdmin = operatorRole === 'ADMIN' || operatorRole === 'SUPER_ADMIN';
    const params =
      typeof dto.parameters === 'string'
        ? JSON.parse(dto.parameters)
        : dto.parameters;

    const commandLog = {
      id: `cmd-${uuidv4()}`,
      plantId: dto.plantId,
      operatorId,
      commandType: dto.commandType,
      targetDevice: dto.targetDevice,
      parameters: params,
      status: 'PENDING',
      failureReason: null as string | null,
      timestamp: new Date(),
    };

    // ── SAFETY INTERLOCK VALIDATIONS ──
    if (dto.commandType === 'SET_BATTERY_CHARGE' && params.discharge) {
      const targetSoc = params.targetSoc ?? 0;

      // Safety rule check: cannot discharge below minimum SOC
      if (targetSoc < rules.batteryMinSoc && !isAdmin) {
        commandLog.status = 'BLOCKED';
        commandLog.failureReason = `Safety Interlock Triggered: Target SOC (${targetSoc}%) is below configured Min SOC (${rules.batteryMinSoc}%).`;
        DispatchService.mockCommands.push(commandLog);
        this.logSystemEvent(
          dto.plantId,
          'WARNING',
          commandLog.failureReason,
          'SAFETY',
        );
        throw new BadRequestException(commandLog.failureReason);
      }
    }

    if (dto.commandType === 'CURTAIL_INVERTER' && params.curtailKw) {
      if (params.curtailKw > rules.maxExportPowerKw && !isAdmin) {
        commandLog.status = 'BLOCKED';
        commandLog.failureReason = `Safety Interlock Triggered: Curtailment limit request (${params.curtailKw} kW) exceeds maximum plant export capacity (${rules.maxExportPowerKw} kW).`;
        DispatchService.mockCommands.push(commandLog);
        this.logSystemEvent(
          dto.plantId,
          'WARNING',
          commandLog.failureReason,
          'SAFETY',
        );
        throw new BadRequestException(commandLog.failureReason);
      }
    }

    // Bypass check for Admin Authority
    if (commandLog.status === 'PENDING') {
      commandLog.status = 'EXECUTED';
      this.logger.log(
        `Safety Interlock Passed. Command executed successfully. Admin Overrides: ${isAdmin}`,
      );

      // Apply changes to simulated system values
      if (dto.commandType === 'CURTAIL_INVERTER' && params.curtailKw) {
        DispatchService.liveCurtailmentKw = params.curtailKw;
        DispatchService.mockEvents.push({
          id: `curtail-${Date.now()}`,
          plantId: dto.plantId,
          triggeredAt: new Date(),
          curtailedKw: params.curtailKw,
          originalCapacityKw: DispatchService.liveSolarKw,
          reason: 'OPERATOR_OVERRIDE_CURTAILMENT',
          status: 'ACTIVE',
        });
      }

      if (dto.commandType === 'TRIGGER_SHUTDOWN') {
        DispatchService.liveSolarKw = 0.0;
        DispatchService.liveGridKw = 0.0;
        DispatchService.liveBatteryKw = 0.0;
        this.logSystemEvent(
          dto.plantId,
          'CRITICAL',
          'Emergency Shut-down triggered by operator.',
          'SAFETY',
        );
      }
    }

    if (!this.prisma.isConnected) {
      DispatchService.mockCommands.push(commandLog);
      await this.auditLog.log('DERMS_OVERRIDE_TRIGGER', commandLog, operatorId);
      return commandLog;
    }

    const command = await this.prisma.controlCommand.create({
      data: {
        plantId: dto.plantId,
        operatorId,
        commandType: dto.commandType,
        targetDevice: dto.targetDevice,
        parameters: params,
        status: commandLog.status,
        failureReason: commandLog.failureReason,
      },
    });

    await this.auditLog.log('DERMS_OVERRIDE_TRIGGER', command, operatorId);
    return command;
  }

  private logSystemEvent(
    plantId: string,
    severity: string,
    message: string,
    category: string,
  ) {
    DispatchService.mockSystemEvents.push({
      id: `sys-${Date.now()}`,
      plantId,
      severity,
      message,
      category,
      timestamp: new Date(),
    });
  }

  async getSafetyInterlockLogs(plantId: string) {
    this.getActiveRulesInMemory();
    // Return mock system warning events + safety block events
    const blocks = DispatchService.mockCommands.filter(
      (c) => c.plantId === plantId && c.status === 'BLOCKED',
    );
    const systemEvs = DispatchService.mockSystemEvents.filter(
      (e) => e.plantId === plantId,
    );

    return [
      ...blocks.map((b) => ({
        timestamp: b.timestamp,
        level: 'WARNING',
        category: 'SAFETY',
        message: `Command Blocked: ${b.commandType} on ${b.targetDevice}. Reason: ${b.failureReason}`,
      })),
      ...systemEvs.map((s) => ({
        timestamp: s.timestamp,
        level: s.severity,
        category: s.category,
        message: s.message,
      })),
    ].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  async getControlLogs(plantId: string) {
    if (!this.prisma.isConnected) {
      return DispatchService.mockCommands
        .filter((c) => c.plantId === plantId)
        .reverse();
    }
    return this.prisma.controlCommand.findMany({
      where: { plantId },
      orderBy: { timestamp: 'desc' },
      include: { operator: { select: { firstName: true, lastName: true } } },
    });
  }

  async getCurtailmentEvents(plantId: string) {
    if (!this.prisma.isConnected) {
      return DispatchService.mockEvents
        .filter((e) => e.plantId === plantId)
        .reverse();
    }
    return this.prisma.curtailmentEvent.findMany({
      where: { plantId },
      orderBy: { triggeredAt: 'desc' },
    });
  }

  async getGridConstraints(plantId: string) {
    if (!this.prisma.isConnected) {
      return [
        {
          id: 'const-1',
          constraintType: 'EXPORT_CAP',
          limitValue: 500.0,
          isActive: true,
        },
        {
          id: 'const-2',
          constraintType: 'GRID_VOLTAGE_MAX',
          limitValue: 245.0,
          isActive: true,
        },
      ];
    }
    return this.prisma.gridConstraint.findMany({ where: { plantId } });
  }
}
