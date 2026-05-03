import { Injectable, NotFoundException } from '@nestjs/common';
import { EditUserDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async findAllUsers(currentUserId: string) {
        return this.prisma.user.findMany({
            where: {
                NOT: { id: currentUserId },
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
            },
        });
    }

    async findOne(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateUser(userId: string, dto: EditUserDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Prepare update data, converting birthday to proper DateTime if provided
        const updateData: any = { ...dto };
        
        // Only include defined fields (filter out undefined)
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        // Convert birthday string to DateTime if provided
        if (updateData.birthday && typeof updateData.birthday === 'string') {
            updateData.birthday = new Date(updateData.birthday);
        }

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        const { password, ...userWithoutPassword } = updated;
        return userWithoutPassword;
    }

    async getUserProfile(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }
}
