import { Router, Request, Response } from 'express';
import { AuthService } from '../service/auth.service.js';

export class AuthRoutes {
  public router = Router();

  constructor(private authService: AuthService) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/login', this.login);
    this.router.post('/validate', this.validate);
    this.router.post('/validate-refresh', this.validateRefresh);
    this.router.post('/refresh', this.refreshTokens);
    this.router.post('/logout', this.handleLogout);
    this.router.get('/oauth/initiate', this.initiateOAuthFlow);
    this.router.post('/oauth/exchange-code', this.exchangeCodeForTokens);
    this.router.post('/register', this.register);
  }

  private getClientInfo(req: Request) {
    const ipAddress = (req.headers['x-forwarded-for'] ||
      req.ip ||
      '') as string;
    const userAgent = req.headers['user-agent'];
    return { ipAddress, userAgent };
  }

  private login = async (req: Request, res: Response) => {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req);
      res
        .status(200)
        .json(
          await this.authService.authenticateUser(
            req.body,
            ipAddress,
            userAgent
          )
        );
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  private validate = async (req: Request, res: Response) => {
    const user = await this.authService.validateToken(req.body.access_token);
    res.status(200).json({ valid: true, user });
  };

  private validateRefresh = async (req: Request, res: Response) => {
    try {
      const valid = await this.authService.validateRefreshToken(
        req.body.refresh_token
      );
      res.status(200).json(valid);
    } catch (error: any) {
      res.status(401).json({ valid: false, error: error.message });
    }
  };

  private refreshTokens = async (req: Request, res: Response) => {
    try {
      const { refresh_token_id, access_token } = req.body;
      const { ipAddress, userAgent } = this.getClientInfo(req);

      if (!refresh_token_id)
        throw new Error('No refresh token provided in body');

      res
        .status(200)
        .json(
          await this.authService.processRefreshToken(
            refresh_token_id,
            access_token,
            ipAddress,
            userAgent
          )
        );
    } catch (error: any) {
      res
        .status(401)
        .json({ message: 'Token refresh failed', error: error.message });
    }
  };

  private handleLogout = async (req: Request, res: Response) => {
    try {
      const { refresh_token, access_token } = req.body;
      await this.authService.logout(refresh_token, access_token);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  private initiateOAuthFlow = async (_req: Request, res: Response) => {
    try {
      res.status(200).json({ url: await this.authService.initiateOAuthFlow() });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to initiate OAuth' });
    }
  };

  private exchangeCodeForTokens = async (req: Request, res: Response) => {
    try {
      const { code, redirect_uri } = req.body;
      const { ipAddress, userAgent } = this.getClientInfo(req);

      res
        .status(200)
        .json(
          await this.authService.exchangeCodeForTokens(
            code,
            redirect_uri,
            ipAddress,
            userAgent
          )
        );
    } catch (error: any) {
      res
        .status(401)
        .json({ error: 'OAuth exchange failed', details: error.message });
    }
  };

  private register = async (req: Request, res: Response) => {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req);
      res
        .status(201)
        .json(
          await this.authService.registerUser(req.body, ipAddress, userAgent)
        );
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
