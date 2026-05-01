import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    UseGuards,
    Query,
    Res,
} from '@nestjs/common';
import { ListingService } from './listing.service';
import { CreateListingDto, UpdateListingDto } from './dto';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { ListingStatus } from '@prisma/client';
import type { User } from '@prisma/client';
import type { Response } from 'express';

@Controller('listings')
export class ListingController {
    constructor(private listingService: ListingService) {}

    @UseGuards(JwtGuard)
    @Post()
    async createListing(@GetUser() user: User, @Body() dto: CreateListingDto) {
        return this.listingService.createListing(user.id, dto);
    }

    @Get()
    async getAllListings(
        @Query('status') status?: ListingStatus,
        @Query('cityId') cityId?: string,
        @Query('brandId') brandId?: string,
    ) {
        return this.listingService.getAllListings({ status, cityId, brandId });
    }

    @Get('sell-form/options')
    async getSellFormOptions(@Res() res: Response) {
        const data = await this.listingService.getSellFormOptions();
        // Cache for 10 minutes on client and CDN
        res.set({
            'Cache-Control': 'public, max-age=600',
        });
        return res.json(data);
    }

    @UseGuards(JwtGuard)
    @Get('user/my-listings')
    async getMyListings(@GetUser() user: User) {
        return this.listingService.getListingsByUser(user.id);
    }

    @Get(':id')
    async getListing(@Param('id') id: string) {
        return this.listingService.getListing(id);
    }

    @UseGuards(JwtGuard)
    @Put(':id')
    async updateListing(
        @GetUser() user: User,
        @Param('id') id: string,
        @Body() dto: UpdateListingDto,
    ) {
        return this.listingService.updateListing(id, user.id, dto);
    }

    @UseGuards(JwtGuard)
    @Delete(':id')
    async deleteListing(@GetUser() user: User, @Param('id') id: string) {
        return this.listingService.deleteListing(id, user.id);
    }

    @UseGuards(JwtGuard)
    @Put(':id/status')
    async updateListingStatus(
        @GetUser() user: User,
        @Param('id') id: string,
        @Body('status') status: ListingStatus,
    ) {
        return this.listingService.updateListingStatus(id, user.id, status);
    }
}
