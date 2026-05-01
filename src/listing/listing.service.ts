import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto, UpdateListingDto } from './dto';
import { ListingStatus } from '@prisma/client';

interface CachedOptions {
  data: any;
  timestamp: number;
}

@Injectable()
export class ListingService {
    constructor(private prisma: PrismaService) {}

    // Cache duration: 30 minutes
    private sellFormOptionsCache: CachedOptions | null = null;
    private readonly CACHE_DURATION = 30 * 60 * 1000;

    private isCacheValid(): boolean {
        if (!this.sellFormOptionsCache) return false;
        return Date.now() - this.sellFormOptionsCache.timestamp < this.CACHE_DURATION;
    }

    private async resolveCityId(cityIdOrName: string) {
        const existingById = await this.prisma.city.findUnique({
            where: { id: cityIdOrName },
        });
        if (existingById) {
            return existingById.id;
        }

        const cityName = cityIdOrName.trim();
        const existingByName = await this.prisma.city.findFirst({
            where: {
                name: { equals: cityName, mode: 'insensitive' },
            },
        });
        if (existingByName) {
            return existingByName.id;
        }

        const created = await this.prisma.city.create({
            data: { name: cityName },
        });
        return created.id;
    }

    async getSellFormOptions() {
        // Return cached data if valid
        if (this.isCacheValid()) {
            return this.sellFormOptionsCache!.data;
        }

        // Fetch with limits and parallel queries for speed
        const [cities, models] = await Promise.all([
            // Fetch top 100 cities (most common ones at the top)
            this.prisma.city.findMany({
                select: { id: true, name: true },
                orderBy: { name: 'asc' },
                take: 100,
            }),
            // Fetch car models with optimized fields
            this.prisma.carModel.findMany({
                select: {
                    id: true,
                    name: true,
                    brandId: true,
                    brand: { select: { name: true } },
                },
                orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
                take: 500, // Limit to top 500 models
            }),
        ]);

        const formattedData = {
            cities,
            models: models.map(model => ({
                id: model.id,
                name: model.name,
                brandId: model.brandId,
                brandName: model.brand.name,
                fullName: `${model.brand.name} ${model.name}`,
            })),
        };

        // Avoid caching an empty snapshot so seeding the DB shows up without a server restart.
        if (formattedData.cities.length > 0 || formattedData.models.length > 0) {
            this.sellFormOptionsCache = {
                data: formattedData,
                timestamp: Date.now(),
            };
        }

        return formattedData;
    }

    // Clear cache when data changes
    private clearCache() {
        this.sellFormOptionsCache = null;
    }

    async createListing(userId: string, dto: CreateListingDto) {
        const cityId = await this.resolveCityId(dto.cityId);
        const registeredCityId = dto.registeredCityId
            ? await this.resolveCityId(dto.registeredCityId)
            : null;

        const model = await this.prisma.carModel.findUnique({
            where: { id: dto.modelId },
            include: { brand: true },
        });

        if (!model) {
            throw new NotFoundException('Car model not found');
        }

        const listing = await this.prisma.listing.create({
            data: {
                title: dto.title || `${model.brand.name} ${model.name} ${dto.year}`,
                description: dto.description,
                price: dto.price,
                year: dto.year,
                mileage: dto.mileage,
                bodyColor: dto.bodyColor,
                contactName: dto.contactName,
                contactPhone: dto.contactPhone,
                allowWhatsapp: dto.allowWhatsapp ?? false,
                fuelType: dto.fuelType ?? 'PETROL',
                transmission: dto.transmission ?? 'MANUAL',
                userId,
                brandId: dto.brandId || model.brandId,
                modelId: dto.modelId,
                cityId,
                registeredCityId,
                images: {
                    create: dto.imageUrls?.map(url => ({ url })) || [],
                },
            },
            include: {
                images: true,
                user: { select: { id: true, name: true, email: true, phone: true } },
                brand: true,
                model: true,
                city: true,
                registeredCity: true,
            },
        });

        // Clear cache since new city might have been added
        this.clearCache();

        return listing;
    }

