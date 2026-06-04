import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ADMIN_ONLY_KEY } from './decorators/admin-only.decorator';
import { PERMISSIONS_KEY } from './decorators/require-permissions.decorator';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import {
  PERMISO_ADMIN,
  PERMISO_MANAGE,
  PERMISO_VIEW,
} from './constants/permisos';
import type { JwtPayload } from './types/jwt-payload';

/** Admin implica manage y view; manage implica view. */
function permisosEfectivos(permisos: string[]): string[] {
  const set = new Set(permisos);
  if (set.has(PERMISO_ADMIN)) {
    set.add(PERMISO_MANAGE);
    set.add(PERMISO_VIEW);
  } else if (set.has(PERMISO_MANAGE)) {
    set.add(PERMISO_VIEW);
  }
  return [...set];
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.config.get<string>('AUTH_DISABLED') === 'true') {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    let required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) {
      const adminOnly = this.reflector.getAllAndOverride<boolean>(
        ADMIN_ONLY_KEY,
        [context.getHandler(), context.getClass()],
      );
      const method =
        context.switchToHttp().getRequest<{ method?: string }>().method ??
        'GET';
      if (adminOnly) {
        required = [PERMISO_ADMIN, PERMISO_MANAGE];
      } else if (method === 'GET' || method === 'HEAD') {
        required = [PERMISO_VIEW];
      } else {
        required = [PERMISO_MANAGE];
      }
    }

    const req = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Sin permisos');
    }

    const efectivos = permisosEfectivos(user.permisos);
    const tiene = required.some((p) => efectivos.includes(p));
    if (!tiene) {
      throw new ForbiddenException('Permiso insuficiente');
    }
    return true;
  }
}
