import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoginDto } from './dto/Login.dto.js';
import { SignUpDto } from './dto/SignUp.dto.js';
import { AxiosError } from 'axios';

export interface ValidatedUser {
  sub: string;
  jti?: string;
  exp?: number;
  iat?: number;
}
export interface ValidateTokenResponse {
  user: ValidatedUser;
}
export interface OAuthInitResponse {
  url: string;
}
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthErrorData {
  error?: string;
  message?: string;
}

export interface TokenCheckResult {
  status: 'valid' | 'invalid' | 'missing';
  error: string | null;
  user: ValidatedUser | null;
}

@Injectable()
export class AuthService {
  private readonly url = process.env.AUTH_SERVICE_URL
    ? `${process.env.AUTH_SERVICE_URL}/internal/auth`
    : 'http://localhost:3002/internal/auth';

  constructor(private readonly http: HttpService) {}

  private async req<T>(
    method: 'get' | 'post',
    path: string,
    data?: Record<string, unknown>,
  ): Promise<T> {
    try {
      const res = await firstValueFrom(
        this.http[method]<T>(`${this.url}${path}`, data),
      );
      return res.data;
    } catch (e: unknown) {
      const axiosError = e as AxiosError<AuthErrorData>;
      const data = axiosError.response?.data;

      throw new HttpException(
        data?.error || data?.message || 'Auth Error',
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  handleLogin = (creds: LoginDto) =>
    this.req<AuthTokens>(
      'post',
      '/login',
      creds as unknown as Record<string, unknown>,
    );

  handleSignUp = (dto: SignUpDto) =>
    this.req<AuthTokens>(
      'post',
      '/register',
      dto as unknown as Record<string, unknown>,
    );

  handleOAuthInit = () => this.req<OAuthInitResponse>('get', '/oauth/initiate');

  handleOAuthCallback = (code: string, redirect_uri?: string) =>
    this.req<AuthTokens>('post', '/oauth/exchange-code', {
      code,
      redirect_uri,
    });

  handleRefresh = (refresh_token_id: string, access_token?: string) =>
    this.req<AuthTokens>('post', '/refresh', {
      refresh_token_id,
      access_token,
    });

  handleLogout = (refresh_token: string, access_token?: string) =>
    this.req<{ message: string }>('post', '/logout', {
      refresh_token,
      access_token,
    });

  validateToken = (access_token: string) =>
    this.req<ValidateTokenResponse>('post', '/validate', { access_token });

  validateRefreshToken = (refresh_token: string) =>
    this.req<{ valid: boolean }>('post', '/validate-refresh', {
      refresh_token,
    });

  async getDetailedStatus(accessToken?: string, refreshToken?: string) {
    const [at, rt]: [TokenCheckResult, TokenCheckResult] = await Promise.all([
      this.check(accessToken ? () => this.validateToken(accessToken) : null),
      this.check(
        refreshToken ? () => this.validateRefreshToken(refreshToken) : null,
      ),
    ]);

    return { accessToken: at, refreshToken: rt, user: at.user };
  }

  private async check(
    fn: (() => Promise<unknown>) | null,
  ): Promise<TokenCheckResult> {
    if (!fn) return { status: 'missing', error: null, user: null };

    try {
      const res = await fn();

      return {
        status: 'valid',
        error: null,
        user: (res as { user?: ValidatedUser })?.user ?? null,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Verification failed';
      return { status: 'invalid', error: message, user: null };
    }
  }
}