    async getListing(id: string) {
        const listing = await this.prisma.listing.findUnique({
            where: { id },
            include: {
                images: true,
                user: { select: { id: true, name: true, email: true, phone: true } },
                brand: true,
                model: true,
                city: true,
                registeredCity: true,
            },
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        return listing;
    }

    async getAllListings(filters?: { status?: ListingStatus; cityId?: string; brandId?: string }) {
        const listings = await this.prisma.listing.findMany({
            where: {
                ...(filters?.status && { status: filters.status }),
                ...(filters?.cityId && { cityId: filters.cityId }),
                ...(filters?.brandId && { brandId: filters.brandId }),
            },
            include: {
                images: true,
                user: { select: { id: true, name: true, email: true, phone: true } },
                brand: true,
                model: true,
                city: true,
                registeredCity: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return listings;
    }

    async updateListing(id: string, userId: string, dto: UpdateListingDto) {
        const listing = await this.prisma.listing.findUnique({
            where: { id },
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        if (listing.userId !== userId) {
            throw new ForbiddenException('You can only update your own listings');
        }

        const { imageUrls, cityId, registeredCityId, modelId, brandId, ...restDto } = dto;
        let resolvedCityId: string | undefined;
        let resolvedRegisteredCityId: string | null | undefined;
        let resolvedBrandId = brandId;

        if (cityId) {
            resolvedCityId = await this.resolveCityId(cityId);
        }

        if (registeredCityId !== undefined) {
            resolvedRegisteredCityId = registeredCityId
                ? await this.resolveCityId(registeredCityId)
                : null;
        }

        if (!resolvedBrandId && modelId) {
            const model = await this.prisma.carModel.findUnique({ where: { id: modelId } });
            if (!model) {
                throw new NotFoundException('Car model not found');
            }
            resolvedBrandId = model.brandId;
        }

        const updated = await this.prisma.listing.update({
            where: { id },
            data: {
                ...restDto,
                ...(resolvedCityId && { cityId: resolvedCityId }),
                ...(resolvedRegisteredCityId !== undefined && {
                    registeredCityId: resolvedRegisteredCityId,
                }),
                ...(modelId && { modelId }),
                ...(resolvedBrandId && { brandId: resolvedBrandId }),
                ...(imageUrls && {
                    images: {
                        deleteMany: {},
                        create: imageUrls.map(url => ({ url })),
                    },
                }),
            },
            include: {
                images: true,
                user: { select: { id: true, name: true, email: true, phone: true } },
                brand: true,
                model: true,
                city: true,
                registeredCity: true,
            },
        });

        return updated;
    }

    async deleteListing(id: string, userId: string) {
        const listing = await this.prisma.listing.findUnique({
            where: { id },
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        if (listing.userId !== userId) {
            throw new ForbiddenException('You can only delete your own listings');
        }

        await this.prisma.listing.delete({
            where: { id },
        });

        return { message: 'Listing deleted successfully' };
    }

    async getListingsByUser(userId: string) {
        const listings = await this.prisma.listing.findMany({
            where: { userId },
            include: {
                images: true,
                brand: true,
                model: true,
                city: true,
                registeredCity: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return listings;
    }

    async updateListingStatus(id: string, userId: string, status: ListingStatus) {
        const listing = await this.prisma.listing.findUnique({
            where: { id },
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        if (listing.userId !== userId) {
            throw new ForbiddenException('You can only update your own listings');
        }

        const updated = await this.prisma.listing.update({
            where: { id },
            data: { status },
            include: {
                images: true,
                user: { select: { id: true, name: true, email: true, phone: true } },
                brand: true,
                model: true,
                city: true,
                registeredCity: true,
            },
        });

        return updated;
    }
}
