import {
    BadRequestException,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Res,
    UseGuards,
    Body,
} from '@nestjs/common';
import type { Response } from 'express';
import { CatalogService } from './catalog.service';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';

const CATALOG_BROWSE_SECTIONS = ['latest', 'featured', 'newest_models'] as const;
type CatalogBrowseSectionKey =
    (typeof CATALOG_BROWSE_SECTIONS)[number];

function parseCatalogSection(raw?: string): CatalogBrowseSectionKey {
    const key = (raw || 'latest').trim();
    if (CATALOG_BROWSE_SECTIONS.includes(key as CatalogBrowseSectionKey)) {
        return key as CatalogBrowseSectionKey;
    }
    throw new BadRequestException(
        `Invalid section. Use one of: ${CATALOG_BROWSE_SECTIONS.join(', ')}.`,
    );
}

/** Editorial / brochure content only — distinct from marketplace listings (used cars). */
@Controller('catalog')
export class CatalogController {
    constructor(private catalogService: CatalogService) {}

    @Get('home-feed')
    async getHomeFeed(
        @Res() res: Response,
        @Query('search') search?: string,
    ) {
        const body = await this.catalogService.getHomeFeed({
            search: search || undefined,
        });
        res.set({ 'Cache-Control': 'public, max-age=300' });
        return res.json(body);
    }

    @Get('browse')
    async browse(
        @Query('search') search?: string,
        @Query('section') sectionRaw?: string,
        @Query('skip') skipRaw?: string,
        @Query('take') takeRaw?: string,
    ) {
        const sectionKey = parseCatalogSection(sectionRaw);
        const parsedSkip = Math.max(0, parseInt(skipRaw || '0', 10) || 0);
        const parsedTake = parseInt(takeRaw || '20', 10) || 20;
        const take = Math.min(50, Math.max(1, parsedTake));

        return this.catalogService.browseListings({
            search: search || undefined,
            section: sectionKey,
            skip: parsedSkip,
            take,
        });
    }

    @Get('form-options')
    async getFormOptions() {
        return this.catalogService.getFormOptions();
    }

    @Get(':id')
    async getById(@Param('id') id: string) {
        return this.catalogService.getById(id);
    }

    @Get(':id/similar')
    async getSimilarCars(@Param('id') id: string, @Query('limit') limitRaw?: string) {
        const limit = Math.min(10, Math.max(1, parseInt(limitRaw || '4', 10) || 4));
        return this.catalogService.getSimilarCars(id, limit);
    }

    @Post(':id/reviews')
    @UseGuards(JwtGuard)
    async createReview(
        @Param('id') id: string,
        @GetUser() user: any,
        @Body() body: {
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
        return this.catalogService.createReview(id, user.id, body);
    }
}
