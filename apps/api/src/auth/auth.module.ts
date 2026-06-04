import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { UsuariosPanelController } from './presentation/usuarios-panel.controller';
import { ActualizarUsuarioPanelUseCase } from './use-cases/actualizar-usuario-panel.use-case';
import { CrearUsuarioPanelUseCase } from './use-cases/crear-usuario-panel.use-case';
import { ListarUsuariosPanelUseCase } from './use-cases/listar-usuarios-panel.use-case';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { PermissionsGuard } from './permissions.guard';
import { UsuariosRepository } from './infrastructure/usuarios.repository';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = config.get<string>('JWT_EXPIRES_IN') ?? '8h';
        return {
          secret: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
          signOptions: { expiresIn: expiresIn as `${number}h` },
        };
      },
    }),
  ],
  controllers: [AuthController, UsuariosPanelController],
  providers: [
    AuthService,
    UsuariosRepository,
    ListarUsuariosPanelUseCase,
    CrearUsuarioPanelUseCase,
    ActualizarUsuarioPanelUseCase,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
