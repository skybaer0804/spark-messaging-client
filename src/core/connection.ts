import { io, Socket } from 'socket.io-client';
import { SparkMessagingOptions } from '../types';
import { ErrorHandler } from '../utils/errorHandler';

/**
 * Socket 연결 관리 클래스
 */
export class Connection {
    private socket: Socket | null = null;
    private options: SparkMessagingOptions;
    private errorHandler: ErrorHandler;
    private isConnecting: boolean = false;

    constructor(options: SparkMessagingOptions, errorHandler: ErrorHandler) {
        this.options = options;
        this.errorHandler = errorHandler;
    }

    /**
     * Socket 연결 초기화
     */
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.socket?.connected) {
                resolve();
                return;
            }

            if (this.isConnecting) {
                reject(new Error('Connection already in progress'));
                return;
            }

            this.isConnecting = true;

            try {
                // Socket.IO 연결 옵션 설정
                const socketOptions: any = {
                    auth: {
                        key: this.options.projectKey,
                    },
                    query: {
                        key: this.options.projectKey,
                    },
                    reconnection: this.options.reconnection ?? true,
                    reconnectionAttempts: this.options.reconnectionAttempts ?? 5,
                    reconnectionDelay: this.options.reconnectionDelay ?? 1000,
                };

                this.socket = io(this.options.serverUrl, socketOptions);

                // 연결 성공 핸들러
                this.socket.on('connect', () => {
                    this.isConnecting = false;
                    resolve();
                });

                // 연결 실패 핸들러
                this.socket.on('connect_error', (error: Error) => {
                    this.isConnecting = false;
                    this.errorHandler.handleError({
                        message: error.message || 'Connection failed',
                        code: 'CONNECTION_ERROR',
                    });
                    reject(error);
                });

                // 에러 핸들러
                this.socket.on('error', (error: any) => {
                    this.errorHandler.handleError({
                        message: error.message || 'Socket error occurred',
                        code: error.code || 'SOCKET_ERROR',
                    });
                });

                // 연결 끊김 핸들러
                this.socket.on('disconnect', (reason: string) => {
                    if (reason === 'io server disconnect') {
                        // 서버가 연결을 끊은 경우 (예: 인증 실패)
                        this.errorHandler.handleError({
                            message: 'Server disconnected',
                            code: 'SERVER_DISCONNECT',
                        });
                    }
                });
            } catch (error) {
                this.isConnecting = false;
                const err = error instanceof Error ? error : new Error('Unknown connection error');
                this.errorHandler.handleError(err);
                reject(err);
            }
        });
    }

    /**
     * Socket 연결 종료
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnecting = false;
    }

    /**
     * Socket 인스턴스 가져오기
     */
    getSocket(): Socket | null {
        return this.socket;
    }

    /**
     * 연결 상태 확인
     */
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    /**
     * Socket ID 가져오기
     */
    getSocketId(): string | undefined {
        return this.socket?.id;
    }
}
