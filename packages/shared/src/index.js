var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Global, Module } from '@nestjs/common';
import PrismaService from './prisma/prisma.service.js';
import { AppLogger } from './utils/logger.js';
let SharedPrismaModule = class SharedPrismaModule {
};
SharedPrismaModule = __decorate([
    Global(),
    Module({
        providers: [PrismaService, AppLogger],
        exports: [PrismaService, AppLogger],
    })
], SharedPrismaModule);
export { SharedPrismaModule };
export * from './prisma/prisma.service.js';
export { default as PrismaService } from './prisma/prisma.service.js';
export * from '../generated/prisma/client.js';
export * from './utils/logger.js';
//# sourceMappingURL=index.js.map