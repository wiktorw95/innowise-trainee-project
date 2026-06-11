import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../../generated/prisma/client.js';
declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private configService?;
    constructor(configService?: ConfigService | undefined);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
export default PrismaService;
