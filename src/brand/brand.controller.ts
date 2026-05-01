import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { BrandService } from './brand.service';
import { CreateBrandDto, UpdateBrandDto, CreateCarModelDto } from './dto';
import { JwtGuard } from '../auth/guard';

@Controller('brands')
export class BrandController {
    constructor(private brandService: BrandService) {}

    @UseGuards(JwtGuard)
    @Post()
    async createBrand(@Body() dto: CreateBrandDto) {
        return this.brandService.createBrand(dto);
    }

    @Get()
    async getAllBrands() {
        return this.brandService.getAllBrands();
    }

    @Get(':id')
    async getBrand(@Param('id') id: string) {
        return this.brandService.getBrand(id);
    }

    @UseGuards(JwtGuard)
    @Put(':id')
    async updateBrand(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
        return this.brandService.updateBrand(id, dto);
    }

    @UseGuards(JwtGuard)
    @Delete(':id')
    async deleteBrand(@Param('id') id: string) {
        return this.brandService.deleteBrand(id);
    }

    // Car Model routes
    @UseGuards(JwtGuard)
    @Post(':brandId/models')
    async createCarModel(@Param('brandId') brandId: string, @Body() dto: CreateCarModelDto) {
        return this.brandService.createCarModel({ ...dto, brandId });
    }

    @Get(':brandId/models')
    async getCarModelsByBrand(@Param('brandId') brandId: string) {
        return this.brandService.getCarModelsByBrand(brandId);
    }

    @Get('models/:id')
    async getCarModel(@Param('id') id: string) {
        return this.brandService.getCarModel(id);
    }

    @UseGuards(JwtGuard)
    @Delete('models/:id')
    async deleteCarModel(@Param('id') id: string) {
        return this.brandService.deleteCarModel(id);
    }
}
