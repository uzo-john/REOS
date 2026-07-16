import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelemetryService } from '../telemetry/telemetry.service';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly telemetryService: TelemetryService,
  ) {}

  onModuleInit() {
    const brokerUrl = this.configService.get<string>('MQTT_BROKER_URL');
    if (!brokerUrl) {
      this.logger.warn(
        'MQTT_BROKER_URL is not set. MQTT Telemetry subscriber disabled.',
      );
      return;
    }

    try {
      this.logger.log(`Connecting to MQTT broker at: ${brokerUrl}`);

      const username = this.configService.get<string>('MQTT_USERNAME');
      const password = this.configService.get<string>('MQTT_PASSWORD');
      const clientOptions: mqtt.IClientOptions = {
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 2000,
        ...(username && { username }),
        ...(password && { password }),
      };

      this.client = mqtt.connect(brokerUrl, clientOptions);

      this.client.on('connect', () => {
        this.logger.log('Connected to MQTT Broker successfully');
        // Subscribe to wildcard topic: reos/<deviceId>/telemetry
        const topic = 'reos/+/telemetry';
        this.client?.subscribe(topic, (err) => {
          if (err) {
            this.logger.error(
              `Failed to subscribe to MQTT topic ${topic}`,
              err.stack,
            );
          } else {
            this.logger.log(`Subscribed to MQTT topic ${topic}`);
          }
        });
      });

      this.client.on('message', async (topic, message) => {
        try {
          const parts = topic.split('/');
          const deviceId = parts[1];
          const payload = JSON.parse(message.toString());

          this.logger.debug(`MQTT received telemetry for device: ${deviceId}`);

          // Ingest telemetry into the platform database
          await this.telemetryService.ingest({
            ...payload,
            deviceId,
            rawPayload: payload,
          });
        } catch (err) {
          this.logger.error(
            `Error processing MQTT message: ${err.message}`,
            err.stack,
          );
        }
      });

      this.client.on('error', (err) => {
        this.logger.error('MQTT Client encountered an error', err.stack);
      });

      this.client.on('close', () => {
        this.logger.warn('MQTT connection closed');
      });
    } catch (error) {
      this.logger.error(
        `MQTT initialization failed: ${error.message}`,
        error.stack,
      );
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.logger.log('Disconnecting from MQTT Broker');
      this.client.end(true);
    }
  }
}
