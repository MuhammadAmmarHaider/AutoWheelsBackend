import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto, UpdateBrandDto, CreateCarModelDto } from './dto';

@Injectable()
export class BrandService {
    constructor(private prisma: PrismaService) {}

    async createBrand(dto: CreateBrandDto) {
        try {
            const brand = await this.prisma.brand.create({
                data: {
                    name: dto.name,
                },
                include: {
                    models: true,
                },
            });
            return brand;
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Brand already exists');
            }
            throw error;
        }
    }

    async getBrand(id: string) {
        const brand = await this.prisma.brand.findUnique({
            where: { id },
            include: {
                models: true,
            },
        });

        if (!brand) {
            throw new NotFoundException('Brand not found');
        }

        return brand;
    }

    async getAllBrands() {
        return this.prisma.brand.findMany({
            include: {
                models: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    async updateBrand(id: string, dto: UpdateBrandDto) {
        const brand = await this.prisma.brand.findUnique({
            where: { id },
        });

        if (!brand) {
            throw new NotFoundException('Brand not found');
        }

        try {
            const updated = await this.prisma.brand.update({
                where: { id },
                data: dto,
                include: {
                    models: true,
                },
            });
            return updated;
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Brand name already exists');
            }
            throw error;
        }
    }

    async deleteBrand(id: string) {
        const brand = await this.prisma.brand.findUnique({
            where: { id },
        });

        if (!brand) {
            throw new NotFoundException('Brand not found');
        }

        await this.prisma.brand.delete({
            where: { id },
        });

        return { message: 'Brand deleted successfully' };
    }

    // Car Model methods
    async createCarModel(dto: CreateCarModelDto) {
        const brand = await this.prisma.brand.findUnique({
            where: { id: dto.brandId },
        });

        if (!brand) {
            throw new NotFoundException('Brand not found');
        }

        try {
            const model = await this.prisma.carModel.create({
                data: {
                    name: dto.name,
                    brandId: dto.brandId,
                },
                include: {
                    brand: true,
                },
            });
            return model;
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Model already exists for this brand');
            }
            throw error;
        }
    }

    async getCarModel(id: string) {
        const model = await this.prisma.carModel.findUnique({
            where: { id },
            include: {
                brand: true,
            },
        });

        if (!model) {
            throw new NotFoundException('Car model not found');
        }

        return model;
    }

    async getCarModelsByBrand(brandId: string) {
        const brand = await this.prisma.brand.findUnique({
            where: { id: brandId },
        });

        if (!brand) {
            throw new NotFoundException('Brand not found');
        }

        return this.prisma.carModel.findMany({
            where: { brandId },
            orderBy: {
                name: 'asc',
            },
        });
    }

    async deleteCarModel(id: string) {
        const model = await this.prisma.carModel.findUnique({
            where: { id },
        });

        if (!model) {
            throw new NotFoundException('Car model not found');
        }

        await this.prisma.carModel.delete({
            where: { id },
        });

        return { message: 'Car model deleted successfully' };
    }
}
