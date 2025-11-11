import { Socket } from 'socket.io-client';
import { MessageData, RoomMessageData, MessageCallback, RoomMessageCallback, ConnectedCallback } from '../types';

/**
 * 메시지 핸들링 클래스
 */
export class MessageHandler {
    private socket: Socket;
    private messageCallbacks: MessageCallback[] = [];
    private roomMessageCallbacks: RoomMessageCallback[] = [];
    private connectedCallbacks: ConnectedCallback[] = [];

    constructor(socket: Socket) {
        this.socket = socket;
        this.setupEventListeners();
    }

    /**
     * 기본 이벤트 리스너 설정
     */
    private setupEventListeners(): void {
        // 연결 성공 이벤트
        this.socket.on('connected', (data: any) => {
            this.connectedCallbacks.forEach((callback) => {
                try {
                    callback({
                        message: data.message || 'Connected to server',
                        socketId: data.socketId || this.socket.id || '',
                    });
                } catch (error) {
                    console.error('Error in connected callback:', error);
                }
            });
        });

        // 일반 메시지 이벤트
        this.socket.on('message', (data: MessageData) => {
            this.messageCallbacks.forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in message callback:', error);
                }
            });
        });

        // 방 메시지 이벤트
        this.socket.on('room-message', (data: RoomMessageData) => {
            this.roomMessageCallbacks.forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in room-message callback:', error);
                }
            });
        });
    }

    /**
     * 메시지 전송
     */
    sendMessage(type: MessageData['type'], content: string, user?: string): void {
        if (!this.socket.connected) {
            throw new Error('Socket is not connected');
        }

        const messageData: MessageData = {
            type,
            content,
            user,
            timestamp: Date.now(),
        };

        this.socket.emit('message', messageData);
    }

    /**
     * 방 메시지 전송
     */
    sendRoomMessage(room: string, type: MessageData['type'], content: string, user?: string): void {
        if (!this.socket.connected) {
            throw new Error('Socket is not connected');
        }

        const messageData: RoomMessageData = {
            room,
            type,
            content,
            user,
            timestamp: Date.now(),
        };

        this.socket.emit('room-message', messageData);
    }

    /**
     * 메시지 수신 콜백 등록
     */
    onMessage(callback: MessageCallback): () => void {
        this.messageCallbacks.push(callback);
        // 구독 해제 함수 반환
        return () => {
            const index = this.messageCallbacks.indexOf(callback);
            if (index > -1) {
                this.messageCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * 방 메시지 수신 콜백 등록
     */
    onRoomMessage(callback: RoomMessageCallback): () => void {
        this.roomMessageCallbacks.push(callback);
        // 구독 해제 함수 반환
        return () => {
            const index = this.roomMessageCallbacks.indexOf(callback);
            if (index > -1) {
                this.roomMessageCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * 연결 성공 콜백 등록
     */
    onConnected(callback: ConnectedCallback): () => void {
        this.connectedCallbacks.push(callback);
        // 구독 해제 함수 반환
        return () => {
            const index = this.connectedCallbacks.indexOf(callback);
            if (index > -1) {
                this.connectedCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * 모든 콜백 제거
     */
    clear(): void {
        this.messageCallbacks = [];
        this.roomMessageCallbacks = [];
        this.connectedCallbacks = [];
    }
}
