import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthService } from './auth.service.js';
import { IS_PUBLIC_KEY } from './decorators/public.decorator.js';

export interface RequestWithUser extends Request {
  user: { id: string; email?: string };
}

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) throw new UnauthorizedException('Access token missing');

    try {
      const payload = await this.authService.validateToken(token);
      request['user'] = { id: payload.user.sub };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const cookies = request.cookies as
      | Record<string, string | undefined>
      | undefined;
    if (cookies?.['access_token']) return cookies['access_token'];

    const [type, tokenFromHeader] =
      request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? tokenFromHeader : undefined;
  }
}
