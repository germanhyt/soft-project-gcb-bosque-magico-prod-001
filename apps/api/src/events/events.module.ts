import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';
import { NotificacionesPanelController } from './notificaciones-panel.controller';
import { PanelNotificacionesRepository } from './panel-notificaciones.repository';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
      }),
    }),
  ],
  controllers: [NotificacionesPanelController],
  providers: [EventsGateway, EventsService, PanelNotificacionesRepository],
  exports: [EventsService],
})
export class EventsModule {}
