import { ErrorData } from '../types';

/**
 * Spark Messaging SDK 전용 에러 클래스
 */
export class SparkMessagingError extends Error {
    public readonly code: string;
    public readonly statusCode?: number;
    public readonly details?: any;

    constructor(errorData: ErrorData | string) {
        if (typeof errorData === 'string') {
            super(errorData);
            this.code = 'UNKNOWN_ERROR';
        } else {
            super(errorData.message);
            this.code = errorData.code || 'UNKNOWN_ERROR';
            this.statusCode = errorData.statusCode;
            this.details = errorData.details;
        }

        // TypeScript에서 Error를 상속할 때 필요
        Object.setPrototypeOf(this, SparkMessagingError.prototype);
        this.name = 'SparkMessagingError';
    }

    /**
     * 에러 데이터로 변환
     */
    toErrorData(): ErrorData {
        return {
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            details: this.details,
        };
    }

    /**
     * 에러 코드별 처리
     */
    static isConnectionError(error: any): boolean {
        return error instanceof SparkMessagingError && (error.code === 'CONNECTION_ERROR' || error.code === 'CONNECTION_FAILED');
    }

    static isAuthenticationError(error: any): boolean {
        return error instanceof SparkMessagingError && error.code === 'AUTHENTICATION_FAILED';
    }
}
