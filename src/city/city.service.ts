import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCityDto, UpdateCityDto } from './dto';

@Injectable()
export class CityService {
    constructor(private prisma: PrismaService) {}

    async createCity(dto: CreateCityDto) {
        try {
            const city = await this.prisma.city.create({
                data: {
                    name: dto.name,
                },
            });
            return city;
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('City already exists');
            }
            throw error;
        }
    }

    async getCity(id: string) {
        const city = await this.prisma.city.findUnique({
            where: { id },
        });

        if (!city) {
            throw new NotFoundException('City not found');
        }

        return city;
    }

    async getAllCities() {
        return this.prisma.city.findMany({
            orderBy: {
                name: 'asc',
            },
        });
    }

    async updateCity(id: string, dto: UpdateCityDto) {
        const city = await this.prisma.city.findUnique({
            where: { id },
        });

        if (!city) {
            throw new NotFoundException('City not found');
        }

        try {
            const updated = await this.prisma.city.update({
                where: { id },
                data: dto,
            });
            return updated;
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('City name already exists');
            }
            throw error;
        }
    }

    async deleteCity(id: string) {
        const city = await this.prisma.city.findUnique({
            where: { id },
        });

        if (!city) {
            throw new NotFoundException('City not found');
        }

        await this.prisma.city.delete({
            where: { id },
        });

        return { message: 'City deleted successfully' };
    }
}
