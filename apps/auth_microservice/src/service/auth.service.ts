import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { RedisRepository } from '../repository/redis.repository.js';
import { ILoginPayload, ISignUpPayload } from '@innogram/types';
import { PrismaService, AppLogger } from '@innogram/shared';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error(
    'FATAL ERROR: JWT secrets are not defined in environment variables.'
  );
}

export class AuthService {
  constructor(
    private redisRepo: RedisRepository,
    private prisma: PrismaService
  ) {}

  private async issueTokens(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const ctx = 'AuthService:IssueTokens';
    AppLogger.debug(
      `Generating new token pair for user ID: ${userId}`,
      { ipAddress },
      ctx
    );
    const jtiAccess = uuidv4(),
      jtiRefresh = uuidv4();
    const accessToken = jwt.sign({ sub: userId, jti: jtiAccess }, JWT_SECRET!, {
      expiresIn: '15m',
    });
    const refreshToken = jwt.sign(
      { sub: userId, jti: jtiRefresh },
      JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    await this.redisRepo.storeSession(jtiRefresh, {
      userId,
      ipAddress,
      userAgent,
    });

    AppLogger.success(
      `Successfully issued and stored tokens for user ID: ${userId}`,
      ctx
    );
    return { accessToken, refreshToken };
  }

  async authenticateUser(
    { email, password }: ILoginPayload,
    ipAddress?: string,
    userAgent?: string
  ) {
    const ctx = 'AuthService:Login';
    AppLogger.info(`Login attempt initiated for email: ${email}`, ctx);

    const user = await this.prisma.account.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      AppLogger.warn(
        `Failed login attempt for email: ${email} - Invalid credentials`,
        ctx
      );
      throw new HttpError(401, 'Invalid credentials');
    }
    AppLogger.success(`Successful login for email: ${email}`, ctx);
    return this.issueTokens(user.userId, ipAddress, userAgent);
  }

  async validateToken(token: string) {
    const ctx = 'AuthService:ValidateAccess';
    AppLogger.debug('Validating access token...', null, ctx);
    const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;
    if (await this.redisRepo.isAccessTokenBlacklisted(decoded.jti!)) {
      AppLogger.warn(
        `Token validation failed: Access token (jti: ${decoded.jti}) is blacklisted`,
        ctx
      );
      throw new Error('Token blacklisted');
    }
    return decoded;
  }

