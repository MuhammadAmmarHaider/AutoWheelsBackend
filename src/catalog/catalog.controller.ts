import {
    BadRequestException,
    Controller,
    Get,
    Param,
    Query,
    Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CatalogService } from './catalog.service';

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

    @Get(':id')
    async getById(@Param('id') id: string) {
        return this.catalogService.getById(id);
    }
}
