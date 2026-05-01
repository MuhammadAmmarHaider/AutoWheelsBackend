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
import { CityService } from './city.service';
import { CreateCityDto, UpdateCityDto } from './dto';
import { JwtGuard } from '../auth/guard';

@Controller('cities')
export class CityController {
    constructor(private cityService: CityService) {}

    @UseGuards(JwtGuard)
    @Post()
    async createCity(@Body() dto: CreateCityDto) {
        return this.cityService.createCity(dto);
    }

    @Get()
    async getAllCities() {
        return this.cityService.getAllCities();
    }

    @Get(':id')
    async getCity(@Param('id') id: string) {
        return this.cityService.getCity(id);
    }

    @UseGuards(JwtGuard)
    @Put(':id')
    async updateCity(@Param('id') id: string, @Body() dto: UpdateCityDto) {
        return this.cityService.updateCity(id, dto);
    }

    @UseGuards(JwtGuard)
    @Delete(':id')
    async deleteCity(@Param('id') id: string) {
        return this.cityService.deleteCity(id);
    }
}
