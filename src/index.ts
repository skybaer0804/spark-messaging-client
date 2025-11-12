import { Connection } from './core/connection';
import { MessageHandler } from './core/messageHandler';
import { RoomHandler } from './core/roomHandler';
import { ErrorHandler } from './utils/errorHandler';
import { SparkMessagingError } from './utils/sparkMessagingError';
import { loadConfig, DEFAULT_OPTIONS } from './config';
import {
    SparkMessagingOptions,
    MessageData,
    RoomMessageData,
    MessageCallback,
    RoomMessageCallback,
    ConnectedCallback,
    ErrorCallback,
    ConnectionStatus,
    ConnectionData,
    ConnectionStateChangeCallback,
    RoomJoinedCallback,
    RoomLeftCallback,
} from './types';

/**
 * Spark Messaging Client SDK
 */
export class SparkMessaging {
    private connection: Connection;
    private messageHandler: MessageHandler | null = null;
    private roomHandler: RoomHandler | null = null;
    private errorHandler: ErrorHandler;
    private options: SparkMessagingOptions;
    private isInitialized: boolean = false;
    private connectedAt: Date | null = null;
    // 연결 전 이벤트 핸들러 대기 큐
    private pendingMessageCallbacks: MessageCallback[] = [];
    private pendingRoomMessageCallbacks: RoomMessageCallback[] = [];
    private pendingConnectedCallbacks: ConnectedCallback[] = [];
    // 연결 상태 변경 콜백
    private connectionStateChangeCallbacks: ConnectionStateChangeCallback[] = [];
    // Room 이벤트 콜백
    private roomJoinedCallbacks: RoomJoinedCallback[] = [];
    private roomLeftCallbacks: RoomLeftCallback[] = [];

    /**
     * 생성자 오버로드 1: 옵션 객체로 초기화
     */
    constructor(options?: Partial<SparkMessagingOptions>);
    /**
     * 생성자 오버로드 2: serverUrl과 projectKey 직접 전달
     */
    constructor(serverUrl: string, projectKey: string);
    constructor(optionsOrServerUrl?: Partial<SparkMessagingOptions> | string, projectKey?: string) {
        // 환경 변수에서 설정 로드
        const envConfig = loadConfig();

        // 생성자 오버로드 처리
        let options: Partial<SparkMessagingOptions>;
        if (typeof optionsOrServerUrl === 'string' && projectKey) {
            // 생성자 오버로드 2: serverUrl, projectKey 직접 전달
            options = {
                serverUrl: optionsOrServerUrl,
                projectKey: projectKey,
            };
        } else {
            // 생성자 오버로드 1: 옵션 객체
            options = (optionsOrServerUrl as Partial<SparkMessagingOptions>) || {};
        }

        // 옵션 병합: 사용자 옵션 > 환경 변수 > 기본값
        this.options = {
            ...DEFAULT_OPTIONS,
            ...envConfig,
            ...options,
        } as SparkMessagingOptions;

        // 필수 옵션 검증
        if (!this.options.serverUrl) {
            throw new SparkMessagingError({
                message: 'serverUrl is required',
                code: 'INVALID_OPTIONS',
            });
        }
        if (!this.options.projectKey) {
            throw new SparkMessagingError({
                message: 'projectKey is required',
                code: 'INVALID_OPTIONS',
            });
        }

        // 디버그 모드 로깅
        if (this.options.debug) {
            console.log('[SparkMessaging] Initializing with options:', this.options);
        }

        this.errorHandler = new ErrorHandler();
        this.connection = new Connection(this.options, this.errorHandler);

        // autoConnect가 true인 경우 자동 연결
        if (this.options.autoConnect !== false) {
            this.connect().catch((error) => {
                const sparkError =
                    error instanceof SparkMessagingError
                        ? error
                        : new SparkMessagingError({
                              message: error.message || 'Auto-connect failed',
                              code: 'AUTO_CONNECT_FAILED',
                          });
                this.errorHandler.handleError(sparkError.toErrorData());
                if (this.options.debug) {
                    console.error('[SparkMessaging] Auto-connect failed:', error);
                }
            });
        }
    }

