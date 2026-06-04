import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { PERMISOS_PANEL_COMPLETO } from './constants/permisos';
import { UsuariosRepository } from './infrastructure/usuarios.repository';
import type { JwtPayload } from './types/jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  isAuthDisabled() {
    return this.config.get<string>('AUTH_DISABLED') === 'true';
  }

  async login(dto: LoginDto) {
    const user = await this.usuarios.findByEmail(dto.email);
    if (!user?.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.buildTokenResponse(user);
  }

  async me(userId: string) {
    const user = await this.usuarios.findById(userId);
    if (!user?.activo) {
      throw new UnauthorizedException('Usuario no disponible');
    }
    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      permisos: user.permisos,
    };
  }

  buildTokenResponse(user: {
    id: string;
    email: string;
    nombre: string;
    permisos: string[];
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      permisos: user.permisos,
    };
    const accessToken = this.jwt.sign(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        permisos: user.permisos,
      },
    };
  }

  async ensureAdminSeed() {
    const email = (
      this.config.get<string>('ADMIN_EMAIL') ?? 'admin@bosquemagico.test'
    )
      .toLowerCase()
      .trim();
    const password =
      this.config.get<string>('ADMIN_PASSWORD') ?? 'BosqueDev123!';
    const hash = await bcrypt.hash(password, 10);
    await this.usuarios.upsertAdmin({
      email,
      nombre: 'Administrador',
      passwordHash: hash,
      permisos: [...PERMISOS_PANEL_COMPLETO],
    });
  }
}
