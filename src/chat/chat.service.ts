import { Injectable } from '@nestjs/common';
import { StreamChat } from 'stream-chat';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    private client: StreamChat;

    constructor(private prisma: PrismaService) {
        this.client = StreamChat.getInstance(
            process.env.STREAM_API_KEY!,
            process.env.STREAM_API_SECRET!
        );
    }

    async generateToken(userId: string) {
        const token = this.client.createToken(userId);
        return { streamToken: token };
    }

    async createMessage(senderId: string, receiverId: string, listingId: string, content: string) {
        const message = await this.prisma.message.create({
            data: {
                content,
                senderId,
                receiverId,
                listingId,
            },
            include: {
                sender: { select: { id: true, name: true, email: true } },
                receiver: { select: { id: true, name: true, email: true } },
                listing: { select: { id: true, title: true } },
            },
        });

        return message;
    }

    async getMessagesBetweenUsers(userId1: string, userId2: string, listingId: string) {
        const messages = await this.prisma.message.findMany({
            where: {
                listingId,
                OR: [
                    { senderId: userId1, receiverId: userId2 },
                    { senderId: userId2, receiverId: userId1 },
                ],
            },
            include: {
                sender: { select: { id: true, name: true, email: true } },
                receiver: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        return messages;
    }

    async getConversationsForUser(userId: string) {
        const conversations = await this.prisma.message.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
            include: {
                sender: { select: { id: true, name: true, email: true } },
                receiver: { select: { id: true, name: true, email: true } },
                listing: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: 'desc' },
            distinct: ['senderId', 'receiverId', 'listingId'],
        });

        return conversations;
    }
}
