import { ErrorData } from '../types';

/**
 * 에러 처리 유틸리티
 */
export class ErrorHandler {
    private errorCallbacks: Array<(error: ErrorData) => void> = [];

    /**
     * 에러 콜백 등록
     */
    onError(callback: (error: ErrorData) => void): () => void {
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
    handleError(error: ErrorData | Error | string): void {
        let errorData: ErrorData;

        if (typeof error === 'string') {
            errorData = { message: error };
        } else if (error instanceof Error) {
            errorData = { message: error.message };
        } else {
            errorData = error;
        }

        this.errorCallbacks.forEach((callback) => {
            try {
                callback(errorData);
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