    /**
     * SDK 초기화 및 연결
     */
    async connect(): Promise<void> {
        if (this.isInitialized && this.connection.isConnected()) {
            if (this.options.debug) {
                console.log('[SparkMessaging] Already connected');
            }
            return;
        }

        if (this.options.debug) {
            console.log('[SparkMessaging] Connecting...');
        }

        await this.connection.connect();
        const socket = this.connection.getSocket();

        if (!socket) {
            throw new SparkMessagingError({
                message: 'Socket connection failed',
                code: 'CONNECTION_FAILED',
            });
        }

        // 연결 시간 기록
        this.connectedAt = new Date();

        // 핸들러 초기화
        this.messageHandler = new MessageHandler(socket);
        this.roomHandler = new RoomHandler(socket);

        // Room 이벤트 리스너 설정
        this.setupRoomEventListeners();

        // 대기 중인 콜백들을 등록
        this.pendingConnectedCallbacks.forEach((callback) => {
            this.messageHandler!.onConnected(callback);
        });
        this.pendingMessageCallbacks.forEach((callback) => {
            this.messageHandler!.onMessage(callback);
        });
        this.pendingRoomMessageCallbacks.forEach((callback) => {
            this.messageHandler!.onRoomMessage(callback);
        });

        // 이미 연결된 상태이므로 연결된 콜백 즉시 호출
        if (this.connection.isConnected() && this.pendingConnectedCallbacks.length > 0) {
            const socketId = this.connection.getSocketId() || '';
            const connectionData: ConnectionData = {
                socketId,
                connectedAt: this.connectedAt,
            };
            this.pendingConnectedCallbacks.forEach((callback) => {
                try {
                    callback({
                        message: 'Connected to server',
                        socketId,
                        connectedAt: this.connectedAt!,
                    });
                } catch (error) {
                    console.error('[SparkMessaging] Error in connected callback:', error);
                }
            });
        }

        // 대기 큐 초기화
        this.pendingConnectedCallbacks = [];
        this.pendingMessageCallbacks = [];
        this.pendingRoomMessageCallbacks = [];

        this.isInitialized = true;

        // 연결 상태 변경 이벤트 발생
        this.notifyConnectionStateChange(true);

        if (this.options.debug) {
            console.log('[SparkMessaging] Connected successfully. Socket ID:', socket.id);
        }
    }

    /**
     * Room 이벤트 리스너 설정
     */
    private setupRoomEventListeners(): void {
        if (!this.roomHandler) return;

        // Room 입장/나가기 이벤트는 RoomHandler에서 직접 처리하도록 수정 필요
        // 현재는 joinRoom/leaveRoom 호출 시점에 이벤트 발생
    }

    /**
     * 연결 종료
     */
    disconnect(): void {
        if (this.options.debug) {
            console.log('[SparkMessaging] Disconnecting...');
        }

        const wasConnected = this.isInitialized && this.connection.isConnected();

        if (this.roomHandler) {
            this.roomHandler.clear();
        }
        if (this.messageHandler) {
            this.messageHandler.clear();
        }
        this.connection.disconnect();
        this.errorHandler.clear();
        // 대기 큐도 초기화
        this.pendingConnectedCallbacks = [];
        this.pendingMessageCallbacks = [];
        this.pendingRoomMessageCallbacks = [];
        this.isInitialized = false;
        this.connectedAt = null;

        // 연결 상태 변경 이벤트 발생
        if (wasConnected) {
            this.notifyConnectionStateChange(false);
        }

        if (this.options.debug) {
            console.log('[SparkMessaging] Disconnected');
        }
    }

    /**
     * 연결 상태 확인
     */
    isConnected(): boolean {
        return this.connection.isConnected();
    }

    /**
     * Socket ID 가져오기
     */
    getSocketId(): string | null {
        return this.connection.getSocketId() || null;
    }

    /**
     * 연결 상태 정보 가져오기
     */
    getConnectionStatus(): ConnectionStatus {
        return {
            isConnected: this.connection.isConnected(),
            socketId: this.connection.getSocketId() || null,
            connectedAt: this.connectedAt,
        };
    }

    /**
     * 연결 완료까지 대기
     * 이미 연결되어 있으면 즉시 반환
     */
    async waitForConnection(): Promise<ConnectionData | null> {
        if (this.connection.isConnected() && this.connectedAt) {
            return {
                socketId: this.connection.getSocketId()!,
                connectedAt: this.connectedAt,
            };
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(
                    new SparkMessagingError({
                        message: 'Connection timeout',
                        code: 'CONNECTION_TIMEOUT',
                    })
                );
            }, 30000); // 30초 타임아웃

