import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  private calculateOverallRating(
    styleRating: number,
    comfortRating: number,
    fuelEconomyRating: number,
    performanceRating: number,
    valueForMoneyRating: number,
  ): number {
    return (
      (styleRating +
        comfortRating +
        fuelEconomyRating +
        performanceRating +
        valueForMoneyRating) /
      5
    );
  }

  async create(userId: string, createReviewDto: CreateReviewDto) {
    const { newCarId, ...rest } = createReviewDto;

    // Verify the car exists
    const newCar = await this.prisma.newCar.findUnique({
      where: { id: newCarId },
    });

    if (!newCar) {
      throw new NotFoundException('Car not found');
    }

    // Check if user already reviewed this car
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        newCarId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this car');
    }

    const overallRating = this.calculateOverallRating(
      rest.styleRating,
      rest.comfortRating,
      rest.fuelEconomyRating,
      rest.performanceRating,
      rest.valueForMoneyRating,
    );

    return this.prisma.review.create({
      data: {
        ...rest,
        overallRating,
        userId,
        newCarId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getReviewsByCarId(newCarId: string) {
    // Verify the car exists
    const newCar = await this.prisma.newCar.findUnique({
      where: { id: newCarId },
    });

    if (!newCar) {
      throw new NotFoundException('Car not found');
    }

    return this.prisma.review.findMany({
      where: { newCarId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(reviewId: string, userId: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new BadRequestException('You can only edit your own reviews');
    }

    const overallRating = updateReviewDto.styleRating
      ? this.calculateOverallRating(
          updateReviewDto.styleRating ?? review.styleRating,
          updateReviewDto.comfortRating ?? review.comfortRating,
          updateReviewDto.fuelEconomyRating ?? review.fuelEconomyRating,
          updateReviewDto.performanceRating ?? review.performanceRating,
          updateReviewDto.valueForMoneyRating ?? review.valueForMoneyRating,
        )
      : review.overallRating;

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...updateReviewDto,
        ...(updateReviewDto.styleRating && { overallRating }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async delete(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new BadRequestException('You can only delete your own reviews');
    }

    return this.prisma.review.delete({
      where: { id: reviewId },
    });
  }

  async getReviewStats(newCarId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { newCarId },
    });

    if (reviews.length === 0) {
      return null;
    }

    const avgOverall =
      reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length;
    const avgStyle =
      reviews.reduce((sum, r) => sum + r.styleRating, 0) / reviews.length;
    const avgComfort =
      reviews.reduce((sum, r) => sum + r.comfortRating, 0) / reviews.length;
    const avgFuelEconomy =
      reviews.reduce((sum, r) => sum + r.fuelEconomyRating, 0) / reviews.length;
    const avgPerformance =
      reviews.reduce((sum, r) => sum + r.performanceRating, 0) /
      reviews.length;
    const avgValueForMoney =
      reviews.reduce((sum, r) => sum + r.valueForMoneyRating, 0) /
      reviews.length;

    return {
      totalReviews: reviews.length,
      averageOverallRating: parseFloat(avgOverall.toFixed(2)),
      averageStyleRating: parseFloat(avgStyle.toFixed(2)),
      averageComfortRating: parseFloat(avgComfort.toFixed(2)),
      averageFuelEconomyRating: parseFloat(avgFuelEconomy.toFixed(2)),
      averagePerformanceRating: parseFloat(avgPerformance.toFixed(2)),
      averageValueForMoneyRating: parseFloat(avgValueForMoney.toFixed(2)),
    };
  }
}
