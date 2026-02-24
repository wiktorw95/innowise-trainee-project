import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('debug-db')
  async debugDb() {
    const dbData = await this.appService.getDbStatus();

    return {
      status: 'ok',
      ...dbData,
    };
  }
}
