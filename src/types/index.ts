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
}

/**
 * 연결 성공 응답 데이터
 */
export interface ConnectedData {
    message: string;
    socketId: string;
}

/**
 * 에러 데이터 구조
 */
export interface ErrorData {
    message: string;
    code?: string;
}

/**
 * SDK 초기화 옵션
 */
export interface SparkMessagingOptions {
    serverUrl: string;
    projectKey: string;
    autoConnect?: boolean;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
}

/**
 * 이벤트 콜백 타입
 */
export type MessageCallback = (data: MessageData) => void;
export type RoomMessageCallback = (data: RoomMessageData) => void;
export type ConnectedCallback = (data: ConnectedData) => void;
export type ErrorCallback = (error: ErrorData) => void;
export type GenericCallback = (data: any) => void;
