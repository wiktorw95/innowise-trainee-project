import * as dotenv from 'dotenv';
import * as path from 'path';

// This path targets the .env inside apps/core_microservice
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Ensure this is NOT undefined before the app starts
  console.log('Verifying DB URL:', process.env.DATABASE_URL);

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();