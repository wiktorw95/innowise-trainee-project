import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Guard Failed: No Bearer Token found in headers');
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      const secret = process.env.JWT_SECRET || 'super-secret-key';

      const payload = await this.jwtService.verifyAsync(token, {
        secret: secret,
      });
      console.log('Guard Success! Decoded Payload:', payload);

      request.user = payload;

      return true;
    } catch (error: any) {
      console.log('Guard Failed: JWT Verification Error -', error.message);
      throw new UnauthorizedException('Invalid token');
    }
  }
}