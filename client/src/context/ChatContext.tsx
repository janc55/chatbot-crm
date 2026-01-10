import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
    id?: string;
    direction: 'INBOUND' | 'OUTBOUND';
    content: string;
    createdAt: Date;
    messageType: string;
}

interface ChatContextType {
    socket: Socket | null;
    messages: Message[];
    currentLeadId: string | null;
    joinRoom: (leadId: string) => void;
    leaveRoom: () => void;
    sendMessage: (message: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);

    useEffect(() => {
        // Connect to WebSocket server
        const socketInstance = io('http://localhost:3000', {
            transports: ['websocket'],
        });

        socketInstance.on('connect', () => {
            console.log('WebSocket connected');
        });

        socketInstance.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });

        socketInstance.on('receive_message', (message: Message) => {
            console.log('Received message via WebSocket:', message);
            setMessages((prev) => [...prev, message]);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    const joinRoom = (leadId: string) => {
        if (socket) {
            socket.emit('join_room', leadId);
            setCurrentLeadId(leadId);
            setMessages([]); // Clear messages when switching rooms
        }
    };

    const leaveRoom = () => {
        if (socket && currentLeadId) {
            socket.emit('leave_room', currentLeadId);
            setCurrentLeadId(null);
            setMessages([]);
        }
    };

    const sendMessage = async (message: string) => {
        if (!currentLeadId) return;

        console.log('sendMessage called with message:', message, 'leadId:', currentLeadId);
        try {
            const response = await fetch('http://localhost:3000/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    leadId: currentLeadId,
                    message,
                }),
            });

            console.log('Fetch response status:', response.status);
            if (!response.ok) {
                throw new Error('Failed to send message');
            }
            console.log('Message sent to backend');
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    };

    return (
        <ChatContext.Provider value={{ socket, messages, currentLeadId, joinRoom, leaveRoom, sendMessage }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
