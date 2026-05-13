import { Router, Request, Response, NextFunction } from 'express';
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

  private login = async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (error) {
      next(error);
    }
  };

  private validate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = await this.authService.validateToken(req.body.access_token);
      res.status(200).json({ valid: true, user });
    } catch (error) {
      next(error);
    }
  };

  private validateRefresh = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const valid = await this.authService.validateRefreshToken(
        req.body.refresh_token
      );
      res.status(200).json(valid);
    } catch (error) {
      next(error);
    }
  };

  private refreshTokens = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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
    } catch (error) {
      next(error);
    }
  };

  private handleLogout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { refresh_token, access_token } = req.body;
      await this.authService.logout(refresh_token, access_token);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  };

  private initiateOAuthFlow = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      res.status(200).json({ url: await this.authService.initiateOAuthFlow() });
    } catch (error) {
      next(error);
    }
  };

  private exchangeCodeForTokens = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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
    } catch (error) {
      next(error);
    }
  };

  private register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { ipAddress, userAgent } = this.getClientInfo(req);
      res
        .status(201)
        .json(
          await this.authService.registerUser(req.body, ipAddress, userAgent)
        );
    } catch (error) {
      next(error);
    }
  };
}
