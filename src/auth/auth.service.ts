import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async validateUser(username: string, pass: string) {
        const user = await this.prisma.users.findUnique({
            where: { username },
        });
        if (!user || !user.password) {
            throw new UnauthorizedException('Username/Password Salah');
        }

        const passwordValid = await bcrypt.compare(pass, user.password);
        if (!passwordValid) {
            throw new UnauthorizedException('Password Salah!');
        }

        // Return user data without password
        const { password, ...result } = user;
        return result;
    }

    async login(user: any) {
        const payload = { username: user.username, user_id: user.id };
        return {
            accessToken: this.jwtService.sign(payload),
        };
    }
}
