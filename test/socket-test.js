/**
 * Socket.IO SDK 테스트 스크립트
 *
 * 사용법:
 * 1. 서버를 실행합니다 (npm run dev)
 * 2. 이 스크립트를 실행합니다 (npm test)
 */

const { io } = require('socket.io-client');

// 환경 변수 설정
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const PROJECT_KEY = process.env.PROJECT_KEY || 'default-project-key-12345';

console.log('=== Socket.IO SDK 테스트 시작 ===');
console.log(`서버 URL: ${SERVER_URL}`);
console.log(`프로젝트 키: ${PROJECT_KEY.substring(0, 20)}...`);
console.log('');

// Socket 연결
const socket = io(SERVER_URL, {
    auth: {
        key: PROJECT_KEY,
    },
    query: {
        key: PROJECT_KEY,
    },
});

// 연결 성공 이벤트
socket.on('connected', (data) => {
    console.log('✅ 연결 성공!');
    console.log(`메시지: ${data.message}`);
    console.log(`Socket ID: ${data.socketId}`);
    console.log('');

    // 테스트 메시지 전송
    console.log('📤 테스트 메시지 전송...');
    socket.emit('message', {
        type: 'test',
        content: 'Hello from test client!',
        user: 'test-user-123',
    });

    // 방 입장 테스트
    setTimeout(() => {
        console.log('🚪 방 입장 테스트...');
        socket.emit('join-room', 'test-room');
    }, 1000);

    // 방 메시지 전송 테스트
    setTimeout(() => {
        console.log('📤 방 메시지 전송 테스트...');
        socket.emit('room-message', {
            room: 'test-room',
            type: 'chat',
            content: 'Hello from room!',
            user: 'test-user-123',
        });
    }, 2000);

    // 방 나가기 테스트
    setTimeout(() => {
        console.log('🚪 방 나가기 테스트...');
        socket.emit('leave-room', 'test-room');
    }, 3000);

    // 종료
    setTimeout(() => {
        console.log('');
        console.log('=== 테스트 완료 ===');
        socket.disconnect();
        process.exit(0);
    }, 4000);
});

// 메시지 수신 이벤트
socket.on('message', (data) => {
    console.log('📥 메시지 수신:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
});

// 방 메시지 수신 이벤트
socket.on('room-message', (data) => {
    console.log('📥 방 메시지 수신:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
});

// 에러 이벤트
socket.on('error', (error) => {
    console.error('❌ 에러 발생:');
    console.error(JSON.stringify(error, null, 2));
    console.log('');
});

// 연결 오류
socket.on('connect_error', (error) => {
    console.error('❌ 연결 실패:');
    console.error(error.message);
    console.log('');
    console.log('서버가 실행 중인지 확인하세요.');
    process.exit(1);
});

// 연결 끊김
socket.on('disconnect', (reason) => {
    console.log(`🔌 연결 끊김: ${reason}`);
});
