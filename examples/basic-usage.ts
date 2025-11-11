/**
 * Spark Messaging SDK 기본 사용법 예제
 */

import SparkMessaging from '../src/index';

// 1. SDK 초기화
const client = new SparkMessaging({
    serverUrl: 'http://localhost:3000',
    projectKey: 'default-project-key-12345',
    autoConnect: true, // 자동 연결 (기본값: true)
});

// 2. 연결 성공 이벤트 처리
client.onConnected((data) => {
    console.log('연결 성공:', data.message);
    console.log('Socket ID:', data.socketId);
});

// 3. 에러 처리
client.onError((error) => {
    console.error('에러 발생:', error.message);
});

// 4. 메시지 수신 처리
const unsubscribeMessage = client.onMessage((data) => {
    console.log('메시지 수신:', data);
});

// 5. 메시지 전송
client.sendMessage('chat', 'Hello, World!', 'user123');

// 6. 방 입장 및 메시지 전송
async function roomExample() {
    try {
        await client.joinRoom('my-room');
        console.log('방 입장 성공');

        client.sendRoomMessage('my-room', 'chat', 'Hello from room!', 'user123');

        // 방 메시지 수신 처리
        client.onRoomMessage((data) => {
            console.log('방 메시지 수신:', data);
        });

        // 나중에 방 나가기
        await client.leaveRoom('my-room');
    } catch (error) {
        console.error('방 작업 실패:', error);
    }
}

// 7. 연결 종료
// client.disconnect();

// 8. 메시지 구독 해제
// unsubscribeMessage();
