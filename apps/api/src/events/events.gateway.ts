import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/types/jwt-payload';
import type { BosquePanelEvent } from './panel-event.types';

const PANEL_ROOM = 'panel-operadores';

@Injectable()
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  path: '/socket.io',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    if (this.config.get<string>('AUTH_DISABLED') === 'true') {
      await client.join(PANEL_ROOM);
      return;
    }

    const token =
      (client.handshake.auth?.token as string | undefined) ??
      client.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
      });
      client.data.user = payload;
      await client.join(PANEL_ROOM);
      this.logger.debug(`Panel conectado: ${payload.email}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as JwtPayload | undefined;
    if (user?.email) {
      this.logger.debug(`Panel desconectado: ${user.email}`);
    }
  }

  emitPanelEvent(event: BosquePanelEvent) {
    this.server?.to(PANEL_ROOM).emit('bosque:event', event);
  }
}
