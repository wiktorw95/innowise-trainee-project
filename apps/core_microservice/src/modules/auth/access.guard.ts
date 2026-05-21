import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service.js';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Access token missing');
    }

    try {
      const payload = await this.authService.validateToken(token);
      request['user'] = {
        id: payload.user.sub,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const cookies = request.cookies as
      | Record<string, string | undefined>
      | undefined;
    const tokenFromCookie = cookies?.['access_token'];
    if (tokenFromCookie) {
      return tokenFromCookie;
    }
    const [type, tokenFromHeader] =
      request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? tokenFromHeader : undefined;
  }
}
