import { Module } from '@nestjs/common';
import { NewCarService } from './new-car.service';
import { NewCarController } from './new-car.controller';
// Import the PrismaModule to allow NewCarService to interact with the database
@Module({
  providers: [NewCarService],
  controllers: [NewCarController]
})
export class NewCarModule {}
