import { Module } from '@nestjs/common';
import { FavoriteController } from './favorite.controller';
import { FavoriteService } from './favorite.service';
// The FavoriteModule is responsible for managing user favorites, allowing users to add, remove, and retrieve their favorite listings. It includes the FavoriteController for handling HTTP requests and the FavoriteService for business logic related to favorites.
@Module({
    controllers: [FavoriteController],
    providers: [FavoriteService],
})
export class FavoriteModule {}
