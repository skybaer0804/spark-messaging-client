import { Connection } from './core/connection';
import { MessageHandler } from './core/messageHandler';
import { RoomHandler } from './core/roomHandler';
import { ErrorHandler } from './utils/errorHandler';
import { loadConfig, DEFAULT_OPTIONS } from './config';
import { SparkMessagingOptions, MessageData, RoomMessageData, MessageCallback, RoomMessageCallback, ConnectedCallback, ErrorCallback } from './types';

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
    // 연결 전 이벤트 핸들러 대기 큐
    private pendingMessageCallbacks: MessageCallback[] = [];
    private pendingRoomMessageCallbacks: RoomMessageCallback[] = [];
    private pendingConnectedCallbacks: ConnectedCallback[] = [];

    constructor(options?: Partial<SparkMessagingOptions>) {
        // 환경 변수에서 설정 로드
        const envConfig = loadConfig();

        // 옵션 병합: 사용자 옵션 > 환경 변수 > 기본값
        this.options = {
            ...DEFAULT_OPTIONS,
            ...envConfig,
            ...options,
        } as SparkMessagingOptions;

        // 필수 옵션 검증
        if (!this.options.serverUrl) {
            throw new Error('serverUrl is required');
        }
        if (!this.options.projectKey) {
            throw new Error('projectKey is required');
        }

        this.errorHandler = new ErrorHandler();
        this.connection = new Connection(this.options, this.errorHandler);

        // autoConnect가 true인 경우 자동 연결
        if (this.options.autoConnect !== false) {
            this.connect().catch((error) => {
                console.error('Auto-connect failed:', error);
            });
        }
    }

    /**
     * SDK 초기화 및 연결
     */
    async connect(): Promise<void> {
        if (this.isInitialized && this.connection.isConnected()) {
            return;
        }

        await this.connection.connect();
        const socket = this.connection.getSocket();

        if (!socket) {
            throw new Error('Socket connection failed');
        }

        // 핸들러 초기화
        this.messageHandler = new MessageHandler(socket);
        this.roomHandler = new RoomHandler(socket);
        
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
        
        // 대기 큐 초기화
        this.pendingConnectedCallbacks = [];
        this.pendingMessageCallbacks = [];
        this.pendingRoomMessageCallbacks = [];
        
        this.isInitialized = true;
    }

    /**
     * 연결 종료
     */
    disconnect(): void {
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
    getSocketId(): string | undefined {
        return this.connection.getSocketId();
    }

    // ========== 메시지 API ==========

    /**
     * 메시지 전송
     */
    sendMessage(type: MessageData['type'], content: string, user?: string): void {
        if (!this.messageHandler) {
            throw new Error('SDK is not initialized. Call connect() first.');
        }
        this.messageHandler.sendMessage(type, content, user);
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
     * 방 메시지 전송
     */
    sendRoomMessage(room: string, type: MessageData['type'], content: string, user?: string): void {
        if (!this.messageHandler) {
            throw new Error('SDK is not initialized. Call connect() first.');
        }
        this.messageHandler.sendRoomMessage(room, type, content, user);
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
     */
    onConnected(callback: ConnectedCallback): () => void {
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
            throw new Error('SDK is not initialized. Call connect() first.');
        }
        return this.roomHandler.joinRoom(roomName);
    }

    /**
     * 방 나가기
     */
    async leaveRoom(roomName: string): Promise<void> {
        if (!this.roomHandler) {
            throw new Error('SDK is not initialized. Call connect() first.');
        }
        return this.roomHandler.leaveRoom(roomName);
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

// 팩토리 함수 제공
export function createSparkMessaging(options?: Partial<SparkMessagingOptions>): SparkMessaging {
    return new SparkMessaging(options);
}
