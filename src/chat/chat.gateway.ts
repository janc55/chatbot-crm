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
    handleJoinRoom(client: Socket, personId: string) {
        client.join(`person_${personId}`);
        this.logger.log(`Client ${client.id} joined room: person_${personId}`);
        return { event: 'joined', data: personId };
    }

    @SubscribeMessage('leave_room')
    handleLeaveRoom(client: Socket, personId: string) {
        client.leave(`person_${personId}`);
        this.logger.log(`Client ${client.id} left room: person_${personId}`);
        return { event: 'left', data: personId };
    }

    // Method to emit new messages to all clients in a room
    emitMessageToRoom(personId: string, message: any) {
        console.log('Gateway: Emitting message to room person_' + personId, message);
        this.server.to(`person_${personId}`).emit('receive_message', message);
        this.logger.log(`Message emitted to room person_${personId}`);
    }
}
