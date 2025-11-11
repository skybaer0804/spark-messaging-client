# Spark Messaging Client SDK - API 레퍼런스

## 목차

1. [SparkMessaging 클래스](#sparkmessaging-클래스)
2. [타입 정의](#타입-정의)
3. [메서드 상세](#메서드-상세)
4. [사용 예제](#사용-예제)

---

## SparkMessaging 클래스

### 생성자

```typescript
new SparkMessaging(options?: Partial<SparkMessagingOptions>)
```

**파라미터**:

-   `options` (선택): SDK 설정 옵션

**설정 우선순위**:

1. 사용자 옵션
2. 환경 변수
3. 기본값

**예시**:

```typescript
const client = new SparkMessaging({
    serverUrl: 'http://localhost:3000',
    projectKey: 'your-key',
    autoConnect: true,
});
```

**동작**:

-   설정 로드 및 검증
-   `ErrorHandler` 및 `Connection` 초기화
-   `autoConnect`가 `true`면 자동 연결 시도

---

## 타입 정의

### SparkMessagingOptions

```typescript
interface SparkMessagingOptions {
    serverUrl: string; // 서버 URL (필수)
    projectKey: string; // 프로젝트 키 (필수)
    autoConnect?: boolean; // 자동 연결 (기본값: true)
    reconnection?: boolean; // 자동 재연결 (기본값: true)
    reconnectionAttempts?: number; // 재연결 시도 횟수 (기본값: 5)
    reconnectionDelay?: number; // 재연결 지연 시간(ms) (기본값: 1000)
}
```

---

### MessageData

```typescript
interface MessageData {
    type: MessageType; // 메시지 타입
    content: string; // 메시지 내용
    user?: string; // 사용자 ID (선택)
    timestamp?: number; // 타임스탬프 (선택)
    room?: string; // 방 이름 (선택)
}
```

---

### RoomMessageData

```typescript
interface RoomMessageData {
    room: string; // 방 이름
    type: MessageType; // 메시지 타입
    content: string; // 메시지 내용
    user?: string; // 사용자 ID (선택)
    timestamp?: number; // 타임스탬프 (선택)
}
```

---

### ConnectedData

```typescript
interface ConnectedData {
    message: string; // 연결 메시지
    socketId: string; // Socket ID
}
```

---

### ErrorData

```typescript
interface ErrorData {
    message: string; // 에러 메시지
    code?: string; // 에러 코드 (선택)
}
```

---

### MessageType

```typescript
type MessageType = 'chat' | 'notification' | 'system' | 'test';
```

---

### 콜백 타입

```typescript
type MessageCallback = (data: MessageData) => void;
type RoomMessageCallback = (data: RoomMessageData) => void;
type ConnectedCallback = (data: ConnectedData) => void;
type ErrorCallback = (error: ErrorData) => void;
```

---

## 메서드 상세

### 연결 관리

#### connect()

```typescript
async connect(): Promise<void>
```

**설명**: 서버에 연결합니다.

**반환값**: Promise<void>

**에러**: 연결 실패 시 에러 발생

**예시**:

```typescript
try {
    await client.connect();
    console.log('연결 성공');
} catch (error) {
    console.error('연결 실패:', error);
}
```

**동작**:

1. 이미 연결되어 있으면 즉시 반환
2. `Connection.connect()` 호출
3. 핸들러 초기화 (`MessageHandler`, `RoomHandler`)
4. 대기 중인 콜백 등록

---

#### disconnect()

```typescript
disconnect(): void
```

**설명**: 연결을 종료하고 모든 리소스를 정리합니다.

**예시**:

```typescript
client.disconnect();
```

**동작**:

1. 모든 핸들러 정리
2. Socket 연결 종료
3. 대기 큐 초기화
4. 에러 핸들러 정리

---

#### isConnected()

```typescript
isConnected(): boolean
```

**설명**: 현재 연결 상태를 확인합니다.

**반환값**: `true`면 연결됨, `false`면 연결 안됨

**예시**:

```typescript
if (client.isConnected()) {
    console.log('연결됨');
}
```

---

#### getSocketId()

```typescript
getSocketId(): string | undefined
```

**설명**: 현재 Socket ID를 가져옵니다.

**반환값**: Socket ID 또는 `undefined`

**예시**:

```typescript
const socketId = client.getSocketId();
console.log('Socket ID:', socketId);
```

---

### 메시지 API

#### sendMessage()

```typescript
sendMessage(type: MessageData['type'], content: string, user?: string): void
```

**설명**: 일반 메시지를 전송합니다.

**파라미터**:

-   `type`: 메시지 타입 (`'chat' | 'notification' | 'system' | 'test'`)
-   `content`: 메시지 내용
-   `user`: 사용자 ID (선택)

**에러**: SDK가 초기화되지 않았거나 연결되지 않은 경우

**예시**:

```typescript
client.sendMessage('chat', 'Hello, World!', 'user123');
```

**동작**:

1. 연결 상태 확인
2. `MessageData` 생성 (타임스탬프 자동 추가)
3. `socket.emit('message', data)` 호출

---

#### onMessage()

```typescript
onMessage(callback: MessageCallback): () => void
```

**설명**: 메시지 수신 콜백을 등록합니다.

**파라미터**:

-   `callback`: 메시지 수신 시 호출될 콜백 함수

**반환값**: 구독 해제 함수

**예시**:

```typescript
const unsubscribe = client.onMessage((data) => {
    console.log('메시지 수신:', data);
});

// 나중에 구독 해제
unsubscribe();
```

**특징**:

-   연결 전에도 등록 가능 (대기 큐에 저장)
-   여러 콜백 등록 가능
-   각 콜백은 독립적으로 실행 (에러 격리)

---

#### sendRoomMessage()

```typescript
sendRoomMessage(room: string, type: MessageData['type'], content: string, user?: string): void
```

**설명**: 특정 방에 메시지를 전송합니다.

**파라미터**:

-   `room`: 방 이름
-   `type`: 메시지 타입
-   `content`: 메시지 내용
-   `user`: 사용자 ID (선택)

**에러**: SDK가 초기화되지 않았거나 연결되지 않은 경우

**예시**:

```typescript
client.sendRoomMessage('room-1', 'chat', 'Hello Room!', 'user123');
```

**동작**:

1. 연결 상태 확인
2. `RoomMessageData` 생성
3. `socket.emit('room-message', data)` 호출

---

#### onRoomMessage()

```typescript
onRoomMessage(callback: RoomMessageCallback): () => void
```

**설명**: 방 메시지 수신 콜백을 등록합니다.

**파라미터**:

-   `callback`: 방 메시지 수신 시 호출될 콜백 함수

**반환값**: 구독 해제 함수

**예시**:

```typescript
const unsubscribe = client.onRoomMessage((data) => {
    console.log('방 메시지 수신:', data);
});
```

---

#### onConnected()

```typescript
onConnected(callback: ConnectedCallback): () => void
```

**설명**: 연결 성공 콜백을 등록합니다.

**파라미터**:

-   `callback`: 연결 성공 시 호출될 콜백 함수

**반환값**: 구독 해제 함수

**예시**:

```typescript
const unsubscribe = client.onConnected((data) => {
    console.log('연결 성공:', data.message);
    console.log('Socket ID:', data.socketId);
});
```

---

### 방 API

#### joinRoom()

```typescript
async joinRoom(roomName: string): Promise<void>
```

**설명**: 방에 입장합니다.

**파라미터**:

-   `roomName`: 방 이름

**반환값**: Promise<void>

**에러**: SDK가 초기화되지 않았거나 연결되지 않은 경우

**예시**:

```typescript
try {
    await client.joinRoom('room-1');
    console.log('방 입장 성공');
} catch (error) {
    console.error('방 입장 실패:', error);
}
```

**동작**:

1. 연결 상태 확인
2. 중복 입장 확인 (이미 입장했으면 즉시 반환)
3. `socket.emit('join-room', roomName, callback)` 호출
4. 서버 응답 대기 (Acknowledgment 패턴)
5. 성공 시 내부 상태 업데이트 (`joinedRooms.add(roomName)`)

---

#### leaveRoom()

```typescript
async leaveRoom(roomName: string): Promise<void>
```

**설명**: 방에서 나갑니다.

**파라미터**:

-   `roomName`: 방 이름

**반환값**: Promise<void>

**에러**: SDK가 초기화되지 않았거나 연결되지 않은 경우

**예시**:

```typescript
try {
    await client.leaveRoom('room-1');
    console.log('방 나가기 성공');
} catch (error) {
    console.error('방 나가기 실패:', error);
}
```

**동작**:

1. 연결 상태 확인
2. 방 참여 여부 확인 (참여하지 않았으면 즉시 반환)
3. `socket.emit('leave-room', roomName, callback)` 호출
4. 서버 응답 대기
5. 성공 시 내부 상태 업데이트 (`joinedRooms.delete(roomName)`)

---

#### getJoinedRooms()

```typescript
getJoinedRooms(): string[]
```

**설명**: 현재 참여 중인 방 목록을 가져옵니다.

**반환값**: 방 이름 배열

**예시**:

```typescript
const rooms = client.getJoinedRooms();
console.log('참여 중인 방:', rooms);
```

**동작**:

-   내부 `Set<string>`을 배열로 변환하여 반환
-   SDK가 초기화되지 않았으면 빈 배열 반환

---

#### isInRoom()

```typescript
isInRoom(roomName: string): boolean
```

**설명**: 특정 방에 참여 중인지 확인합니다.

**파라미터**:

-   `roomName`: 방 이름

**반환값**: `true`면 참여 중, `false`면 참여 안함

**예시**:

```typescript
if (client.isInRoom('room-1')) {
    console.log('방에 참여 중입니다');
}
```

**동작**:

-   내부 `Set<string>`에서 조회 (O(1))
-   SDK가 초기화되지 않았으면 `false` 반환

---

### 에러 처리 API

#### onError()

```typescript
onError(callback: ErrorCallback): () => void
```

**설명**: 에러 콜백을 등록합니다.

**파라미터**:

-   `callback`: 에러 발생 시 호출될 콜백 함수

**반환값**: 구독 해제 함수

**예시**:

```typescript
const unsubscribe = client.onError((error) => {
    console.error('에러 발생:', error.message);
    if (error.code) {
        console.error('에러 코드:', error.code);
    }
});
```

**에러 코드**:

-   `CONNECTION_ERROR`: 연결 실패
-   `SOCKET_ERROR`: Socket 에러
-   `SERVER_DISCONNECT`: 서버 강제 종료

---

### 유틸리티 API

#### getOptions()

```typescript
getOptions(): SparkMessagingOptions
```

**설명**: 현재 설정을 가져옵니다.

**반환값**: 설정 옵션 객체 (복사본)

**예시**:

```typescript
const options = client.getOptions();
console.log('서버 URL:', options.serverUrl);
console.log('프로젝트 키:', options.projectKey);
```

---

## 팩토리 함수

### createSparkMessaging()

```typescript
function createSparkMessaging(options?: Partial<SparkMessagingOptions>): SparkMessaging;
```

**설명**: `SparkMessaging` 인스턴스를 생성하는 팩토리 함수입니다.

**파라미터**:

-   `options`: SDK 설정 옵션 (선택)

**반환값**: `SparkMessaging` 인스턴스

**예시**:

```typescript
import { createSparkMessaging } from 'spark-messaging-client';

const client = createSparkMessaging({
    serverUrl: 'http://localhost:3000',
    projectKey: 'your-key',
});
```

**용도**:

-   함수형 스타일 선호 시 사용
-   `new` 키워드 없이 인스턴스 생성

---

## 사용 예제

### 기본 사용법

```typescript
import SparkMessaging from 'spark-messaging-client';

// SDK 초기화
const client = new SparkMessaging({
    serverUrl: 'http://localhost:3000',
    projectKey: 'default-project-key-12345',
});

// 연결 성공 이벤트
client.onConnected((data) => {
    console.log('연결 성공:', data.message);
    console.log('Socket ID:', data.socketId);
});

// 메시지 수신
client.onMessage((data) => {
    console.log('메시지 수신:', data);
});

// 에러 처리
client.onError((error) => {
    console.error('에러:', error.message);
});

// 메시지 전송
client.sendMessage('chat', 'Hello, World!', 'user123');
```

---

### 방 기능 사용

```typescript
// 방 입장
await client.joinRoom('room-1');

// 방 메시지 수신
client.onRoomMessage((data) => {
    console.log('방 메시지:', data);
});

// 방 메시지 전송
client.sendRoomMessage('room-1', 'chat', 'Hello Room!', 'user123');

// 방 나가기
await client.leaveRoom('room-1');
```

---

### 수동 연결

```typescript
const client = new SparkMessaging({
    serverUrl: 'http://localhost:3000',
    projectKey: 'your-key',
    autoConnect: false, // 자동 연결 비활성화
});

// 나중에 수동으로 연결
await client.connect();
```

---

### 연결 전 이벤트 등록

```typescript
const client = new SparkMessaging({
    serverUrl: 'http://localhost:3000',
    projectKey: 'your-key',
    autoConnect: false,
});

// 연결 전에도 등록 가능
client.onMessage((data) => {
    console.log('메시지:', data);
});

client.onConnected((data) => {
    console.log('연결됨:', data.socketId);
});

// 나중에 연결
await client.connect();
// → 등록된 핸들러들이 자동으로 활성화됨
```

---

### 구독 해제

```typescript
// 구독
const unsubscribeMessage = client.onMessage((data) => {
    console.log('메시지:', data);
});

const unsubscribeError = client.onError((error) => {
    console.error('에러:', error);
});

// 나중에 구독 해제
unsubscribeMessage();
unsubscribeError();

// 또는 연결 종료 시 자동 해제
client.disconnect();
```

---

### 완전한 예제

```typescript
import SparkMessaging from 'spark-messaging-client';

const client = new SparkMessaging({
    serverUrl: 'http://localhost:3000',
    projectKey: 'default-project-key-12345',
});

// 이벤트 핸들링
client.onConnected((data) => {
    console.log('✅ 연결 성공:', data.message);

    // 연결 후 메시지 전송
    client.sendMessage('chat', 'Hello!', 'user123');
});

client.onMessage((data) => {
    console.log('📥 메시지 수신:', data);
});

client.onError((error) => {
    console.error('❌ 에러:', error.message);
});

// 방 기능
async function roomExample() {
    try {
        // 방 입장
        await client.joinRoom('chat-room');

        // 방 메시지 수신
        client.onRoomMessage((data) => {
            console.log('📥 방 메시지:', data);
        });

        // 방 메시지 전송
        client.sendRoomMessage('chat-room', 'chat', 'Hello Room!', 'user123');

        // 나중에 방 나가기
        await client.leaveRoom('chat-room');
    } catch (error) {
        console.error('방 작업 실패:', error);
    }
}

// 연결 종료 (필요시)
// client.disconnect();
```

---

이 API 레퍼런스를 통해 SDK의 모든 기능을 완전히 활용할 수 있습니다. 각 메서드의 동작 방식과 사용법을 파악하면 더 효과적으로 SDK를 사용할 수 있습니다.
