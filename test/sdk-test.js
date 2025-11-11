/**
 * SDK를 사용한 백엔드 연결 테스트
 *
 * 사용법:
 * 1. 백엔드 서버를 실행합니다 (다른 프로젝트에서 npm run dev)
 * 2. 이 스크립트를 실행합니다: node test/sdk-test.js
 */

const SparkMessaging = require('../dist/index.js').default;

// 환경 변수 설정
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const PROJECT_KEY = process.env.PROJECT_KEY || 'default-project-key-12345';

console.log('=== Spark Messaging SDK 테스트 시작 ===');
console.log(`서버 URL: ${SERVER_URL}`);
console.log(`프로젝트 키: ${PROJECT_KEY.substring(0, 20)}...`);
console.log('');

// SDK 초기화
const client = new SparkMessaging({
    serverUrl: SERVER_URL,
    projectKey: PROJECT_KEY,
    autoConnect: true,
});

// 연결 성공 이벤트
client.onConnected((data) => {
    console.log('✅ SDK 연결 성공!');
    console.log(`메시지: ${data.message}`);
    console.log(`Socket ID: ${data.socketId}`);
    console.log('');

    // 테스트 메시지 전송
    setTimeout(() => {
        console.log('📤 테스트 메시지 전송...');
        try {
            client.sendMessage('test', 'Hello from SDK!', 'sdk-test-user');
        } catch (error) {
            console.error('메시지 전송 실패:', error.message);
        }
    }, 500);

    // 방 입장 테스트
    setTimeout(async () => {
        console.log('🚪 방 입장 테스트...');
        try {
            await client.joinRoom('test-room');
            console.log('✅ 방 입장 성공');
        } catch (error) {
            console.error('방 입장 실패:', error.message);
        }
    }, 1000);

    // 방 메시지 전송 테스트
    setTimeout(() => {
        console.log('📤 방 메시지 전송 테스트...');
        try {
            client.sendRoomMessage('test-room', 'chat', 'Hello from SDK room!', 'sdk-test-user');
        } catch (error) {
            console.error('방 메시지 전송 실패:', error.message);
        }
    }, 2000);

    // 방 나가기 테스트
    setTimeout(async () => {
        console.log('🚪 방 나가기 테스트...');
        try {
            await client.leaveRoom('test-room');
            console.log('✅ 방 나가기 성공');
        } catch (error) {
            console.error('방 나가기 실패:', error.message);
        }
    }, 3000);

    // 종료
    setTimeout(() => {
        console.log('');
        console.log('=== 테스트 완료 ===');
        console.log(`참여 중인 방: ${client.getJoinedRooms().join(', ') || '없음'}`);
        client.disconnect();
        process.exit(0);
    }, 4000);
});

// 메시지 수신 이벤트
client.onMessage((data) => {
    console.log('📥 메시지 수신:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
});

// 방 메시지 수신 이벤트
client.onRoomMessage((data) => {
    console.log('📥 방 메시지 수신:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
});

// 에러 이벤트
client.onError((error) => {
    console.error('❌ SDK 에러 발생:');
    console.error(`메시지: ${error.message}`);
    if (error.code) {
        console.error(`코드: ${error.code}`);
    }
    console.log('');
});

// 연결 실패 처리
setTimeout(() => {
    if (!client.isConnected()) {
        console.error('❌ 연결 타임아웃');
        console.log('서버가 실행 중인지 확인하세요.');
        process.exit(1);
    }
}, 5000);
