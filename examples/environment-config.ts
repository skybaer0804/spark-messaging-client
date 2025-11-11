/**
 * 환경 변수를 사용한 설정 예제
 *
 * 브라우저 환경:
 * window.SPARK_MESSAGING_CONFIG = {
 *   SERVER_URL: 'http://localhost:3000',
 *   PROJECT_KEY: 'your-key-here'
 * };
 *
 * Node.js 환경:
 * process.env.SERVER_URL = 'http://localhost:3000';
 * process.env.PROJECT_KEY = 'your-key-here';
 */

import SparkMessaging from '../src/index';

// 환경 변수에서 자동으로 설정을 로드
const client = new SparkMessaging();

// 또는 부분적으로 오버라이드
const clientWithOverride = new SparkMessaging({
    serverUrl: 'http://custom-server:3000',
    // projectKey는 환경 변수에서 로드됨
});
