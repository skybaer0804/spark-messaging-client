/**
 * 수동 연결 예제 (autoConnect: false)
 */

import SparkMessaging from '../src/index';

const client = new SparkMessaging({
    serverUrl: 'http://localhost:3000',
    projectKey: 'default-project-key-12345',
    autoConnect: false, // 자동 연결 비활성화
});

// 나중에 수동으로 연결
async function connect() {
    try {
        await client.connect();
        console.log('연결 성공!');

        // 연결 후 작업 수행
        client.sendMessage('chat', 'Hello!', 'user123');
    } catch (error) {
        console.error('연결 실패:', error);
    }
}

// 연결 실행
connect();
