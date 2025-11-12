import { ErrorData, ErrorCallback } from '../types';
import { SparkMessagingError } from './sparkMessagingError';

/**
 * 에러 처리 유틸리티
 */
export class ErrorHandler {
    private errorCallbacks: ErrorCallback[] = [];

    /**
     * 에러 콜백 등록
     */
    onError(callback: ErrorCallback): () => void {
        this.errorCallbacks.push(callback);
        // 구독 해제 함수 반환
        return () => {
            const index = this.errorCallbacks.indexOf(callback);
            if (index > -1) {
                this.errorCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * 에러 발생 시 모든 콜백 호출
     */
    handleError(error: ErrorData | Error | SparkMessagingError | string): void {
        let errorToEmit: ErrorData | SparkMessagingError;

        if (typeof error === 'string') {
            errorToEmit = { message: error };
        } else if (error instanceof SparkMessagingError) {
            errorToEmit = error;
        } else if (error instanceof Error) {
            errorToEmit = { message: error.message };
        } else {
            errorToEmit = error;
        }

        this.errorCallbacks.forEach((callback) => {
            try {
                callback(errorToEmit);
            } catch (err) {
                console.error('Error in error callback:', err);
            }
        });
    }

    /**
     * 모든 에러 콜백 제거
     */
    clear(): void {
        this.errorCallbacks = [];
    }
}
