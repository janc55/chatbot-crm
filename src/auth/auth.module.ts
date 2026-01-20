import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        UsersModule,
        MailModule,
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'super-secret-key',
            signOptions: { expiresIn: '24h' },
        }),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }
