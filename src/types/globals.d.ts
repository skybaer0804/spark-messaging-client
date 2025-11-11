/**
 * 전역 타입 선언
 */

declare global {
    interface Window {
        SPARK_MESSAGING_CONFIG?: {
            SERVER_URL?: string;
            PROJECT_KEY?: string;
        };
    }

    namespace NodeJS {
        interface ProcessEnv {
            SERVER_URL?: string;
            PROJECT_KEY?: string;
        }
    }

    var process:
        | {
              env?: NodeJS.ProcessEnv;
          }
        | undefined;
}

export {};
