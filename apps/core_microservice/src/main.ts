import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: 'unsafe-none' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: [
            "'self'",
            'https://accounts.google.com',
            'https://oauth2.googleapis.com',
          ],
          frameAncestors: ["'self'"],
        },
      },
    }),
  );

  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });


  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Innogram API')
    .setDescription('Innogram Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, document, {
    swaggerOptions: {
      withCredentials: true,
      persistAuthorization: false,
    },
  });
  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Core Service running on: http://localhost:3000`);
  console.log(`📖 Documentation: http://localhost:3000/api/docs`);
}
bootstrap().catch((err) => {
  console.error(' Error during bootstrap:', err);
  process.exit(1);
});
