import { IsOptional, IsString } from 'class-validator';

export class UpdateCityDto {
    @IsOptional()
    @IsString()
    name?: string;
}
