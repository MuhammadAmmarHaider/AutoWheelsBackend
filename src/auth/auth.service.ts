import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { SignInDto, SignupDto } from './dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
    ) {}

    async signup(dto: SignupDto) {
        try {
            const userExists = await this.prisma.user.findUnique({
                where: { email: dto.email }
            });

            if (userExists) {
                throw new ConflictException('Email already in use');
            }

            const hash = await argon.hash(dto.password);

            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    password: hash,
                    name: dto.name,
                    phone: dto.phone,
                },
            });

            return {
                message: 'User created successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException('Email already exists');
                }
            }
            throw error;
        }
    }

    async signin(dto: SignInDto): Promise<{ access_token: string }> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new ForbiddenException('Invalid credentials');
        }

        const isPasswordMatch = await argon.verify(user.password, dto.password);
        if (!isPasswordMatch) {
            throw new ForbiddenException('Invalid credentials');
        }

        const token = await this.signToken(user.id, user.email);
        return { access_token: token };
    }

    private async signToken(userId: string, email: string): Promise<string> {
        const payload = {
            sub: userId,
            email,
        };

        const secret = this.config.get('JWT_SECRET') || 'super-secret';
        const token = await this.jwt.signAsync(payload, {
            expiresIn: '24h',
            secret: secret,
        });

        return token;
    }

    async logout(userId: string) {
        // For JWT-based auth, logout is primarily client-side (token removal)
        // This endpoint exists for future token blacklisting if needed
        return {
            message: 'Logged out successfully',
        };
    }
}
