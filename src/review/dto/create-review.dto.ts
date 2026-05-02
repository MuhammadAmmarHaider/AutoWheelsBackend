import { IsString, IsInt, Min, Max, MinLength } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @MinLength(5)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsInt()
  @Min(1)
  @Max(5)
  styleRating: number;

  @IsInt()
  @Min(1)
  @Max(5)
  comfortRating: number;

  @IsInt()
  @Min(1)
  @Max(5)
  fuelEconomyRating: number;

  @IsInt()
  @Min(1)
  @Max(5)
  performanceRating: number;

  @IsInt()
  @Min(1)
  @Max(5)
  valueForMoneyRating: number;

  @IsString()
  newCarId: string;
}
