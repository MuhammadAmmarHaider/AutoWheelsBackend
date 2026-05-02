import { Module } from '@nestjs/common';
import { NewCarService } from './new-car.service';
import { NewCarController } from './new-car.controller';

@Module({
  providers: [NewCarService],
  controllers: [NewCarController]
})
export class NewCarModule {}
