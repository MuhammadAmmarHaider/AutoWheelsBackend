import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { ChatService } from './chat.service';
import { GetUser } from '../auth/decorator';
import type { User } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('chat')
export class ChatController {
    constructor(private chatService: ChatService) {}

    @Post('token')
    async getStreamToken(@GetUser() user: User) {
        return this.chatService.generateToken(user.id);
    }

    @Post('send')
    async sendMessage(
        @GetUser() user: User,
        @Body() body: { receiverId: string; listingId: string; content: string }
    ) {
        return this.chatService.createMessage(
            user.id,
            body.receiverId,
            body.listingId,
            body.content
        );
    }

    @Get('messages/:userId/:listingId')
    async getMessages(
        @GetUser() user: User,
        @Param('userId') userId: string,
        @Param('listingId') listingId: string
    ) {
        return this.chatService.getMessagesBetweenUsers(user.id, userId, listingId);
    }

    @Get('conversations')
    async getConversations(@GetUser() user: User) {
        return this.chatService.getConversationsForUser(user.id);
    }
}
