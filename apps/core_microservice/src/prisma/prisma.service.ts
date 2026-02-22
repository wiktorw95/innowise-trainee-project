import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // 1. Create a connection pool using the driver directly
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // 2. Wrap it in the Prisma adapter
    const adapter = new PrismaPg(pool);

    // 3. Pass the adapter to the constructor
    // This satisfies the "non-empty options" requirement perfectly
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to PostgreSQL via Driver Adapter');
    } catch (error) {
      this.logger.error('Database connection failed', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}