            const unsubscribe = this.onConnected((data) => {
                clearTimeout(timeout);
                unsubscribe();
                resolve({
                    socketId: data.socketId,
                    connectedAt: data.connectedAt || new Date(),
                });
            });

            // 연결 시도
            if (!this.isInitialized) {
                this.connect().catch((error) => {
                    clearTimeout(timeout);
                    unsubscribe();
                    reject(error);
                });
            }
        });
    }

    // ========== 메시지 API ==========

    /**
     * 메시지 전송 (Promise 기반)
     */
    async sendMessage(type: MessageData['type'], content: string, user?: string): Promise<void> {
        if (!this.messageHandler) {
            throw new SparkMessagingError({
                message: 'SDK is not initialized. Call connect() first.',
                code: 'NOT_INITIALIZED',
            });
        }

        if (!this.connection.isConnected()) {
            throw new SparkMessagingError({
                message: 'Socket is not connected',
                code: 'NOT_CONNECTED',
            });
        }

        try {
            this.messageHandler.sendMessage(type, content, user);
            // 메시지 전송은 emit이므로 즉시 성공으로 간주
            // 실제 전송 실패는 onError로 처리됨
        } catch (error) {
            throw new SparkMessagingError({
                message: error instanceof Error ? error.message : 'Failed to send message',
                code: 'SEND_MESSAGE_FAILED',
            });
        }
    }

    /**
     * 메시지 수신 콜백 등록
     */
    onMessage(callback: MessageCallback): () => void {
        if (this.messageHandler) {
            return this.messageHandler.onMessage(callback);
        }
        // 연결 전이면 대기 큐에 추가
        this.pendingMessageCallbacks.push(callback);
        // 구독 해제 함수 반환
        return () => {
            const index = this.pendingMessageCallbacks.indexOf(callback);
            if (index > -1) {
                this.pendingMessageCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * 방 메시지 전송 (Promise 기반)
     */
    async sendRoomMessage(room: string, type: MessageData['type'], content: string, user?: string): Promise<void> {
        if (!this.messageHandler) {
            throw new SparkMessagingError({
                message: 'SDK is not initialized. Call connect() first.',
                code: 'NOT_INITIALIZED',
            });
        }

        if (!this.connection.isConnected()) {
            throw new SparkMessagingError({
                message: 'Socket is not connected',
                code: 'NOT_CONNECTED',
            });
        }

        try {
            this.messageHandler.sendRoomMessage(room, type, content, user);
            // 메시지 전송은 emit이므로 즉시 성공으로 간주
            // 실제 전송 실패는 onError로 처리됨
        } catch (error) {
            throw new SparkMessagingError({
                message: error instanceof Error ? error.message : 'Failed to send room message',
                code: 'SEND_ROOM_MESSAGE_FAILED',
            });
        }
    }

    /**
     * 방 메시지 수신 콜백 등록
     */
    onRoomMessage(callback: RoomMessageCallback): () => void {
        if (this.messageHandler) {
            return this.messageHandler.onRoomMessage(callback);
        }
        // 연결 전이면 대기 큐에 추가
        this.pendingRoomMessageCallbacks.push(callback);
        // 구독 해제 함수 반환
        return () => {
            const index = this.pendingRoomMessageCallbacks.indexOf(callback);
            if (index > -1) {
                this.pendingRoomMessageCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * 연결 성공 콜백 등록
     * 이미 연결되어 있으면 즉시 콜백 호출
     */
    onConnected(callback: ConnectedCallback): () => void {
        // 이미 연결되어 있으면 즉시 콜백 호출
        if (this.connection.isConnected() && this.connectedAt) {
            const socketId = this.connection.getSocketId() || '';
            try {
                callback({
                    message: 'Connected to server',
                    socketId,
                    connectedAt: this.connectedAt,
                });
            } catch (error) {
                console.error('[SparkMessaging] Error in connected callback:', error);
            }
        }

        if (this.messageHandler) {
            return this.messageHandler.onConnected(callback);
        }
        // 연결 전이면 대기 큐에 추가
        this.pendingConnectedCallbacks.push(callback);
        // 구독 해제 함수 반환
        return () => {
            const index = this.pendingConnectedCallbacks.indexOf(callback);
            if (index > -1) {
                this.pendingConnectedCallbacks.splice(index, 1);
            }
        };
    }

    // ========== 방 API ==========

    /**
     * 방 입장
     */
    async joinRoom(roomName: string): Promise<void> {
        if (!this.roomHandler) {
            throw new SparkMessagingError({
                message: 'SDK is not initialized. Call connect() first.',
                code: 'NOT_INITIALIZED',
            });
        }

        await this.roomHandler.joinRoom(roomName);

        // Room 입장 이벤트 발생
        this.notifyRoomJoined(roomName);
    }

    /**
     * 방 나가기
     */
    async leaveRoom(roomName: string): Promise<void> {
        if (!this.roomHandler) {
            throw new SparkMessagingError({
                message: 'SDK is not initialized. Call connect() first.',
                code: 'NOT_INITIALIZED',
            });
        }

        await this.roomHandler.leaveRoom(roomName);

        // Room 나가기 이벤트 발생
        this.notifyRoomLeft(roomName);
    }

    /**
     * 참여 중인 방 목록 가져오기
     */
    getJoinedRooms(): string[] {
        if (!this.roomHandler) {
            return [];
        }
        return this.roomHandler.getJoinedRooms();
    }

    /**
     * 특정 방에 참여 중인지 확인
     */
    isInRoom(roomName: string): boolean {
        if (!this.roomHandler) {
            return false;
        }
        return this.roomHandler.isInRoom(roomName);
    }

    // ========== 에러 처리 API ==========

    /**
     * 에러 콜백 등록
     */
    onError(callback: ErrorCallback): () => void {
        return this.errorHandler.onError(callback);
    }

    // ========== 연결 상태 변경 이벤트 ==========

    /**
     * 연결 상태 변경 콜백 등록
     */
    onConnectionStateChange(callback: ConnectionStateChangeCallback): () => void {
        this.connectionStateChangeCallbacks.push(callback);
        return () => {
            const index = this.connectionStateChangeCallbacks.indexOf(callback);
            if (index > -1) {
                this.connectionStateChangeCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * 연결 상태 변경 알림
     */
    private notifyConnectionStateChange(isConnected: boolean): void {
        this.connectionStateChangeCallbacks.forEach((callback) => {
            try {
                callback(isConnected);
            } catch (error) {
                console.error('[SparkMessaging] Error in connection state change callback:', error);
            }
        });
    }

    // ========== Room 이벤트 ==========

    /**
     * Room 입장 콜백 등록
     */
    onRoomJoined(callback: RoomJoinedCallback): () => void {
        this.roomJoinedCallbacks.push(callback);
        return () => {
            const index = this.roomJoinedCallbacks.indexOf(callback);
            if (index > -1) {
                this.roomJoinedCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Room 나가기 콜백 등록
     */
    onRoomLeft(callback: RoomLeftCallback): () => void {
        this.roomLeftCallbacks.push(callback);
        return () => {
            const index = this.roomLeftCallbacks.indexOf(callback);
            if (index > -1) {
                this.roomLeftCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Room 입장 알림
     */
    private notifyRoomJoined(roomId: string): void {
        this.roomJoinedCallbacks.forEach((callback) => {
            try {
                callback(roomId);
            } catch (error) {
                console.error('[SparkMessaging] Error in room joined callback:', error);
            }
        });
    }

    /**
     * Room 나가기 알림
     */
    private notifyRoomLeft(roomId: string): void {
        this.roomLeftCallbacks.forEach((callback) => {
            try {
                callback(roomId);
            } catch (error) {
                console.error('[SparkMessaging] Error in room left callback:', error);
            }
        });
    }

    // ========== 기타 유틸리티 ==========

    /**
     * 현재 설정 가져오기
     */
    getOptions(): SparkMessagingOptions {
        return { ...this.options };
    }
}

// 기본 export
export default SparkMessaging;

// 타입 export
export * from './types';

// 에러 클래스 export
export { SparkMessagingError } from './utils/sparkMessagingError';

// 팩토리 함수 제공
export function createSparkMessaging(options?: Partial<SparkMessagingOptions>): SparkMessaging {
    return new SparkMessaging(options);
}
