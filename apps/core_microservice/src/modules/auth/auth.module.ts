import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'super-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class AuthModule {}
