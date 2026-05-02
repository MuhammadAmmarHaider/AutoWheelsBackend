import { Injectable, NotFoundException } from '@nestjs/common';
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
            },
        });
        if (!entry) throw new NotFoundException('Specifications not found');
        return entry;
    }
}
