# Spark Messaging Client SDK - 이벤트 가이드

## 목차

1. [이벤트 개요](#이벤트-개요)
2. [클라이언트 → 서버 이벤트](#클라이언트--서버-이벤트)
3. [서버 → 클라이언트 이벤트](#서버--클라이언트-이벤트)
4. [이벤트 등록 및 해제](#이벤트-등록-및-해제)
5. [이벤트 흐름도](#이벤트-흐름도)
6. [에러 이벤트](#에러-이벤트)

---

## 이벤트 개요

SDK는 Socket.IO를 기반으로 한 이벤트 기반 통신을 사용합니다. 모든 이벤트는 비동기적으로 처리되며, 콜백 패턴을 통해 사용자에게 노출됩니다.

### 이벤트 분류

1. **연결 이벤트**: Socket 연결 상태 관련
2. **메시지 이벤트**: 메시지 송수신 관련
3. **방 이벤트**: 방 입장/퇴장 관련
4. **에러 이벤트**: 에러 처리 관련

---

## 클라이언트 → 서버 이벤트

### 1. 연결 시 인증

**이벤트**: 자동 발생 (Socket.IO 연결 시)

**전달 방식**:

-   `extraHeaders['x-project-key']`: HTTP 헤더로 전달

**코드**:

```typescript
// Connection 클래스에서 자동 처리
const socketOptions = {
    extraHeaders: {
        'x-project-key': this.options.projectKey,
    },
};
```

**참고**: Socket.IO는 WebSocket 핸드셰이크 시 HTTP 헤더를 사용합니다. 브라우저 환경에서는 CORS 정책에 따라 제한될 수 있습니다.

---

### 2. 메시지 전송

**이벤트명**: `message`

**전송 위치**: `MessageHandler.sendMessage()`

**데이터 구조**:

```typescript
{
    type: 'chat' | 'notification' | 'system' | 'test',
    content: string,
    user?: string,
    timestamp: number
}
```

**예시**:

```typescript
client.sendMessage('chat', 'Hello, World!', 'user123');
```

**Socket.IO 전송**:

```typescript
socket.emit('message', {
    type: 'chat',
    content: 'Hello, World!',
    user: 'user123',
    timestamp: Date.now(),
});
```

---

### 3. 방 메시지 전송

**이벤트명**: `room-message`

**전송 위치**: `MessageHandler.sendRoomMessage()`

**데이터 구조**:

```typescript
{
    room: string,
    type: MessageType,
    content: string,
    user?: string,
    timestamp: number
}
```

**예시**:

```typescript
client.sendRoomMessage('room-1', 'chat', 'Hello Room!', 'user123');
```

**Socket.IO 전송**:

```typescript
socket.emit('room-message', {
    room: 'room-1',
    type: 'chat',
    content: 'Hello Room!',
    user: 'user123',
    timestamp: Date.now(),
});
```

---

### 4. 방 입장

**이벤트명**: `join-room`

**전송 위치**: `RoomHandler.joinRoom()`

**데이터**: 방 이름 (string)

**예시**:

```typescript
await client.joinRoom('room-1');
```

**Socket.IO 전송**:

```typescript
socket.emit('join-room', 'room-1', (response) => {
    // 서버 응답 처리
    if (response && response.error) {
        reject(new Error(response.error));
    } else {
        resolve();
    }
});
```

**특징**:

-   Acknowledgment 패턴 사용 (서버 응답 대기)
-   중복 입장 방지 (내부 상태 관리)

---

### 5. 방 나가기

**이벤트명**: `leave-room`

**전송 위치**: `RoomHandler.leaveRoom()`

**데이터**: 방 이름 (string)

**예시**:

```typescript
await client.leaveRoom('room-1');
```

**Socket.IO 전송**:

```typescript
socket.emit('leave-room', 'room-1', (response) => {
    // 서버 응답 처리
    if (response && response.error) {
        reject(new Error(response.error));
    } else {
        resolve();
    }
});
```

---

## 서버 → 클라이언트 이벤트

### 1. 연결 성공

**이벤트명**: `connected`

**수신 위치**: `MessageHandler.setupEventListeners()`

**데이터 구조**:

```typescript
{
    message: string,      // "Connected to server"
    socketId: string     // Socket ID
}
```

**등록 방법**:

```typescript
client.onConnected((data) => {
    console.log('연결 성공:', data.message);
    console.log('Socket ID:', data.socketId);
});
```

**내부 처리**:

```typescript
this.socket.on('connected', (data: any) => {
    this.connectedCallbacks.forEach((callback) => {
        callback({
            message: data.message || 'Connected to server',
            socketId: data.socketId || this.socket.id || '',
        });
    });
});
```

---

### 2. 일반 메시지 수신

**이벤트명**: `message`

**수신 위치**: `MessageHandler.setupEventListeners()`

**데이터 구조**:

```typescript
{
    type: MessageType,
    content: string,
    user?: string,
    timestamp?: number,
    from?: string,      // 서버에서 추가 (Socket ID)
    room?: string
}
```

**등록 방법**:

```typescript
client.onMessage((data) => {
    console.log('메시지 수신:', data);
});
```

**내부 처리**:

```typescript
this.socket.on('message', (data: MessageData) => {
    this.messageCallbacks.forEach((callback) => {
        try {
            callback(data);
        } catch (error) {
            console.error('Error in message callback:', error);
        }
    });
});
```

**특징**:

-   여러 콜백 등록 가능
-   콜백 에러가 다른 콜백에 영향 주지 않음

---

### 3. 방 메시지 수신

**이벤트명**: `room-message`

**수신 위치**: `MessageHandler.setupEventListeners()`

**데이터 구조**:

```typescript
{
    room: string,
    type: MessageType,
    content: string,
    user?: string,
    timestamp?: number,
    from?: string
}
```

**등록 방법**:

```typescript
client.onRoomMessage((data) => {
    console.log('방 메시지 수신:', data);
});
```

**내부 처리**:

```typescript
this.socket.on('room-message', (data: RoomMessageData) => {
    this.roomMessageCallbacks.forEach((callback) => {
        try {
            callback(data);
        } catch (error) {
            console.error('Error in room-message callback:', error);
        }
    });
});
```

---

### 4. Socket.IO 네이티브 이벤트

SDK 내부에서 처리하지만 사용자에게는 간접적으로 노출됩니다.

#### connect

**처리 위치**: `Connection.connect()`

**동작**:

-   연결 성공 시 Promise resolve
-   `connected` 이벤트와는 별개 (Socket.IO 네이티브)

#### connect_error

**처리 위치**: `Connection.connect()`

**동작**:

-   연결 실패 시 Promise reject
-   `ErrorHandler`를 통해 에러 전파

#### error

**처리 위치**: `Connection.connect()`

**동작**:

-   Socket 에러 발생 시 `ErrorHandler`로 전달

#### disconnect

**처리 위치**: `Connection.connect()`

**동작**:

-   연결 끊김 감지
-   서버 강제 종료 시 에러 처리

---

## 이벤트 등록 및 해제

### 등록 방법

**연결 전 등록 가능**:

```typescript
const client = new SparkMessaging({
    serverUrl: 'http://localhost:3000',
    projectKey: 'key',
    autoConnect: false, // 자동 연결 비활성화
});

// 연결 전에도 등록 가능
const unsubscribe = client.onMessage((data) => {
    console.log(data);
});

// 나중에 연결
await client.connect();
```

**내부 동작**:

-   연결 전: `pendingMessageCallbacks`에 저장
-   연결 후: 실제 핸들러에 등록

### 해제 방법

**구독 해제 함수 사용**:

```typescript
const unsubscribe = client.onMessage((data) => {
    console.log(data);
});

// 나중에 해제
unsubscribe();
```

**연결 종료 시 자동 해제**:

```typescript
client.disconnect();
// 모든 콜백이 자동으로 해제됨
```

---

## 이벤트 흐름도

### 연결 및 메시지 송수신 흐름

```
[사용자]
    │
    ├─> new SparkMessaging()
    │     │
    │     └─> autoConnect: true
    │           └─> connect() [비동기]
    │
    ├─> onConnected(callback)
    │     └─> pendingConnectedCallbacks.push()
    │
    ├─> onMessage(callback)
    │     └─> pendingMessageCallbacks.push()
    │
    └─> connect() 완료
          │
          ├─> Connection.connect()
          │     └─> socket.on('connect')
          │           └─> resolve()
          │
          ├─> new MessageHandler(socket)
          │     └─> socket.on('connected')
          │     └─> socket.on('message')
          │     └─> socket.on('room-message')
          │
          └─> 대기 큐 처리
                ├─> pendingConnectedCallbacks → MessageHandler
                └─> pendingMessageCallbacks → MessageHandler

[메시지 전송]
    │
    └─> client.sendMessage()
          │
          └─> MessageHandler.sendMessage()
                │
                └─> socket.emit('message', data)
                      │
                      └─> [서버]

[메시지 수신]
    │
    └─> [서버]
          │
          └─> socket.emit('message', data)
                │
                └─> socket.on('message')
                      │
                      └─> MessageHandler
                            │
                            └─> messageCallbacks.forEach()
                                  │
                                  └─> callback(data) [사용자 콜백]
```

### 방 관리 흐름

```
[방 입장]
    │
    └─> client.joinRoom('room-1')
          │
          └─> RoomHandler.joinRoom()
                │
                ├─> 중복 확인 (joinedRooms.has())
                │
                └─> socket.emit('join-room', 'room-1', callback)
                      │
                      └─> [서버]
                            │
                            └─> 응답 (성공/실패)
                                  │
                                  └─> callback(response)
                                        │
                                        ├─> 성공: joinedRooms.add('room-1')
                                        └─> 실패: reject(error)

[방 메시지]
    │
    └─> client.sendRoomMessage('room-1', ...)
          │
          └─> socket.emit('room-message', data)
                │
                └─> [서버]
                      │
                      └─> 방 내 모든 클라이언트로 브로드캐스트
                            │
                            └─> socket.on('room-message')
                                  │
                                  └─> roomMessageCallbacks.forEach()
```

---

## 에러 이벤트

### 에러 타입

**1. 연결 에러** (`CONNECTION_ERROR`)

-   발생 위치: `Connection.connect()`
-   원인: 서버 연결 실패
-   처리: `connect_error` 이벤트에서 처리

**2. Socket 에러** (`SOCKET_ERROR`)

-   발생 위치: `Connection.connect()`
-   원인: Socket.IO 에러
-   처리: `error` 이벤트에서 처리

**3. 서버 강제 종료** (`SERVER_DISCONNECT`)

-   발생 위치: `Connection.connect()`
-   원인: 서버가 연결을 끊음 (인증 실패 등)
-   처리: `disconnect` 이벤트에서 처리

### 에러 등록

```typescript
client.onError((error) => {
    console.error('에러 발생:', error.message);
    if (error.code) {
        console.error('에러 코드:', error.code);
    }
});
```

### 에러 처리 흐름

```
[에러 발생]
    │
    └─> Connection 또는 다른 모듈
          │
          └─> ErrorHandler.handleError(error)
                │
                ├─> 에러 정규화
                │     ├─> string → ErrorData
                │     ├─> Error → ErrorData
                │     └─> ErrorData → 그대로 사용
                │
                └─> errorCallbacks.forEach()
                      │
                      └─> callback(errorData) [사용자 콜백]
```

---

## 이벤트 우선순위

### 연결 전 이벤트 등록

SDK는 연결 전에도 이벤트 핸들러를 등록할 수 있도록 설계되었습니다:

```typescript
const client = new SparkMessaging({
    autoConnect: false,
});

// 연결 전 등록
client.onMessage((data) => { ... });
client.onConnected((data) => { ... });

// 나중에 연결
await client.connect();
// → 등록된 핸들러들이 자동으로 활성화됨
```

### 이벤트 실행 순서

1. **연결 성공**: `connected` 이벤트 발생
2. **메시지 수신**: `message` 또는 `room-message` 이벤트 발생
3. **에러 발생**: `error` 이벤트 발생 (언제든지 가능)

---

## 실전 예제

### 완전한 이벤트 처리 예제

```typescript
import SparkMessaging from 'spark-messaging-client';

const client = new SparkMessaging({
    serverUrl: 'http://localhost:3000',
    projectKey: 'default-project-key-12345',
});

// 연결 성공
const unsubscribeConnected = client.onConnected((data) => {
    console.log('✅ 연결 성공:', data.socketId);

    // 연결 후 메시지 전송
    client.sendMessage('chat', 'Hello!', 'user123');
});

// 메시지 수신
const unsubscribeMessage = client.onMessage((data) => {
    console.log('📥 메시지:', data.content);
});

// 방 메시지 수신
const unsubscribeRoomMessage = client.onRoomMessage((data) => {
    console.log('📥 방 메시지:', data.content);
});

// 에러 처리
const unsubscribeError = client.onError((error) => {
    console.error('❌ 에러:', error.message);
});

// 방 입장 및 메시지 전송
async function roomExample() {
    try {
        await client.joinRoom('room-1');
        client.sendRoomMessage('room-1', 'chat', 'Hello Room!', 'user123');
    } catch (error) {
        console.error('방 작업 실패:', error);
    }
}

// 나중에 구독 해제
// unsubscribeConnected();
// unsubscribeMessage();
// unsubscribeRoomMessage();
// unsubscribeError();

// 연결 종료 (모든 구독 자동 해제)
// client.disconnect();
```

---

이 문서를 통해 SDK의 이벤트 시스템을 완전히 이해할 수 있습니다. 각 이벤트의 발생 시점과 처리 방식을 파악하면 더 효과적으로 SDK를 활용할 수 있습니다.
