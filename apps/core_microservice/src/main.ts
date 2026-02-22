import 'dotenv/config'; // Must be the very first line
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('Verifying DB URL:', process.env.DATABASE_URL);

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
// Replace bootstrap(); with:
bootstrap().catch((err) => {
  console.error('Application failed:', err);
  process.exit(1);
});
