import { IsOptional, IsString, IsEmail } from 'class-validator';
// DTO for editing user information, allowing optional fields for name, email, and phone number
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
}