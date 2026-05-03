import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
// Import the PrismaModule to allow UserService to interact with the database
@Module({
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService]
})
export class UserModule {}