  async validateRefreshToken(token: string) {
    const ctx = 'AuthService:ValidateRefresh';
    AppLogger.debug('Validating refresh token...', null, ctx);
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET!) as JwtPayload;
    if (await this.redisRepo.isRefreshTokenBlacklisted(decoded.jti!)) {
      AppLogger.warn(
        `Token validation failed: Refresh token (jti: ${decoded.jti}) is blacklisted`,
        ctx
      );
      throw new Error('Refresh token blacklisted');
    }
    return decoded;
  }
  async processRefreshToken(
    oldToken: string,
    oldAccessToken?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const ctx = 'AuthService:Refresh';
    AppLogger.info('Processing token refresh request', ctx);
    const decoded = jwt.verify(oldToken, JWT_REFRESH_SECRET!) as JwtPayload;
    const oldJti = decoded.jti!;

    const session = await this.redisRepo.findSessionByTokenId(oldJti);
    if (!session) {
      AppLogger.warn(
        `Refresh failed: No active session found for token jti: ${oldJti}`,
        ctx
      );
      throw new Error('Invalid session');
    }

    if (await this.redisRepo.isRefreshTokenBlacklisted(oldJti)) {
      AppLogger.warn(
        `Refresh failed: Token (jti: ${oldJti}) was already used/blacklisted. Possible replay attack!`,
        ctx
      );
      throw new Error('Token already used and blacklisted');
    }
    AppLogger.debug(
      `Issuing replacement tokens for user ID: ${session.userId}`,
      null,
      ctx
    );
    const tokens = await this.issueTokens(session.userId, ipAddress, userAgent);

    await this.redisRepo.deleteSession(oldJti);
    await this.redisRepo.blacklistRefreshToken(oldJti, 60);

    if (oldAccessToken) {
      try {
        const decodedAccess = jwt.decode(oldAccessToken) as JwtPayload;
        const ttl = (decodedAccess?.exp || 0) - Math.floor(Date.now() / 1000);
        if (decodedAccess?.jti && ttl > 0) {
          await this.redisRepo.blacklistAccessToken(decodedAccess.jti, ttl);
          AppLogger.debug(
            `Blacklisted old access token (jti: ${decodedAccess.jti})`,
            null,
            ctx
          );
        }
      } catch (e) {
        AppLogger.debug(
          'Could not blacklist old access token (likely already expired/invalid)',
          e,
          ctx
        );
      }
    }

    AppLogger.success('Tokens refreshed successfully', ctx);
    return tokens;
  }

  async exchangeCodeForTokens(
    code: string,
    providedRedirectUri?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const ctx = 'AuthService:OAuthExchange';
    AppLogger.info('Initiating Google OAuth code exchange', ctx);
    const {
      GOOGLE_CLIENT_ID: clientId,
      GOOGLE_CLIENT_SECRET: clientSecret,
      GOOGLE_CALLBACK_URL,
    } = process.env;
    const redirectUri = providedRedirectUri || GOOGLE_CALLBACK_URL;

    if (!clientId || !clientSecret || !redirectUri) {
      AppLogger.error('Missing Google OAuth environment variables', null, ctx);
      throw new HttpError(500, 'Missing OAuth env variables');
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      AppLogger.error('Google Token Exchange Failed', errorText, ctx);
      throw new HttpError(401, `Google Token Exchange Failed: ${errorText}`);
    }

    const profileRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${(await tokenRes.json()).access_token}`,
        },
      }
    );
    const profile = await profileRes.json();
    AppLogger.info(
      `Successfully fetched Google profile for email: ${profile.email}`,
      ctx
    );

    const account = await this.prisma.account.findUnique({
      where: { email: profile.email },
    });

    if (!account) {
      AppLogger.info(
        `No existing account found for ${profile.email}. Creating new OAuth user...`,
        ctx
      );
      const newUserId = uuidv4();
      await this.prisma.user.create({
        data: {
          id: newUserId,
          created_by: newUserId,
          accounts: {
            create: {
              email: profile.email,
              password_hash: '',
              provider: 'google',
              provider_id: profile.id,
              last_login_at: new Date(),
              created_by: newUserId,
            },
          },
          profile: {
            create: {
              username:
                profile.email.split('@')[0] + Math.floor(Math.random() * 1000),
              displayName: profile.name || 'OAuth User',
              birthday: new Date('2000-01-01'),
              avatarUrl: profile.picture,
              created_by: newUserId,
            },
          },
        },
      });

      AppLogger.success(
        `Successfully created new OAuth user: ${profile.email}`,
        ctx
      );
      return this.issueTokens(newUserId, ipAddress, userAgent);
    }

    AppLogger.debug(
      `Found existing account for ${profile.email}. Updating login stats...`,
      null,
      ctx
    );
    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        last_login_at: new Date(),
        provider_id: account.provider_id || profile.id,
        provider: account.provider === 'local' ? 'google' : account.provider,
      },
    });
    AppLogger.success(
      `Successfully authenticated existing OAuth user: ${profile.email}`,
      ctx
    );
    return this.issueTokens(account.userId, ipAddress, userAgent);
  }

  async registerUser(
    dto: ISignUpPayload,
    ipAddress?: string,
    userAgent?: string
  ) {
    const ctx = 'AuthService:Register';
    const { email, password, username, displayName, birthday, profileImage } =
      dto;
    AppLogger.info(`Starting registration process for email: ${email}`, ctx);

    const parsedBirthday = new Date(birthday);
    if (isNaN(parsedBirthday.getTime())) {
      AppLogger.warn(
        `Registration failed: Invalid birthday format for ${email}`,
        ctx
      );
      throw new HttpError(400, 'Invalid birthday date format');
    }

    const [existingAccount, existingProfile] = await Promise.all([
      this.prisma.account.findUnique({ where: { email } }),
      this.prisma.profile.findUnique({ where: { username } }),
    ]);
    if (existingAccount || existingProfile) {
      AppLogger.warn(
        `Registration failed: Conflict (Email or Username taken) - Email: ${email}, Username: ${username}`,
        ctx
      );
      throw new HttpError(409, 'Email or Username already taken');
    }

    const newUserId = uuidv4();
    AppLogger.debug(
      `Creating new user records in database for UUID: ${newUserId}`,
      null,
      ctx
    );
    await this.prisma.user.create({
      data: {
        id: newUserId,
        role: 'User',
        created_by: newUserId,
        accounts: {
          create: {
            email,
            password_hash: await bcrypt.hash(password, 10),
            provider: 'local',
            provider_id: email,
            last_login_at: new Date(),
            created_by: newUserId,
          },
        },
        profile: {
          create: {
            username,
            displayName,
            birthday: parsedBirthday,
            avatarUrl: profileImage || null,
            created_by: newUserId,
          },
        },
      },
    });
    AppLogger.success(`Successfully registered new user: ${email}`, ctx);
    return this.issueTokens(newUserId, ipAddress, userAgent);
  }

  async logout(refreshTokenId: string, accessToken?: string) {
    const ctx = 'AuthService:Logout';
    AppLogger.info(
      `Processing logout for refresh token session: ${refreshTokenId}`,
      ctx
    );
    await this.redisRepo.deleteSession(refreshTokenId);
    AppLogger.debug('Deleted session from Redis', null, ctx);
    if (!accessToken) {
      AppLogger.success(
        'Logout complete (No access token provided to blacklist)',
        ctx
      );
      return;
    }
    try {
      const decoded = jwt.decode(accessToken) as JwtPayload;
      const ttl = (decoded?.exp || 0) - Math.floor(Date.now() / 1000);
      if (decoded?.jti && ttl > 0) {
        await this.redisRepo.blacklistAccessToken(decoded.jti, ttl);
        AppLogger.debug(
          `Blacklisted access token (jti: ${decoded.jti})`,
          null,
          ctx
        );
      }
    } catch (e) {
      AppLogger.warn(
        'Failed to parse/blacklist access token during logout',
        ctx
      );
    }
    AppLogger.success('Logout complete', ctx);
  }

  async initiateOAuthFlow(providedRedirectUri?: string) {
    const ctx = 'AuthService:OAuthInit';
    const uri = providedRedirectUri || process.env.GOOGLE_CALLBACK_URL;
    AppLogger.debug(
      `Generating Google OAuth URL with redirect URI: ${uri}`,
      null,
      ctx
    );
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(uri!)}&response_type=code&scope=email profile`;
  }
}
