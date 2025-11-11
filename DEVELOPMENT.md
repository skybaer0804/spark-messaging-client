# Spark Messaging Client SDK - 개발 가이드

## 목차

1. [개발 환경 설정](#개발-환경-설정)
2. [빌드 시스템](#빌드-시스템)
3. [코딩 컨벤션](#코딩-컨벤션)
4. [모듈 개발 가이드](#모듈-개발-가이드)
5. [테스트 가이드](#테스트-가이드)
6. [디버깅](#디버깅)
7. [배포](#배포)

---

## 개발 환경 설정

### 필수 요구사항

-   **Node.js**: v18 이상
-   **npm**: v9 이상
-   **TypeScript**: v5.3.3 (자동 설치됨)

### 초기 설정

```bash
# 저장소 클론
git clone <repository-url>
cd spark-messaging-client

# 의존성 설치
npm install

# 빌드
npm run build
```

### 개발 모드

```bash
# Watch 모드로 개발 (파일 변경 시 자동 빌드)
npm run dev
```

---

## 빌드 시스템

### Rollup 설정 (rollup.config.mjs)

**출력 형식**:

-   **CommonJS** (`dist/index.js`): Node.js 환경용
-   **ES Module** (`dist/index.esm.js`): 브라우저 및 모던 Node.js용

**플러그인**:

1. `@rollup/plugin-node-resolve`: Node.js 모듈 해석
2. `@rollup/plugin-commonjs`: CommonJS 모듈 변환
3. `@rollup/plugin-typescript`: TypeScript 컴파일

**외부 의존성**:

-   `socket.io-client`: 번들에 포함하지 않고 외부 의존성으로 처리

### 빌드 프로세스

```bash
npm run build
```

**빌드 단계**:

1. TypeScript 컴파일
2. 타입 정의 생성 (`*.d.ts`)
3. 소스맵 생성 (`*.map`)
4. CommonJS 및 ESM 번들 생성

**출력 구조**:

```
dist/
├── index.js              # CommonJS 번들
├── index.esm.js          # ES Module 번들
├── index.d.ts            # TypeScript 타입 정의
├── config/
│   └── index.d.ts
├── core/
│   ├── connection.d.ts
│   ├── messageHandler.d.ts
│   └── roomHandler.d.ts
└── ...
```

---

## 코딩 컨벤션

### TypeScript 스타일

**타입 정의**:

```typescript
// 인터페이스는 PascalCase
interface MessageData {
    type: MessageType;
    content: string;
}

// 타입 별칭은 PascalCase
type MessageCallback = (data: MessageData) => void;
```

**클래스**:

```typescript
// 클래스는 PascalCase
export class MessageHandler {
    // private 필드는 camelCase, _ 접두사 없음
    private messageCallbacks: MessageCallback[] = [];

    // public 메서드는 camelCase
    public onMessage(callback: MessageCallback): () => void {
        // ...
    }
}
```

**함수**:

```typescript
// 함수는 camelCase
export function loadConfig(): Partial<SparkMessagingOptions> {
    // ...
}
```

### 주석 규칙

**JSDoc 스타일**:

```typescript
/**
 * 메시지 전송
 *
 * @param type - 메시지 타입
 * @param content - 메시지 내용
 * @param user - 사용자 ID (선택)
 * @throws {Error} Socket이 연결되지 않은 경우
 */
sendMessage(type: MessageData['type'], content: string, user?: string): void {
    // ...
}
```

**인라인 주석**:

```typescript
// 연결 전이면 대기 큐에 추가
this.pendingMessageCallbacks.push(callback);
```

### 파일 구조

**모듈별 파일 분리**:

-   하나의 클래스 = 하나의 파일
-   관련 타입은 `types/` 디렉토리에 모음
-   유틸리티는 `utils/` 디렉토리에 모음

**Export 규칙**:

```typescript
// 기본 export (메인 클래스)
export default SparkMessaging;

// 타입 export
export * from './types';

// 명명된 export (유틸리티 함수)
export function createSparkMessaging() { ... }
```

---

## 모듈 개발 가이드

### 새 모듈 추가하기

#### 1. 핵심 모듈 (core/)

**파일 생성**: `src/core/newHandler.ts`

```typescript
import { Socket } from 'socket.io-client';

/**
 * 새로운 핸들러 클래스
 */
export class NewHandler {
    private socket: Socket;

    constructor(socket: Socket) {
        this.socket = socket;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // 이벤트 리스너 설정
    }

    // Public 메서드들
}
```

#### 2. 타입 정의 추가

**파일**: `src/types/index.ts`

```typescript
export interface NewData {
    // 타입 정의
}

export type NewCallback = (data: NewData) => void;
```

#### 3. 메인 클래스에 통합

**파일**: `src/index.ts`

```typescript
import { NewHandler } from './core/newHandler';

export class SparkMessaging {
    private newHandler: NewHandler | null = null;

    async connect(): Promise<void> {
        // ...
        this.newHandler = new NewHandler(socket);
    }

    // Public API 추가
    newMethod(): void {
        if (!this.newHandler) {
            throw new Error('SDK is not initialized');
        }
        this.newHandler.doSomething();
    }
}
```

### 이벤트 핸들러 추가하기

#### 1. MessageHandler에 이벤트 리스너 추가

```typescript
private setupEventListeners(): void {
    // 기존 리스너들...

    // 새 이벤트 리스너 추가
    this.socket.on('new-event', (data: NewData) => {
        this.newEventCallbacks.forEach((callback) => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in new-event callback:', error);
            }
        });
    });
}
```

#### 2. 콜백 관리 메서드 추가

```typescript
private newEventCallbacks: NewCallback[] = [];

onNewEvent(callback: NewCallback): () => void {
    this.newEventCallbacks.push(callback);
    return () => {
        const index = this.newEventCallbacks.indexOf(callback);
        if (index > -1) {
            this.newEventCallbacks.splice(index, 1);
        }
    };
}
```

#### 3. SparkMessaging에 Public API 추가

```typescript
onNewEvent(callback: NewCallback): () => void {
    if (this.messageHandler) {
        return this.messageHandler.onNewEvent(callback);
    }
    // 연결 전 대기 큐 처리
    this.pendingNewEventCallbacks.push(callback);
    return () => {
        const index = this.pendingNewEventCallbacks.indexOf(callback);
        if (index > -1) {
            this.pendingNewEventCallbacks.splice(index, 1);
        }
    };
}
```

---

## 테스트 가이드

### 테스트 파일 구조

```
test/
├── socket-test.js      # Socket.IO 직접 테스트
└── sdk-test.js         # SDK 통합 테스트
```

### SDK 테스트 실행

**전제 조건**:

-   백엔드 서버가 실행 중이어야 함

**실행**:

```bash
# 백엔드 서버 실행 (다른 터미널)
cd ../spark-messaging-server
npm start

# SDK 테스트 실행
npm run test:sdk
```

**환경 변수 설정**:

```bash
SERVER_URL=http://localhost:3000 PROJECT_KEY=your-key npm run test:sdk
```

### 테스트 시나리오

**기본 테스트** (`test/sdk-test.js`):

1. SDK 초기화
2. 연결 확인
3. 메시지 전송/수신
4. 방 입장/메시지/나가기
5. 연결 종료

**테스트 작성 예시**:

```javascript
const client = new SparkMessaging({
    serverUrl: 'http://localhost:3000',
    projectKey: 'default-project-key-12345',
});

// 연결 성공 확인
client.onConnected((data) => {
    console.log('✅ 연결 성공:', data.socketId);

    // 메시지 전송 테스트
    client.sendMessage('test', 'Hello');
});

// 메시지 수신 확인
client.onMessage((data) => {
    console.log('📥 메시지 수신:', data);
});
```

---

## 디버깅

### 소스맵 활용

빌드된 파일에 소스맵이 포함되어 있어 디버깅 시 원본 소스 코드를 확인할 수 있습니다.

**브라우저 DevTools**:

-   Sources 탭에서 `src/` 디렉토리 확인 가능
-   브레이크포인트 설정 가능

### 로깅

**에러 로깅**:

```typescript
client.onError((error) => {
    console.error('SDK Error:', error);
});
```

**내부 로깅**:

-   각 모듈에서 `console.error` 사용 (콜백 에러)
-   프로덕션에서는 로깅 레벨 조정 가능

### 연결 상태 확인

```typescript
// 연결 상태 확인
if (client.isConnected()) {
    console.log('연결됨');
    console.log('Socket ID:', client.getSocketId());
} else {
    console.log('연결 안됨');
}
```

### Socket.IO 디버깅

**환경 변수 설정**:

```bash
DEBUG=socket.io:* node test/sdk-test.js
```

---

## 배포

### 빌드 전 확인사항

1. **타입 체크**:

```bash
npx tsc --noEmit
```

2. **빌드 테스트**:

```bash
npm run build
```

3. **테스트 실행**:

```bash
npm run test:sdk
```

### 버전 관리

**package.json 버전 업데이트**:

```json
{
    "version": "1.0.1"  // 패치: 1.0.0 → 1.0.1
    "version": "1.1.0"  // 마이너: 1.0.0 → 1.1.0
    "version": "2.0.0"  // 메이저: 1.0.0 → 2.0.0
}
```

### npm 배포

**배포 전 빌드**:

```bash
npm run build
```

**배포**:

```bash
npm publish
```

**배포 전 자동 빌드**:
`prepublishOnly` 스크립트가 자동으로 빌드를 실행합니다.

### 배포 파일

`.npmignore`에 의해 다음 파일들이 제외됩니다:

-   `src/` (소스 코드)
-   `test/` (테스트 파일)
-   `examples/` (예제 파일)
-   설정 파일들

**배포되는 파일**:

-   `dist/` (빌드된 파일)
-   `README.md`
-   `package.json`

---

## 코드 리뷰 체크리스트

### 기능 추가 시

-   [ ] 타입 정의 추가됨
-   [ ] JSDoc 주석 작성됨
-   [ ] 에러 처리 포함됨
-   [ ] 연결 전 핸들러 등록 지원됨
-   [ ] 테스트 작성됨

### 버그 수정 시

-   [ ] 근본 원인 파악됨
-   [ ] 에지 케이스 고려됨
-   [ ] 기존 기능에 영향 없음
-   [ ] 테스트 추가됨

### 리팩토링 시

-   [ ] 기능 동작 동일함
-   [ ] 타입 안정성 유지됨
-   [ ] 성능 저하 없음
-   [ ] 문서 업데이트됨

---

## 성능 최적화

### 메모리 관리

**리소스 정리**:

```typescript
disconnect(): void {
    // 모든 핸들러 정리
    this.messageHandler?.clear();
    this.roomHandler?.clear();
    this.errorHandler.clear();

    // 연결 종료
    this.connection.disconnect();

    // 대기 큐 초기화
    this.pendingCallbacks = [];
}
```

### 콜백 최적화

**배열 순회 최적화**:

-   콜백 수가 많을 경우 Map 사용 고려
-   현재는 배열이 적어 배열 사용

### 이벤트 리스너 최적화

**Socket.IO 네이티브 이벤트 활용**:

-   Socket.IO의 최적화된 이벤트 시스템 사용
-   불필요한 래퍼 최소화

---

## 문제 해결

### 일반적인 문제

**1. 연결 실패**

-   서버가 실행 중인지 확인
-   `serverUrl`이 올바른지 확인
-   `projectKey`가 올바른지 확인

**2. 타입 에러**

-   `npm run build` 실행하여 타입 정의 생성 확인
-   TypeScript 버전 확인

**3. 빌드 에러**

-   `node_modules` 삭제 후 재설치
-   TypeScript 버전 확인

---

이 가이드를 따라 개발하면 일관성 있고 유지보수 가능한 코드를 작성할 수 있습니다.
