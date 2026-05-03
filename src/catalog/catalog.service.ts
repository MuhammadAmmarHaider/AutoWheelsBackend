import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const CATALOG_CARD_INCLUDE = {
    images: true,
    brand: true,
    model: true,
} as const;

export type CatalogBrowseSection =
    | 'latest'
    | 'featured'
    | 'newest_models';

@Injectable()
export class CatalogService {
    constructor(private prisma: PrismaService) {}

    private buildCatalogWhere(search?: string): Prisma.NewCarWhereInput {
        const q = search?.trim();
        return q
            ? {
                  OR: [
                      { name: { contains: q, mode: 'insensitive' } },
                      { description: { contains: q, mode: 'insensitive' } },
                      { bodyType: { contains: q, mode: 'insensitive' } },
                      { engine: { contains: q, mode: 'insensitive' } },
                      { brand: { name: { contains: q, mode: 'insensitive' } } },
                      { model: { name: { contains: q, mode: 'insensitive' } } },
                  ],
              }
            : {};
    }

    /** Home showroom rows (informational specs only — not for sale). */
    async getHomeFeed(params: { search?: string }) {
        const filter = this.buildCatalogWhere(params.search);

        const [latest, spotlight, newestYears] = await Promise.all([
            this.prisma.newCar.findMany({
                where: filter,
                include: CATALOG_CARD_INCLUDE,
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            this.prisma.newCar.findMany({
                where: filter,
                include: CATALOG_CARD_INCLUDE,
                orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
                take: 10,
            }),
            this.prisma.newCar.findMany({
                where: filter,
                include: CATALOG_CARD_INCLUDE,
                orderBy: { year: 'desc' },
                take: 10,
            }),
        ]);

        return {
            sections: [
                { key: 'latest', title: 'Recently added specs', entries: latest },
                { key: 'featured', title: 'Highlighted models', entries: spotlight },
                {
                    key: 'newest_models',
                    title: 'Latest model years',
                    entries: newestYears,
                },
            ],
        };
    }

    async browseListings(params: {
        search?: string;
        section: CatalogBrowseSection;
        skip: number;
        take: number;
    }) {
        const where = this.buildCatalogWhere(params.search);

        const base = {
            where,
            include: CATALOG_CARD_INCLUDE,
            skip: params.skip,
            take: params.take,
        } as const;

        const [entries, total] =
            params.section === 'latest'
                ? await Promise.all([
                      this.prisma.newCar.findMany({
                          ...base,
                          orderBy: { createdAt: 'desc' },
                      }),
                      this.prisma.newCar.count({ where }),
                  ])
                : params.section === 'featured'
                  ? await Promise.all([
                        this.prisma.newCar.findMany({
                            ...base,
                            orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
                        }),
                        this.prisma.newCar.count({ where }),
                    ])
                  : await Promise.all([
                        this.prisma.newCar.findMany({
                            ...base,
                            orderBy: { year: 'desc' },
                        }),
                        this.prisma.newCar.count({ where }),
                    ]);

        return {
            entries,
            total,
            skip: params.skip,
            take: params.take,
        };
    }

    async getById(id: string) {
        const entry = await this.prisma.newCar.findUnique({
            where: { id },
            include: {
                images: true,
                brand: true,
                model: true,
                dimensions: true,
                engineDetails: true,
                transmissionDetails: true,
                steering: true,
                suspension: true,
                wheels: true,
                fuelEconomy: true,
                reviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!entry) throw new NotFoundException('Specifications not found');
        return entry;
    }

    async getSimilarCars(id: string, limit: number = 4) {
        const entry = await this.prisma.newCar.findUnique({
            where: { id },
            select: {
                brandId: true,
                bodyType: true,
                fuelType: true,
            },
        });

        if (!entry) throw new NotFoundException('Car not found');

        return this.prisma.newCar.findMany({
            where: {
                AND: [
                    { id: { not: id } },
                    {
                        OR: [
                            { brandId: entry.brandId },
                            { bodyType: entry.bodyType },
                            { fuelType: entry.fuelType },
                        ],
                    },
                ],
            },
            include: CATALOG_CARD_INCLUDE,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }

    async createReview(
        carId: string,
        userId: string,
        reviewData: {
            title: string;
            description: string;
            styleRating: number;
            comfortRating: number;
            fuelEconomyRating: number;
            performanceRating: number;
            valueForMoneyRating: number;
            overallRating: number;
        },
    ) {
        // Check if car exists
        const car = await this.prisma.newCar.findUnique({
            where: { id: carId },
        });
        
        if (!car) throw new NotFoundException('Car not found');

        // Validate ratings
        const ratings = [
            reviewData.styleRating,
            reviewData.comfortRating,
            reviewData.fuelEconomyRating,
            reviewData.performanceRating,
            reviewData.valueForMoneyRating,
            reviewData.overallRating,
        ];

        for (const rating of ratings) {
            if (rating < 1 || rating > 5) {
                throw new BadRequestException('All ratings must be between 1 and 5');
            }
        }

        // Create the review
        return this.prisma.review.create({
            data: {
                ...reviewData,
                newCarId: carId,
                userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async getFormOptions() {
        // Get all brands with their models
        const brands = await this.prisma.brand.findMany({
            include: {
                models: {
                    orderBy: { name: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });

        // Transform to the format expected by the frontend
        const models = brands.flatMap(brand => 
            brand.models.map(model => ({
                id: model.id,
                name: model.name,
                brandId: brand.id,
                brandName: brand.name,
                fullName: `${brand.name} ${model.name}`,
            }))
        );

        // Return in the same format as sell-now form options
        return {
            cities: [], // Empty cities array for now, can be added later
            models,
        };
    }
}
