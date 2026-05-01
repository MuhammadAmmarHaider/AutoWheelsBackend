import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { ListingModule } from './listing/listing.module';
import { BrandModule } from './brand/brand.module';
import { CityModule } from './city/city.module';
import { FavoriteModule } from './favorite/favorite.module';
import { UploadModule } from './upload/upload.module';

@Module({
    imports: [
        PrismaModule,
        ConfigModule.forRoot({ isGlobal: true }),
        AuthModule,
        UserModule,
        ChatModule,
        ListingModule,
        BrandModule,
        CityModule,
        FavoriteModule,
        UploadModule,
    ],
})
export class AppModule {}
