import { Body, Controller, Get, Patch, UseGuards, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { GetUser } from '../auth/decorator';
import type { User } from '@prisma/client';
import { EditUserDto } from './dto';
import { JwtGuard } from '../auth/guard';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
    constructor(private userService: UserService) {}

    @Get()
    async getAllUsers(@GetUser() user: User) {
        return this.userService.findAllUsers(user.id);
    }

    @Get('me')
    getMe(@GetUser() user: User) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    @Patch('me')
    updateUser(@GetUser() user: User, @Body() dto: EditUserDto) {
        return this.userService.updateUser(user.id, dto);
    }

    @Get('profile/:id')
    getUserProfile(@Param('id') id: string) {
        return this.userService.getUserProfile(id);
    }
}
