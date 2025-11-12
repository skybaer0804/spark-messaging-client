import type { SparkMessagingError } from '../utils/sparkMessagingError';

/**
 * 메시지 타입 정의
 */
export type MessageType = 'chat' | 'notification' | 'system' | 'test';

/**
 * 메시지 데이터 구조
 */
export interface MessageData {
    type: MessageType;
    content: string;
    user?: string;
    timestamp?: number;
    room?: string;
    senderId?: string;
}

/**
 * 방 메시지 데이터 구조
 */
export interface RoomMessageData {
    room: string;
    type: MessageType;
    content: string;
    user?: string;
    timestamp?: number;
    senderId?: string;
}

/**
 * 연결 성공 응답 데이터
 */
export interface ConnectedData {
    message: string;
    socketId: string;
    connectedAt?: Date;
}

/**
 * 연결 상태 정보
 */
export interface ConnectionStatus {
    isConnected: boolean;
    socketId: string | null;
    connectedAt: Date | null;
}

/**
 * 연결 데이터 (ConnectionData)
 */
export interface ConnectionData {
    socketId: string;
    connectedAt: Date;
}

/**
 * 에러 데이터 구조
 */
export interface ErrorData {
    message: string;
    code?: string;
    statusCode?: number;
    details?: any;
}

/**
 * 연결 재시도 옵션
 */
export interface RetryOptions {
    maxRetries?: number; // 기본값: 5
    retryDelay?: number; // 기본값: 1000ms
    exponentialBackoff?: boolean; // 기본값: true
}

/**
 * SDK 초기화 옵션
 */
export interface SparkMessagingOptions {
    serverUrl: string;
    projectKey: string;
    autoConnect?: boolean; // 기본값: true
    reconnection?: boolean; // 기본값: true
    reconnectionAttempts?: number; // 기본값: 5
    reconnectionDelay?: number; // 기본값: 1000
    retry?: RetryOptions; // 연결 재시도 옵션
    debug?: boolean; // 디버그 모드 (기본값: false)
}

/**
 * 이벤트 콜백 타입
 */
export type MessageCallback = (data: MessageData) => void;
export type RoomMessageCallback = (data: RoomMessageData) => void;
export type ConnectedCallback = (data: ConnectedData) => void;
export type ErrorCallback = (error: ErrorData | SparkMessagingError) => void;
export type GenericCallback = (data: any) => void;
export type ConnectionStateChangeCallback = (isConnected: boolean) => void;
export type RoomJoinedCallback = (roomId: string) => void;
export type RoomLeftCallback = (roomId: string) => void;
