import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import axios from 'axios';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { redis } from '../config/redis';
import { AuthRequest } from '../middleware/auth.middleware';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:3001/api';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const coreResponse = await axios.post(`${CORE_API_URL}/users`, {
      email,
      password: hashedPassword,
      profile: {
        create: { username: email.split('@')[0] },
      },
    });

    const newUser = coreResponse.data;

    res.status(201).json({
      message: 'User created successfully.',
      userId: newUser.id,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.response?.status === 409) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }
    console.error('Registration Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const coreResponse = await axios.get(
      `${CORE_API_URL}/users/email/${email}`
    );
    const user = coreResponse.data;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid Credentials' });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    await redis.set(
      `refresh_token:${user.id}`,
      refreshToken,
      'EX',
      7 * 24 * 60 * 60
    );

    res.json({ accessToken, refreshToken });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.response?.status === 404) {
      res.status(401).json({ error: 'Invalid Credentials' });
      return;
    }
    res.status(500).json({ error: 'Login failed' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyRefreshToken(refreshToken);

    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
    if (storedToken !== refreshToken) {
      res.status(401).json({ error: 'Refresh token failed.' });
      return;
    }

    const tokens = generateTokens(decoded.userId);
    await redis.set(
      `refresh_token:${decoded.userId}`,
      tokens.refreshToken,
      'EX',
      7 * 24 * 60 * 60
    );
    res.json(tokens);
  } catch {
    res.status(500).json({ error: 'Refresh token failed.' });
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (userId) {
      await redis.del(`refresh_token:${userId}`);
    }
    res.json({ message: 'Logged out successfully' });
  } catch {
    res.status(500).json({ error: 'Logout failed' });
  }
};
