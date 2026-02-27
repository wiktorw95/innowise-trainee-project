import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      await this.$executeRaw`SELECT 1`;
      this.logger.log(
        'Successfully connected to PostgreSQL via Driver Adapter',
      );
    } catch (error) {
      this.logger.error('Database connection failed', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
