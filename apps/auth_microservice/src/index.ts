import express, { RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
dotenv.config();
import passport from 'passport';
import {
  register,
  login,
  refresh,
  logout,
} from './controllers/auth.controller';
import { authenticate } from './middleware/auth.middleware';
import { generateTokens } from './utils/jwt';
import { redis } from './config/redis';
import './config/passport';
import axios from 'axios';

const app = express();
const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:3001/api';

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(passport.initialize());

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post(
  '/logout',
  authenticate as RequestHandler,
  logout as RequestHandler,
);

router.post('/validate', authenticate as RequestHandler, (req, res) => {
  res.json({ valid: true, user: req.user });
});

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    const googleUser = req.user as { googleId: string; email: string };

    try {
      let user = null;
      try {
        const coreResponse = await axios.get(
          `${CORE_API_URL}/users/email/${googleUser.email}`
        );
        user = coreResponse.data;
      } catch (err: any) {
        if (err.response?.status !== 404) throw err;
      }

      if (!user) {
        const createResponse = await axios.post(`${CORE_API_URL}/users`, {
          email: googleUser.email,
          password: 'OAUTH_PROVIDER',
          profile: { create: { username: googleUser.email.split('@')[0] } },
        });
        user = createResponse.data;
      }

      const tokens = generateTokens(user.id);

      await redis.set(
        `refresh_token:${user.id}`,
        tokens.refreshToken,
        'EX',
        7 * 24 * 60 * 60
      );

      res.redirect(
        `http://localhost:3000/auth-success?token=${tokens.accessToken}`
      );
    } catch (error) {
      console.error('OAuth Callback Error:', error);
      res.redirect('http://localhost:3000/login?error=oauth_failed');
    }
  }
);

app.use('/auth', router);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Auth Microservice Listening on PORT: ${PORT}`);
});
