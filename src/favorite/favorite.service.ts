import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddFavoriteDto } from './dto';

@Injectable()
export class FavoriteService {
    constructor(private prisma: PrismaService) {}

    async addFavorite(userId: string, dto: AddFavoriteDto) {
        // Check if listing exists
        const listing = await this.prisma.listing.findUnique({
            where: { id: dto.listingId },
        });

        if (!listing) {
            throw new NotFoundException('Listing not found');
        }
// Attempt to create a new favorite entry, handling potential conflicts if the user has already favorited this listing
        try {
            const favorite = await this.prisma.favorite.create({
                data: {
                    userId,
                    listingId: dto.listingId,
                },
                include: {
                    listing: {
                        include: {
                            images: true,
                            user: { select: { id: true, name: true, email: true, phone: true } },
                            brand: true,
                            model: true,
                            city: true,
                        },
                    },
                },
            });
            return favorite;
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Already added to favorites');
            }
            throw error;
        }
    }

    async removeFavorite(userId: string, listingId: string) {
        const favorite = await this.prisma.favorite.findUnique({
            where: {
                userId_listingId: {
                    userId,
                    listingId,
                },
            },
        });

        if (!favorite) {
            throw new NotFoundException('Favorite not found');
        }

        await this.prisma.favorite.delete({
            where: {
                userId_listingId: {
                    userId,
                    listingId,
                },
            },
        });

        return { message: 'Removed from favorites' };
    }

    async getUserFavorites(userId: string, options?: { skip?: number; take?: number }) {
        const skip = Math.max(0, options?.skip ?? 0);
        const parsedTake = options?.take ?? 30;
        const take = Math.min(100, Math.max(1, parsedTake));

        const where = { userId };

        const [favorites, total] = await Promise.all([
            this.prisma.favorite.findMany({
                where,
                include: {
                    listing: {
                        include: {
                            images: true,
                            user: { select: { id: true, name: true, email: true, phone: true } },
                            brand: true,
                            model: true,
                            city: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            this.prisma.favorite.count({ where }),
        ]);

        return { favorites, total, skip, take };
    }

    async getFavoriteListingIds(userId: string) {
        const rows = await this.prisma.favorite.findMany({
            where: { userId },
            select: { listingId: true },
            orderBy: { createdAt: 'desc' },
        });
        return { listingIds: rows.map(r => r.listingId) };
    }

    async isFavorite(userId: string, listingId: string): Promise<boolean> {
        const favorite = await this.prisma.favorite.findUnique({
            where: {
                userId_listingId: {
                    userId,
                    listingId,
                },
            },
        });

        return !!favorite;
    }

    async getFavoritesCount(listingId: string): Promise<number> {
        return this.prisma.favorite.count({
            where: { listingId },
        });
    }
}
