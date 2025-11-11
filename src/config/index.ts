import { SparkMessagingOptions } from '../types';

/**
 * 환경 변수에서 설정을 로드하거나 기본값 사용
 */
export function loadConfig(): Partial<SparkMessagingOptions> {
    const config: Partial<SparkMessagingOptions> = {};

    // 브라우저 환경
    if (typeof window !== 'undefined') {
        // @ts-ignore - 환경 변수는 런타임에 설정됨
        const win = window as any;
        if (win.SPARK_MESSAGING_CONFIG) {
            const windowConfig = win.SPARK_MESSAGING_CONFIG;
            if (windowConfig.SERVER_URL) config.serverUrl = windowConfig.SERVER_URL;
            if (windowConfig.PROJECT_KEY) config.projectKey = windowConfig.PROJECT_KEY;
        }
    }

    // Node.js 환경
    if (typeof process !== 'undefined' && (process as any).env) {
        const env = (process as any).env;
        if (env.SERVER_URL) config.serverUrl = env.SERVER_URL;
        if (env.PROJECT_KEY) config.projectKey = env.PROJECT_KEY;
    }

    return config;
}

/**
 * 기본 설정값
 */
export const DEFAULT_OPTIONS: Partial<SparkMessagingOptions> = {
    serverUrl: 'http://localhost:3000',
    projectKey: 'default-project-key-12345',
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
};
