import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('debug-db')
  async debugDb() {
    const time = await this.prisma.$queryRaw`SELECT NOW()`;
    return { status: 'ok', serverTime: time };
  }
}
