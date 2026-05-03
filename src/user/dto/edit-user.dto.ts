import { IsOptional, IsString, IsEmail, IsDateString } from 'class-validator';

export class EditUserDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsDateString()
    birthday?: string;

    @IsOptional()
    @IsString()
    gender?: string;
}