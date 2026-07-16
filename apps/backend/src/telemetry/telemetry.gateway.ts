import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'telemetry',
})
export class TelemetryGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TelemetryGateway.name);
  private deviceRooms = new Map<string, Set<string>>(); // deviceId -> socketIds

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to telemetry namespace: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up device subscriptions
    for (const [deviceId, socketIds] of this.deviceRooms.entries()) {
      if (socketIds.delete(client.id)) {
        if (socketIds.size === 0) {
          this.deviceRooms.delete(deviceId);
        }
      }
    }
  }

  @SubscribeMessage('subscribeDevice')
  handleSubscribe(client: Socket, deviceId: string) {
    client.join(deviceId);
    if (!this.deviceRooms.has(deviceId)) {
      this.deviceRooms.set(deviceId, new Set());
    }
    this.deviceRooms.get(deviceId)?.add(client.id);
    this.logger.log(
      `Client ${client.id} subscribed to device telemetry: ${deviceId}`,
    );
    return { status: 'subscribed', deviceId };
  }

  @SubscribeMessage('unsubscribeDevice')
  handleUnsubscribe(client: Socket, deviceId: string) {
    client.leave(deviceId);
    this.deviceRooms.get(deviceId)?.delete(client.id);
    this.logger.log(
      `Client ${client.id} unsubscribed from device telemetry: ${deviceId}`,
    );
    return { status: 'unsubscribed', deviceId };
  }

  @OnEvent('telemetry.ingested')
  handleTelemetryIngested(payload: any) {
    // Broadcast to clients in the device room
    this.server.to(payload.deviceId).emit('realtimeTelemetry', payload);
  }
}
