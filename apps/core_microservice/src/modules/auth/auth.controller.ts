import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  HttpException,
} from '@nestjs/common';
import type { Request, Response, CookieOptions } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/Login.dto.js';
import { SignUpDto } from './dto/SignUp.dto.js';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator.js';
import { AppLogger } from '@innogram/shared';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private finalizeAuth(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
    source: string,
  ) {
    const ctx = 'CoreGateway:Auth';
    AppLogger.success(
      `[${source}] Setting secure cookies and redirecting to feed`,
      ctx,
    );
    AppLogger.debug(
      `[${source}] Access Token: ${tokens.accessToken.slice(0, 20)}...`,
      null,
      ctx,
    );

    const isProd = process.env.NODE_ENV === 'production';
    const cookieBase: CookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
    };

    res.cookie('access_token', tokens.accessToken, {
      ...cookieBase,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      ...cookieBase,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    if (source === 'GOOGLE') {
      return res.redirect(`${clientUrl}/app/feed`);
    } else {
      return { success: true, message: 'Auth successful' };
    }
  }

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.finalizeAuth(
      res,
      await this.authService.handleLogin(dto),
      'LOGIN',
    );
  }

  @Public()
  @Post('signup')
  async signUp(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.finalizeAuth(
      res,
      await this.authService.handleSignUp(dto),
      'SIGNUP',
    );
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rt = req.cookies?.['refresh_token'] as string | undefined;
    const at = req.cookies?.['access_token'] as string | undefined;
    if (!rt) throw new HttpException('No refresh token', 401);
    return this.finalizeAuth(
      res,
      await this.authService.handleRefresh(rt, at),
      'REFRESH',
    );
  }

  @Public()
  @Get('login/google')
  async handleOAuthLogin(@Res() res: Response) {
    const { url } = await this.authService.handleOAuthInit();
    return res.redirect(url);
  }

  @Public()
  @Get('google/callback')
  @ApiExcludeEndpoint()
  async handleOAuthCallback(
    @Query('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const uri =
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/auth/google/callback';
    return this.finalizeAuth(
      res,
      await this.authService.handleOAuthCallback(code, uri),
      'GOOGLE',
    );
  }

  @Public()
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rt = req.cookies?.['refresh_token'] as string | undefined;
    const at = req.cookies?.['access_token'] as string | undefined;
    if (rt) await this.authService.handleLogout(rt, at);
    res.clearCookie('refresh_token');
    res.clearCookie('access_token');
    return { success: true };
  }

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Check current auth health' })
  check(
    @Req() req: Request,
    @Query('at') At?: string,
    @Query('rt') Rt?: string,
  ) {
    const { access_token, refresh_token } = req.cookies || {};

    return this.authService.getDetailedStatus(
      (At || access_token) as string | undefined,
      (Rt || refresh_token) as string | undefined,
    );
  }
}
