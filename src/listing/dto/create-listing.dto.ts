import { Type } from 'class-transformer';
import {
    IsNotEmpty,
    IsString,
    IsNumber,
    IsEnum,
    IsOptional,
    IsBoolean,
} from 'class-validator';
import { FuelType, Transmission } from '@prisma/client';

export class CreateListingDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    price: number;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    year: number;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    mileage: number;

    @IsOptional()
    @IsEnum(FuelType)
    fuelType?: FuelType;

    @IsOptional()
    @IsEnum(Transmission)
    transmission?: Transmission;

    @IsOptional()
    @IsString()
    brandId?: string;

    @IsString()
    @IsNotEmpty()
    modelId: string;

    @IsString()
    @IsNotEmpty()
    cityId: string;

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
