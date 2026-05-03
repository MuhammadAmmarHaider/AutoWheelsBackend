import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto, SignInDto } from './dto';
import { JwtGuard } from './guard';
import { GetUser } from './decorator';
import type { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('signup')
    async signup(@Body() dto: SignupDto) {
        return this.authService.signup(dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('signin')
    async signin(@Body() dto: SignInDto) {
        return this.authService.signin(dto);
    }

    @UseGuards(JwtGuard)
    @Get('me')
    async getMe(@GetUser() user: User) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
        };
    }

    @UseGuards(JwtGuard)
    @HttpCode(HttpStatus.OK)
    @Post('logout')
    async logout(@GetUser() user: User) {
        return this.authService.logout(user.id);
    }
}
