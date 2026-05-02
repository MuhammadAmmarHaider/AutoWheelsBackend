// src/review/dto/update-review.dto.ts
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class UpdateReviewDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  styleRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  comfortRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  fuelEconomyRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  performanceRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  valueForMoneyRating?: number;
}