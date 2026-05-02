import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    UseGuards,
    Query,
} from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { AddFavoriteDto } from './dto';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import type { User } from '@prisma/client';

@Controller('favorites')
export class FavoriteController {
    constructor(private favoriteService: FavoriteService) {}

    @UseGuards(JwtGuard)
    @Post()
    async addFavorite(@GetUser() user: User, @Body() dto: AddFavoriteDto) {
        return this.favoriteService.addFavorite(user.id, dto);
    }

    @UseGuards(JwtGuard)
    @Delete(':listingId')
    async removeFavorite(@GetUser() user: User, @Param('listingId') listingId: string) {
        return this.favoriteService.removeFavorite(user.id, listingId);
    }

    @UseGuards(JwtGuard)
    @Get('listing-ids')
    async getListingIds(@GetUser() user: User) {
        return this.favoriteService.getFavoriteListingIds(user.id);
    }

    /** Paginated saves for the Saved ads screen. */
    @UseGuards(JwtGuard)
    @Get()
    async getMyFavorites(
        @GetUser() user: User,
        @Query('skip') skipRaw?: string,
        @Query('take') takeRaw?: string,
    ) {
        const skip = Math.max(0, parseInt(skipRaw || '0', 10) || 0);
        const parsedTake = parseInt(takeRaw || '25', 10) || 25;
        const take = Math.min(100, Math.max(1, parsedTake));
        return this.favoriteService.getUserFavorites(user.id, { skip, take });
    }

    @Get('check/:listingId')
    @UseGuards(JwtGuard)
    async isFavorite(@GetUser() user: User, @Param('listingId') listingId: string) {
        const isFav = await this.favoriteService.isFavorite(user.id, listingId);
        return { isFavorite: isFav };
    }

    @Get('count/:listingId')
    async getFavoritesCount(@Param('listingId') listingId: string) {
        const count = await this.favoriteService.getFavoritesCount(listingId);
        return { count };
    }
}
