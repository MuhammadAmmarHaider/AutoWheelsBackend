import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { FuelType, Transmission } from '@prisma/client';

export class UpdateListingDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    price?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    year?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    mileage?: number;

    @IsOptional()
    @IsEnum(FuelType)
    fuelType?: FuelType;

    @IsOptional()
    @IsEnum(Transmission)
    transmission?: Transmission;

    @IsOptional()
    @IsString()
    brandId?: string;

    @IsOptional()
    @IsString()
    modelId?: string;

    @IsOptional()
    @IsString()
    cityId?: string;

    @IsOptional()
    @IsString()
    registeredCityId?: string;

    @IsOptional()
    @IsString()
    bodyColor?: string;

    @IsOptional()
    @IsString()
    contactName?: string;

    @IsOptional()
    @IsString()
    contactPhone?: string;

    @IsOptional()
    @IsBoolean()
    allowWhatsapp?: boolean;

    @IsOptional()
    @IsString({ each: true })
    imageUrls?: string[];
}
