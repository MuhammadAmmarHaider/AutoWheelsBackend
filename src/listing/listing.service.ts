import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ListingStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto, UpdateListingDto } from './dto';

const LISTING_CARD_INCLUDE = {
    images: true,
    brand: true,
    model: true,
    city: true,
} as const;

export type HomeSectionKey = 'latest' | 'best_value' | 'newest_models';

interface CachedOptions {
  data: any;
  timestamp: number;
}

@Injectable()
export class ListingService {
    constructor(private prisma: PrismaService) {}

    private buildPublicListingWhere(params: {
        cityId?: string;
        search?: string;
    }): Prisma.ListingWhereInput {
        const q = params.search?.trim();
        return {
            status: ListingStatus.ACTIVE,
            ...(params.cityId && { cityId: params.cityId }),
            ...(q
                ? {
                      OR: [
                          { title: { contains: q, mode: 'insensitive' } },
                          { description: { contains: q, mode: 'insensitive' } },
                          {
                              brand: {
                                  name: { contains: q, mode: 'insensitive' },
                              },
                          },
                          {
                              model: {
                                  name: { contains: q, mode: 'insensitive' },
                              },
                          },
                      ],
                  }
                : {}),
        };
    }

    async getHomeFeed(params: { cityId?: string; search?: string }) {
        const where = this.buildPublicListingWhere(params);

        const [latest, bestValue, newestModels] = await Promise.all([
            this.prisma.listing.findMany({
                where,
                include: LISTING_CARD_INCLUDE,
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            this.prisma.listing.findMany({
                where,
                include: LISTING_CARD_INCLUDE,
                orderBy: { price: 'asc' },
                take: 10,
            }),
            this.prisma.listing.findMany({
                where,
                include: LISTING_CARD_INCLUDE,
                orderBy: { year: 'desc' },
                take: 10,
            }),
        ]);

        return {
            sections: [
                { key: 'latest', title: 'Latest arrivals', listings: latest },
                {
                    key: 'best_value',
                    title: 'Best value picks',
                    listings: bestValue,
                },
                {
                    key: 'newest_models',
                    title: 'Newest models',
                    listings: newestModels,
                },
            ],
        };
    }

    async browseListings(params: {
        cityId?: string;
        search?: string;
        section: HomeSectionKey;
        skip: number;
        take: number;
    }) {
        const where = this.buildPublicListingWhere(params);
        const orderBy: Prisma.ListingOrderByWithRelationInput =
            params.section === 'latest'
                ? { createdAt: 'desc' }
                : params.section === 'best_value'
                  ? { price: 'asc' }
                  : { year: 'desc' };

        const [listings, total] = await Promise.all([
            this.prisma.listing.findMany({
                where,
                include: LISTING_CARD_INCLUDE,
                orderBy,
                skip: params.skip,
                take: params.take,
            }),
            this.prisma.listing.count({ where }),
        ]);

        return {
            listings,
            total,
            skip: params.skip,
            take: params.take,
        };
    }

    /** Single “view all” feed: all active listings, newest first. */
    async exploreListings(params: {
        cityId?: string;
        search?: string;
        skip: number;
        take: number;
    }) {
        const where = this.buildPublicListingWhere(params);

        const [listings, total] = await Promise.all([
            this.prisma.listing.findMany({
                where,
                include: LISTING_CARD_INCLUDE,
                orderBy: { createdAt: 'desc' },
                skip: params.skip,
                take: params.take,
            }),
            this.prisma.listing.count({ where }),
        ]);

        return {
            listings,
            total,
            skip: params.skip,
            take: params.take,
        };
    }

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
