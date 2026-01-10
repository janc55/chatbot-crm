import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join_room')
    handleJoinRoom(client: Socket, leadId: string) {
        client.join(`lead_${leadId}`);
        this.logger.log(`Client ${client.id} joined room: lead_${leadId}`);
        return { event: 'joined', data: leadId };
    }

    @SubscribeMessage('leave_room')
    handleLeaveRoom(client: Socket, leadId: string) {
        client.leave(`lead_${leadId}`);
        this.logger.log(`Client ${client.id} left room: lead_${leadId}`);
        return { event: 'left', data: leadId };
    }

    // Method to emit new messages to all clients in a room
    emitMessageToRoom(leadId: string, message: any) {
        console.log('Gateway: Emitting message to room lead_' + leadId, message);
        this.server.to(`lead_${leadId}`).emit('receive_message', message);
        this.logger.log(`Message emitted to room lead_${leadId}`);
    }
}
