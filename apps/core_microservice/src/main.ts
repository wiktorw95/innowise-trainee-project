import 'dotenv/config'; // Must be the very first line
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Ensure this is NOT undefined before the app starts
  console.log('Verifying DB URL:', process.env.DATABASE_URL);

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
