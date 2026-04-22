import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Observable, tap } from 'rxjs';

const logger = new Logger('HTTP');

export const expressLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { method, url } = req;
  const body = req.body as Record<string, unknown>;
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.log(`${method} ${url} ${res.statusCode} - ${duration}ms`);
    if (['POST', 'PUT'].includes(method)) {
      console.log(`   Body: ${JSON.stringify(body)}`);
    }
  });
  next();
};

@Injectable()
export class NestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap((data: unknown) => {
        const duration = Date.now() - startTime;
        logger.log(
          `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`,
        );

        // ✅ Only log data if it's NOT a circular system object
        if (data && typeof data === 'object') {
          // Check if it's a 'ServerResponse' or similar system object
          const constructorName = data.constructor?.name;
          if (
            constructorName === 'ServerResponse' ||
            constructorName === 'OutgoingMessage'
          ) {
            return; // Skip logging the internal Express response object
          }

          console.log('   Response Data:', data);
        } else if (data !== undefined) {
          console.log('   Response Data:', data);
        }
      }),
    );
  }
}
