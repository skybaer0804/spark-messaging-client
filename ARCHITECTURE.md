# Spark Messaging Client SDK - 아키텍처 문서

## 목차

1. [개요](#개요)
2. [기술 스택](#기술-스택)
3. [아키텍처 설계](#아키텍처-설계)
4. [프로젝트 구조](#프로젝트-구조)
5. [모듈 상세 설명](#모듈-상세-설명)
6. [이벤트 흐름](#이벤트-흐름)
7. [데이터 흐름](#데이터-흐름)
8. [설계 패턴](#설계-패턴)

---

## 개요

Spark Messaging Client SDK는 Socket.IO 기반의 실시간 메시징 서버를 위한 클라이언트 라이브러리입니다. 모듈화된 구조로 설계되어 유지보수성과 확장성을 제공합니다.

### 주요 특징

-   **모듈화 설계**: 각 기능이 독립적인 클래스로 분리
-   **타입 안정성**: TypeScript로 완전한 타입 정의 제공
-   **이벤트 기반**: 콜백 패턴을 통한 비동기 이벤트 처리
-   **연결 전 핸들러 등록**: 연결 전에도 이벤트 핸들러 등록 가능
-   **에러 처리**: 중앙화된 에러 처리 시스템
-   **환경 변수 지원**: 브라우저 및 Node.js 환경 모두 지원

---

## 기술 스택

### 핵심 라이브러리

| 라이브러리         | 버전   | 용도                          |
| ------------------ | ------ | ----------------------------- |
| `socket.io-client` | ^4.7.2 | Socket.IO 클라이언트 연결     |
| `typescript`       | ^5.3.3 | 타입 안정성 및 개발 경험 향상 |

### 빌드 도구

| 도구                          | 버전    | 용도                         |
| ----------------------------- | ------- | ---------------------------- |
| `rollup`                      | ^4.6.0  | 번들러 (CommonJS + ESM)      |
| `@rollup/plugin-typescript`   | ^11.1.5 | TypeScript 컴파일            |
| `@rollup/plugin-node-resolve` | ^15.2.3 | Node.js 모듈 해석            |
| `@rollup/plugin-commonjs`     | ^25.0.7 | CommonJS 모듈 변환           |
| `tslib`                       | ^2.6.2  | TypeScript 런타임 라이브러리 |

### 개발 도구

-   **TypeScript**: 정적 타입 검사
-   **Node.js**: 테스트 환경
-   **npm**: 패키지 관리

---

## 아키텍처 설계

### 전체 구조

```
┌─────────────────────────────────────────────────┐
│           SparkMessaging (Public API)           │
│  - 사용자에게 노출되는 메인 클래스              │
│  - Facade 패턴으로 내부 모듈 추상화              │
└─────────────────┬───────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼────┐  ┌────▼────┐  ┌─────▼─────┐
│Connection│  │MessageHandler│  │RoomHandler│
│          │  │              │  │           │
│Socket.IO │  │이벤트 관리   │  │방 관리    │
│연결 관리 │  │메시지 송수신 │  │방 입/퇴장 │
└──────────┘  └──────────────┘  └───────────┘
    │             │             │
    └─────────────┼─────────────┘
                  │
         ┌────────▼────────┐
         │  ErrorHandler   │
         │  에러 처리      │
         └─────────────────┘
                  │
         ┌────────▼────────┐
         │  Config         │
         │  설정 관리      │
         └─────────────────┘
```

### 설계 원칙

1. **단일 책임 원칙 (SRP)**

    - 각 클래스는 하나의 책임만 가짐
    - `Connection`: Socket 연결 관리
    - `MessageHandler`: 메시지 송수신
    - `RoomHandler`: 방 관리
    - `ErrorHandler`: 에러 처리

2. **의존성 역전 원칙 (DIP)**

    - 상위 모듈이 하위 모듈에 의존하지 않음
    - 인터페이스(타입)를 통한 의존성 주입

3. **개방-폐쇄 원칙 (OCP)**

    - 확장에는 열려있고 수정에는 닫혀있음
    - 새로운 이벤트 핸들러 추가 시 기존 코드 수정 불필요

4. **Facade 패턴**
    - `SparkMessaging` 클래스가 내부 복잡성을 숨김
    - 사용자는 간단한 API만 사용

---

## 프로젝트 구조

```
spark-messaging-client/
├── src/
│   ├── index.ts                 # 메인 진입점 및 Public API
│   ├── core/                    # 핵심 기능 모듈
│   │   ├── connection.ts        # Socket 연결 관리
│   │   ├── messageHandler.ts    # 메시지 송수신 처리
│   │   └── roomHandler.ts       # 방 관리 기능
│   ├── utils/                   # 유틸리티 모듈
│   │   └── errorHandler.ts      # 에러 처리
│   ├── config/                  # 설정 관리
│   │   └── index.ts            # 환경 변수 로드 및 기본값
│   └── types/                   # TypeScript 타입 정의
│       ├── index.ts             # 공개 타입 정의
│       └── globals.d.ts         # 전역 타입 선언
├── dist/                        # 빌드 출력 (생성됨)
├── test/                        # 테스트 파일
│   ├── socket-test.js          # Socket.IO 직접 테스트
│   └── sdk-test.js             # SDK 통합 테스트
├── examples/                    # 사용 예제
│   ├── basic-usage.ts
│   ├── manual-connection.ts
│   └── environment-config.ts
├── package.json
├── tsconfig.json               # TypeScript 설정
├── rollup.config.mjs           # Rollup 빌드 설정
└── README.md
```

---

## 모듈 상세 설명

### 1. SparkMessaging (src/index.ts)

**역할**: Public API를 제공하는 메인 클래스

**주요 기능**:

-   SDK 초기화 및 설정 관리
-   내부 모듈들의 통합 관리
-   연결 전 이벤트 핸들러 대기 큐 관리

**핵심 메커니즘**:

```typescript
// 연결 전 핸들러 등록 지원
private pendingMessageCallbacks: MessageCallback[] = [];
private pendingRoomMessageCallbacks: RoomMessageCallback[] = [];
private pendingConnectedCallbacks: ConnectedCallback[] = [];
```

**생명주기**:

1. 생성자에서 설정 로드 및 검증
2. `autoConnect`가 true면 자동 연결 시도
3. `connect()` 호출 시 핸들러 초기화 및 대기 큐 처리
4. `disconnect()` 호출 시 모든 리소스 정리

---

### 2. Connection (src/core/connection.ts)

**역할**: Socket.IO 연결의 생명주기 관리

**책임**:

-   Socket 인스턴스 생성 및 관리
-   연결 상태 추적 (`isConnecting`, `connected`)
-   재연결 설정 관리
-   인증 정보 전달 (`auth.key` 객체 사용)

**주요 메서드**:

```typescript
connect(): Promise<void>
  - Socket.IO 연결 초기화
  - Promise 기반 비동기 처리
  - 연결 성공/실패 이벤트 처리

disconnect(): void
  - Socket 연결 종료
  - 리소스 정리

isConnected(): boolean
  - 연결 상태 확인

getSocketId(): string | undefined
  - 현재 Socket ID 반환
```

**이벤트 처리**:

-   `connect`: 연결 성공
-   `connect_error`: 연결 실패
-   `error`: Socket 에러
-   `disconnect`: 연결 끊김

---

### 3. MessageHandler (src/core/messageHandler.ts)

**역할**: 메시지 송수신 및 이벤트 관리

**책임**:

-   메시지 전송 (`sendMessage`, `sendRoomMessage`)
-   메시지 수신 이벤트 리스너 관리
-   여러 콜백 등록 지원 (배열 기반)

**콜백 관리 패턴**:

```typescript
private messageCallbacks: MessageCallback[] = [];
private roomMessageCallbacks: RoomMessageCallback[] = [];
private connectedCallbacks: ConnectedCallback[] = [];

// 구독 해제 함수 반환
onMessage(callback): () => void {
    this.messageCallbacks.push(callback);
    return () => {
        // 구독 해제 로직
    };
}
```

**이벤트 리스너**:

-   `connected`: 서버 연결 완료
-   `message`: 일반 메시지 수신
-   `room-message`: 방 메시지 수신

**에러 처리**:

-   각 콜백 실행 시 try-catch로 에러 격리
-   콜백 에러가 다른 콜백에 영향 주지 않음

---

### 4. RoomHandler (src/core/roomHandler.ts)

**역할**: 방(Room) 관련 기능 관리

**책임**:

-   방 입장/나가기
-   참여 중인 방 목록 관리 (`Set<string>`)
-   중복 입장 방지

**상태 관리**:

```typescript
private joinedRooms: Set<string> = new Set();
```

**주요 메서드**:

```typescript
joinRoom(roomName: string): Promise<void>
  - 방 입장 (중복 방지)
  - 서버 응답 대기 (acknowledgment)

leaveRoom(roomName: string): Promise<void>
  - 방 나가기
  - 내부 상태 업데이트

getJoinedRooms(): string[]
  - 참여 중인 방 목록 반환

isInRoom(roomName: string): boolean
  - 특정 방 참여 여부 확인
```

**Socket.IO 이벤트**:

-   `join-room`: 방 입장 요청
-   `leave-room`: 방 나가기 요청

---

### 5. ErrorHandler (src/utils/errorHandler.ts)

**역할**: 중앙화된 에러 처리

**책임**:

-   에러 콜백 등록 및 관리
-   다양한 에러 타입 정규화
-   에러 전파

**에러 타입 정규화**:

```typescript
handleError(error: ErrorData | Error | string): void {
    let errorData: ErrorData;

    if (typeof error === 'string') {
        errorData = { message: error };
    } else if (error instanceof Error) {
        errorData = { message: error.message };
    } else {
        errorData = error;
    }

    // 모든 콜백 호출
}
```

**에러 코드**:

-   `CONNECTION_ERROR`: 연결 실패
-   `SOCKET_ERROR`: Socket 에러
-   `SERVER_DISCONNECT`: 서버 강제 종료

---

### 6. Config (src/config/index.ts)

**역할**: 설정 관리 및 환경 변수 로드

**설정 우선순위**:

1. 사용자 옵션 (생성자 파라미터)
2. 환경 변수
3. 기본값

**환경 변수 지원**:

**브라우저**:

```javascript
window.SPARK_MESSAGING_CONFIG = {
    SERVER_URL: 'http://localhost:3000',
    PROJECT_KEY: 'your-key',
};
```

**Node.js**:

```bash
export SERVER_URL=http://localhost:3000
export PROJECT_KEY=your-key
```

**기본값**:

```typescript
DEFAULT_OPTIONS = {
    serverUrl: 'http://localhost:3000',
    projectKey: 'default-project-key-12345',
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
};
```

---

### 7. Types (src/types/index.ts)

**역할**: TypeScript 타입 정의

**주요 타입**:

```typescript
// 메시지 타입
type MessageType = 'chat' | 'notification' | 'system' | 'test';

// 데이터 구조
interface MessageData {
    type: MessageType;
    content: string;
    user?: string;
    timestamp?: number;
}

interface RoomMessageData {
    room: string;
    type: MessageType;
    content: string;
    user?: string;
    timestamp?: number;
}

// 콜백 타입
type MessageCallback = (data: MessageData) => void;
type RoomMessageCallback = (data: RoomMessageData) => void;
type ConnectedCallback = (data: ConnectedData) => void;
type ErrorCallback = (error: ErrorData) => void;
```

---

## 이벤트 흐름

### 연결 흐름

```
사용자
  │
  ├─> new SparkMessaging(options)
  │     │
  │     ├─> loadConfig() [환경 변수 로드]
  │     ├─> 옵션 병합 (기본값 < 환경변수 < 사용자 옵션)
  │     ├─> new ErrorHandler()
  │     ├─> new Connection(options, errorHandler)
  │     │
  │     └─> autoConnect === true
  │           └─> connect() [비동기]
  │
  ├─> onConnected(callback) [연결 전 호출 가능]
  │     └─> pendingConnectedCallbacks.push(callback)
  │
  └─> connect() [명시적 호출 또는 자동]
        │
        ├─> Connection.connect()
        │     │
        │     ├─> io(serverUrl, socketOptions)
        │     │     └─> auth: { key }
        │     │
        │     ├─> socket.on('connect')
        │     │     └─> resolve()
        │     │
        │     └─> socket.on('connect_error')
        │           └─> reject(error)
        │
        ├─> new MessageHandler(socket)
        ├─> new RoomHandler(socket)
        │
        └─> 대기 큐 처리
              ├─> pendingConnectedCallbacks → MessageHandler
              ├─> pendingMessageCallbacks → MessageHandler
              └─> pendingRoomMessageCallbacks → MessageHandler
```

### 메시지 송수신 흐름

```
메시지 전송:
  사용자
    │
    └─> client.sendMessage(type, content, user)
          │
          └─> MessageHandler.sendMessage()
                │
                ├─> 연결 상태 확인
                ├─> MessageData 생성
                │     └─> timestamp: Date.now()
                │
                └─> socket.emit('message', messageData)
                      │
                      └─> 서버로 전송

메시지 수신:
  서버
    │
    └─> socket.emit('message', data)
          │
          └─> socket.on('message')
                │
                └─> MessageHandler.setupEventListeners()
                      │
                      └─> messageCallbacks.forEach(callback)
                            │
                            └─> callback(data) [사용자 콜백 호출]
```

### 방 관리 흐름

```
방 입장:
  사용자
    │
    └─> client.joinRoom('room-name')
          │
          └─> RoomHandler.joinRoom()
                │
                ├─> 연결 상태 확인
                ├─> 중복 입장 확인 (joinedRooms.has())
                │
                └─> socket.emit('join-room', roomName, callback)
                      │
                      └─> 서버 응답 대기
                            │
                            ├─> 성공: joinedRooms.add(roomName)
                            └─> 실패: reject(error)

방 메시지:
  사용자
    │
    └─> client.sendRoomMessage(room, type, content, user)
          │
          └─> MessageHandler.sendRoomMessage()
                │
                └─> socket.emit('room-message', data)
                      │
                      └─> 서버 → 방 내 모든 클라이언트로 브로드캐스트
                            │
                            └─> socket.on('room-message')
                                  │
                                  └─> roomMessageCallbacks.forEach()
```

---

## 데이터 흐름

### 초기화 데이터 흐름

```
옵션 병합:
  DEFAULT_OPTIONS
    +
  loadConfig() [환경 변수]
    +
  사용자 옵션
    =
  최종 SparkMessagingOptions
```

### 메시지 데이터 흐름

```
송신:
  sendMessage(type, content, user)
    ↓
  MessageData {
    type,
    content,
    user,
    timestamp: Date.now()
  }
    ↓
  socket.emit('message', messageData)
    ↓
  서버

수신:
  서버
    ↓
  socket.on('message', data)
    ↓
  MessageHandler (콜백 배열 순회)
    ↓
  사용자 콜백 호출
```

---

## 설계 패턴

### 1. Facade 패턴

`SparkMessaging` 클래스가 복잡한 내부 구조를 숨기고 간단한 API 제공:

```typescript
// 사용자는 간단한 API만 사용
client.sendMessage('chat', 'Hello');
client.onMessage((data) => { ... });

// 내부적으로는 여러 모듈이 협력
// Connection → MessageHandler → Socket.IO
```

### 2. Observer 패턴

이벤트 콜백을 통한 구독/발행 패턴:

```typescript
// 구독
const unsubscribe = client.onMessage((data) => { ... });

// 발행 (내부)
messageCallbacks.forEach(callback => callback(data));

// 구독 해제
unsubscribe();
```

### 3. Promise 패턴

비동기 작업을 Promise로 처리:

```typescript
// 연결
await client.connect();

// 방 입장
await client.joinRoom('room-name');
```

### 4. Strategy 패턴

에러 처리 전략을 `ErrorHandler`에 위임:

```typescript
// 에러 처리 전략을 중앙화
errorHandler.handleError(error);
// → 모든 등록된 콜백에 에러 전파
```

### 5. Singleton 패턴 (의도적 사용 안함)

각 인스턴스는 독립적:

-   여러 `SparkMessaging` 인스턴스 생성 가능
-   각각 독립적인 연결 및 상태 관리

---

## 확장성 고려사항

### 새로운 이벤트 추가

1. `types/index.ts`에 타입 정의 추가
2. `MessageHandler`에 이벤트 리스너 추가
3. `SparkMessaging`에 Public API 추가

### 새로운 기능 추가

1. 새로운 핸들러 클래스 생성 (`src/core/`)
2. `SparkMessaging`에 통합
3. 타입 정의 추가

### 커스텀 에러 처리

`ErrorHandler`를 확장하여 커스텀 에러 처리 로직 추가 가능

---

## 성능 고려사항

1. **콜백 배열**: O(n) 순회이지만 일반적으로 콜백 수가 적음
2. **Set 사용**: 방 목록 관리에 Set 사용으로 O(1) 조회
3. **메모리 관리**: `disconnect()` 시 모든 리소스 정리
4. **이벤트 리스너**: Socket.IO의 네이티브 이벤트 시스템 활용

---

## 보안 고려사항

1. **인증**: 프로젝트 키를 `auth.key` 객체로 전달 (Node.js/브라우저 모두 지원)
2. **에러 메시지**: 민감한 정보 노출 방지
3. **타입 검증**: TypeScript로 런타임 전 타입 검증
4. **재연결 시 인증**: Socket.IO가 자동 재연결 시에도 동일한 `auth` 객체를 사용하여 인증 정보가 자동 전달됨

---

이 문서는 프로젝트의 아키텍처를 이해하는 데 도움이 됩니다. 각 모듈의 역할과 상호작용을 파악하면 코드를 더 쉽게 이해하고 확장할 수 있습니다.
