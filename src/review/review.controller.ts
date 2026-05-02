import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto, UpdateReviewDto } from './dto';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@GetUser('id') userId: string, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.create(userId, createReviewDto);
  }

  @Get('car/:newCarId')
  getByCarId(@Param('newCarId') newCarId: string) {
    return this.reviewService.getReviewsByCarId(newCarId);
  }

  @Get('stats/:newCarId')
  getStats(@Param('newCarId') newCarId: string) {
    return this.reviewService.getReviewStats(newCarId);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewService.update(id, userId, updateReviewDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  delete(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.reviewService.delete(id, userId);
  }
}
