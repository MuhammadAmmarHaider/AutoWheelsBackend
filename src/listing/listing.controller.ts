import {
    BadRequestException,
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

const HOME_SECTIONS = ['latest', 'best_value', 'newest_models'] as const;
type HomeSectionKey = (typeof HOME_SECTIONS)[number];

function parseBrowseSection(raw?: string): HomeSectionKey {
    const key = (raw || 'latest').trim();
    if (HOME_SECTIONS.includes(key as HomeSectionKey)) return key as HomeSectionKey;
    throw new BadRequestException(
        `Invalid section. Use one of: ${HOME_SECTIONS.join(', ')}.`,
    );
}

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

    /** Rows for home: Latest arrivals, Best value picks, Newest models (10 each). For-sale listings only. */
    @Get('home-feed')
    async getHomeFeed(
        @Query('cityId') cityId?: string,
        @Query('search') search?: string,
    ) {
        return this.listingService.getHomeFeed({
            cityId: cityId || undefined,
            search: search || undefined,
        });
    }

    /** Paginated marketplace listings for “View all”. */
    @Get('browse')
    async browseListings(
        @Query('cityId') cityId?: string,
        @Query('search') search?: string,
        @Query('section') section?: string,
        @Query('skip') skipRaw?: string,
        @Query('take') takeRaw?: string,
    ) {
        const sectionKey = parseBrowseSection(section);
        const parsedSkip = Math.max(0, parseInt(skipRaw || '0', 10) || 0);
        const parsedTake = parseInt(takeRaw || '20', 10) || 20;
        const take = Math.min(50, Math.max(1, parsedTake));
        return this.listingService.browseListings({
            cityId: cityId || undefined,
            search: search || undefined,
            section: sectionKey,
            skip: parsedSkip,
            take,
        });
    }

    /** Unified paginated marketplace feed for the app “View all” screen (sections merged). */
    @Get('explore')
    async exploreListings(
        @Query('cityId') cityId?: string,
        @Query('search') search?: string,
        @Query('skip') skipRaw?: string,
        @Query('take') takeRaw?: string,
    ) {
        const parsedSkip = Math.max(0, parseInt(skipRaw || '0', 10) || 0);
        const parsedTake = parseInt(takeRaw || '20', 10) || 20;
        const take = Math.min(50, Math.max(1, parsedTake));
        return this.listingService.exploreListings({
            cityId: cityId || undefined,
            search: search || undefined,
            skip: parsedSkip,
            take,
        });
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
