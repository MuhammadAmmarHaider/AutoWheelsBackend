import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    UseGuards,
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
    @Get()
    async getMyFavorites(@GetUser() user: User) {
        return this.favoriteService.getUserFavorites(user.id);
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
