import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { RedisRepository } from '../repository/redis.repository.js';
import { PrismaService } from '@innogram/shared';
import { ILoginPayload, ISignUpPayload } from '@innogram/types';

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
    return { accessToken, refreshToken };
  }

  async authenticateUser(
    { email, password }: ILoginPayload,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await this.prisma.account.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      throw new HttpError(401, 'Invalid credentials');
    return this.issueTokens(user.userId, ipAddress, userAgent);
  }

  async validateToken(token: string) {
    const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;
    if (await this.redisRepo.isAccessTokenBlacklisted(decoded.jti!))
      throw new Error('Token blacklisted');
    return decoded;
  }

  async validateRefreshToken(token: string) {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET!) as JwtPayload;
    if (await this.redisRepo.isRefreshTokenBlacklisted(decoded.jti!)) {
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
    const decoded = jwt.verify(oldToken, JWT_REFRESH_SECRET!) as JwtPayload;
    const oldJti = decoded.jti!;

    const session = await this.redisRepo.findSessionByTokenId(oldJti);
    if (!session) throw new Error('Invalid session');

    if (await this.redisRepo.isRefreshTokenBlacklisted(oldJti)) {
      throw new Error('Token already used and blacklisted');
    }

    const tokens = await this.issueTokens(session.userId, ipAddress, userAgent);

    await this.redisRepo.deleteSession(oldJti);
    await this.redisRepo.blacklistRefreshToken(oldJti, 60);

    if (oldAccessToken) {
      try {
        const decodedAccess = jwt.decode(oldAccessToken) as JwtPayload;
        const ttl = (decodedAccess?.exp || 0) - Math.floor(Date.now() / 1000);
        if (decodedAccess?.jti && ttl > 0) {
          await this.redisRepo.blacklistAccessToken(decodedAccess.jti, ttl);
        }
      } catch (e) {
        /* ignore invalid tokens here */
      }
    }

    return tokens;
  }

  async exchangeCodeForTokens(
    code: string,
    providedRedirectUri?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const {
      GOOGLE_CLIENT_ID: clientId,
      GOOGLE_CLIENT_SECRET: clientSecret,
      GOOGLE_CALLBACK_URL,
    } = process.env;
    const redirectUri = providedRedirectUri || GOOGLE_CALLBACK_URL;

    if (!clientId || !clientSecret || !redirectUri)
      throw new HttpError(500, 'Missing OAuth env variables');

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

    if (!tokenRes.ok)
      throw new HttpError(
        401,
        `Google Token Exchange Failed: ${await tokenRes.text()}`
      );

    const profileRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${(await tokenRes.json()).access_token}`,
        },
      }
    );
    const profile = await profileRes.json();

    const account = await this.prisma.account.findUnique({
      where: { email: profile.email },
    });

    if (!account) {
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
      return this.issueTokens(newUserId, ipAddress, userAgent);
    }

    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        last_login_at: new Date(),
        provider_id: account.provider_id || profile.id,
        provider: account.provider === 'local' ? 'google' : account.provider,
      },
    });
    return this.issueTokens(account.userId, ipAddress, userAgent);
  }

  async registerUser(
    dto: ISignUpPayload,
    ipAddress?: string,
    userAgent?: string
  ) {
    const { email, password, username, displayName, birthday, profileImage } =
      dto;

    const parsedBirthday = new Date(birthday);
    if (isNaN(parsedBirthday.getTime())) {
      throw new HttpError(400, 'Invalid birthday date format');
    }

    const [existingAccount, existingProfile] = await Promise.all([
      this.prisma.account.findUnique({ where: { email } }),
      this.prisma.profile.findUnique({ where: { username } }),
    ]);
    if (existingAccount || existingProfile) {
      throw new HttpError(409, 'Email or Username already taken');
    }

    const newUserId = uuidv4();
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
    return this.issueTokens(newUserId, ipAddress, userAgent);
  }

  async logout(refreshTokenId: string, accessToken?: string) {
    await this.redisRepo.deleteSession(refreshTokenId);
    if (!accessToken) return;
    try {
      const decoded = jwt.decode(accessToken) as JwtPayload;
      const ttl = (decoded?.exp || 0) - Math.floor(Date.now() / 1000);
      if (decoded?.jti && ttl > 0)
        await this.redisRepo.blacklistAccessToken(decoded.jti, ttl);
    } catch (e) {
      /* empty */
    }
  }

  async initiateOAuthFlow(providedRedirectUri?: string) {
    const uri = providedRedirectUri || process.env.GOOGLE_CALLBACK_URL;
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(uri!)}&response_type=code&scope=email profile`;
  }
}
