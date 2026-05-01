import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCarModelDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    brandId: string;
}
