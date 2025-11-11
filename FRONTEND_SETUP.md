# Spark Messaging Client SDK - 프론트엔드 설정 가이드

## 목차

1. [설치](#설치)
2. [기본 설정](#기본-설정)
3. [환경 변수 설정](#환경-변수-설정)
4. [설정 파일 예시](#설정-파일-예시)
5. [API 키 관리](#api-키-관리)
6. [보안 주의사항](#보안-주의사항)
7. [사용 예제](#사용-예제)

---

## 설치

### npm 설치

```bash
npm install spark-messaging-client
```

### yarn 설치

```bash
yarn add spark-messaging-client
```

### pnpm 설치

```bash
pnpm add spark-messaging-client
```

---

## 기본 설정

### 1. SDK 초기화

**TypeScript/JavaScript (ES Module)**:

```typescript
import SparkMessaging from 'spark-messaging-client';

const client = new SparkMessaging({
    serverUrl: 'http://localhost:3000',
    projectKey: 'default-project-key-12345', // API 키
});
```

**CommonJS**:

```javascript
const SparkMessaging = require('spark-messaging-client').default;

const client = new SparkMessaging({
    serverUrl: 'http://localhost:3000',
    projectKey: 'default-project-key-12345',
});
```

### 2. 이벤트 핸들링

```typescript
// 연결 성공
client.onConnected((data) => {
    console.log('연결 성공:', data.socketId);
});

// 메시지 수신
client.onMessage((data) => {
    console.log('메시지:', data);
});

// 에러 처리
client.onError((error) => {
    console.error('에러:', error.message);
});
```

---

## 환경 변수 설정

### Vite (Vue/React)

**1. `.env` 파일 생성**:

```env
VITE_SERVER_URL=http://localhost:3000
VITE_PROJECT_KEY=default-project-key-12345
```

**2. 설정 파일에서 사용**:

```typescript
// config/sparkMessaging.ts
import SparkMessaging from 'spark-messaging-client';

export const sparkMessagingClient = new SparkMessaging({
    serverUrl: import.meta.env.VITE_SERVER_URL,
    projectKey: import.meta.env.VITE_PROJECT_KEY,
});
```

**3. `.env.example` 파일** (Git에 포함):

```env
VITE_SERVER_URL=http://localhost:3000
VITE_PROJECT_KEY=your-project-key-here
```

**4. `.gitignore`에 `.env` 추가**:

```
.env
.env.local
.env.*.local
```

---

### Create React App

**1. `.env` 파일 생성**:

```env
REACT_APP_SERVER_URL=http://localhost:3000
REACT_APP_PROJECT_KEY=default-project-key-12345
```

**2. 설정 파일에서 사용**:

```typescript
// config/sparkMessaging.ts
import SparkMessaging from 'spark-messaging-client';

export const sparkMessagingClient = new SparkMessaging({
    serverUrl: process.env.REACT_APP_SERVER_URL!,
    projectKey: process.env.REACT_APP_PROJECT_KEY!,
});
```

---

### Next.js

**1. `.env.local` 파일 생성**:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_PROJECT_KEY=default-project-key-12345
```

**2. 설정 파일에서 사용**:

```typescript
// lib/sparkMessaging.ts
import SparkMessaging from 'spark-messaging-client';

export const sparkMessagingClient = new SparkMessaging({
    serverUrl: process.env.NEXT_PUBLIC_SERVER_URL!,
    projectKey: process.env.NEXT_PUBLIC_PROJECT_KEY!,
});
```

---

### Preact

**1. `.env` 파일 생성**:

```env
VITE_SERVER_URL=http://localhost:3000
VITE_PROJECT_KEY=default-project-key-12345
```

**2. 설정 파일에서 사용**:

```typescript
// config/sparkMessaging.ts
import SparkMessaging from 'spark-messaging-client';

export const sparkMessagingClient = new SparkMessaging({
    serverUrl: import.meta.env.VITE_SERVER_URL,
    projectKey: import.meta.env.VITE_PROJECT_KEY,
});
```

---

## 설정 파일 예시

### 예시 1: Vite + TypeScript

**파일 구조**:

```
src/
├── config/
│   └── sparkMessaging.ts
└── main.ts
```

**`src/config/sparkMessaging.ts`**:

```typescript
import SparkMessaging from 'spark-messaging-client';

// 환경 변수에서 로드
const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const projectKey = import.meta.env.VITE_PROJECT_KEY || 'default-project-key-12345';

// SDK 인스턴스 생성
export const sparkMessagingClient = new SparkMessaging({
    serverUrl,
    projectKey,
});

// 이벤트 핸들링
sparkMessagingClient.onConnected((data) => {
    console.log('✅ Spark Messaging 연결 성공:', data.socketId);
});

sparkMessagingClient.onError((error) => {
    console.error('❌ Spark Messaging 에러:', error.message);
});

export default sparkMessagingClient;
```

**`.env`** (로컬 개발용):

```env
VITE_SERVER_URL=http://localhost:3000
VITE_PROJECT_KEY=default-project-key-12345
```

**`.env.example`** (Git에 포함):

```env
# Spark Messaging Server URL
VITE_SERVER_URL=http://localhost:3000

# Spark Messaging Project Key (API Key)
# ⚠️ 실제 프로덕션에서는 안전한 키 관리 시스템 사용 권장
VITE_PROJECT_KEY=your-project-key-here
```

---

### 예시 2: React + Create React App

**`src/config/sparkMessaging.js`**:

```javascript
import SparkMessaging from 'spark-messaging-client';

const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3000';
const projectKey = process.env.REACT_APP_PROJECT_KEY || 'default-project-key-12345';

export const sparkMessagingClient = new SparkMessaging({
    serverUrl,
    projectKey,
});

sparkMessagingClient.onConnected((data) => {
    console.log('✅ 연결 성공:', data.socketId);
});

sparkMessagingClient.onError((error) => {
    console.error('❌ 에러:', error.message);
});

export default sparkMessagingClient;
```

**`.env`**:

```env
REACT_APP_SERVER_URL=http://localhost:3000
REACT_APP_PROJECT_KEY=default-project-key-12345
```

---

### 예시 3: Next.js

**`lib/sparkMessaging.ts`**:

```typescript
import SparkMessaging from 'spark-messaging-client';

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
const projectKey = process.env.NEXT_PUBLIC_PROJECT_KEY || 'default-project-key-12345';

export const sparkMessagingClient = new SparkMessaging({
    serverUrl,
    projectKey,
});

sparkMessagingClient.onConnected((data) => {
    console.log('✅ 연결 성공:', data.socketId);
});

sparkMessagingClient.onError((error) => {
    console.error('❌ 에러:', error.message);
});

export default sparkMessagingClient;
```

**`.env.local`**:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_PROJECT_KEY=default-project-key-12345
```

---

### 예시 4: Preact + Vite

**`src/config/sparkMessaging.ts`**:

```typescript
import SparkMessaging from 'spark-messaging-client';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const projectKey = import.meta.env.VITE_PROJECT_KEY || 'default-project-key-12345';

export const sparkMessagingClient = new SparkMessaging({
    serverUrl,
    projectKey,
});

sparkMessagingClient.onConnected((data) => {
    console.log('✅ 연결 성공:', data.socketId);
});

sparkMessagingClient.onError((error) => {
    console.error('❌ 에러:', error.message);
});

export default sparkMessagingClient;
```

**`.env`**:

```env
VITE_SERVER_URL=http://localhost:3000
VITE_PROJECT_KEY=default-project-key-12345
```

---

### 예시 5: 브라우저 전역 설정 (HTML)

**`index.html`**:

```html
<!DOCTYPE html>
<html lang="ko">
    <head>
        <meta charset="UTF-8" />
        <title>Spark Messaging Demo</title>
        <script>
            // 전역 설정 (SDK 로드 전에 설정)
            window.SPARK_MESSAGING_CONFIG = {
                SERVER_URL: 'http://localhost:3000',
                PROJECT_KEY: 'default-project-key-12345',
            };
        </script>
    </head>
    <body>
        <div id="app"></div>
        <script type="module" src="/src/main.ts"></script>
    </body>
</html>
```

**SDK 사용**:

```typescript
import SparkMessaging from 'spark-messaging-client';

// 환경 변수에서 자동으로 로드됨
const client = new SparkMessaging();
```

---

## API 키 관리

### SDK의 역할

SDK는 **API 키를 받아 백엔드로 전달하는 역할만** 수행합니다:

1. **SDK 초기화 시 API 키 받기**
2. **Socket.IO 연결 시 `auth.key`로 전달**
3. **실제 인증은 백엔드에서 처리**

### 키 전달 흐름

```
프론트엔드
  │
  ├─> SDK 초기화 (API 키 포함)
  │     │
  │     └─> new SparkMessaging({
  │           projectKey: 'your-api-key'
  │         })
  │
  └─> Socket.IO 연결
        │
        └─> auth: { key: 'your-api-key' }
              │
              └─> 백엔드 서버
                    │
                    └─> socket.handshake.auth?.key 확인
                          │
                          └─> 인증 처리 (백엔드에서 수행)
```

---

## 보안 주의사항

### ⚠️ 중요: API 키 보안

**절대 하지 말아야 할 것**:

1. ❌ **소스 코드에 키 하드코딩**

    ```typescript
    // 나쁜 예
    const client = new SparkMessaging({
        projectKey: 'secret-key-12345', // 절대 하지 말 것!
    });
    ```

2. ❌ **Git에 `.env` 파일 커밋**

    ```
    # .gitignore에 반드시 포함
    .env
    .env.local
    .env.*.local
    ```

3. ❌ **공개 저장소에 키 노출**

**권장 사항**:

1. ✅ **환경 변수 사용**

    ```typescript
    const projectKey = process.env.VITE_PROJECT_KEY;
    ```

2. ✅ **`.env.example` 파일 제공** (키 없이)

    ```env
    VITE_PROJECT_KEY=your-project-key-here
    ```

3. ✅ **프로덕션에서는 안전한 키 관리 시스템 사용**
    - 환경 변수 관리 서비스 (Vercel, Netlify 등)
    - 시크릿 관리 도구
    - 백엔드 프록시를 통한 키 전달

---

## 사용 예제

### React Hook 예제

**`src/hooks/useSparkMessaging.ts`**:

```typescript
import { useEffect, useState } from 'react';
import SparkMessaging from 'spark-messaging-client';
import type { MessageData, RoomMessageData } from 'spark-messaging-client';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const projectKey = import.meta.env.VITE_PROJECT_KEY || 'default-project-key-12345';

export function useSparkMessaging() {
    const [client] = useState(
        () =>
            new SparkMessaging({
                serverUrl,
                projectKey,
            })
    );
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [roomMessages, setRoomMessages] = useState<RoomMessageData[]>([]);

    useEffect(() => {
        // 연결 성공
        const unsubscribeConnected = client.onConnected((data) => {
            setIsConnected(true);
            console.log('연결 성공:', data.socketId);
        });

        // 메시지 수신
        const unsubscribeMessage = client.onMessage((data) => {
            setMessages((prev) => [...prev, data]);
        });

        // 방 메시지 수신
        const unsubscribeRoomMessage = client.onRoomMessage((data) => {
            setRoomMessages((prev) => [...prev, data]);
        });

        // 에러 처리
        const unsubscribeError = client.onError((error) => {
            setIsConnected(false);
            console.error('에러:', error.message);
        });

        return () => {
            unsubscribeConnected();
            unsubscribeMessage();
            unsubscribeRoomMessage();
            unsubscribeError();
            client.disconnect();
        };
    }, [client]);

    return {
        client,
        isConnected,
        messages,
        roomMessages,
    };
}
```

**사용**:

```typescript
import { useSparkMessaging } from './hooks/useSparkMessaging';

function App() {
    const { client, isConnected, messages } = useSparkMessaging();

    const handleSend = () => {
        client.sendMessage('chat', 'Hello!', 'user123');
    };

    return (
        <div>
            <p>연결 상태: {isConnected ? '연결됨' : '연결 안됨'}</p>
            <button onClick={handleSend} disabled={!isConnected}>
                메시지 전송
            </button>
            <div>
                {messages.map((msg, i) => (
                    <div key={i}>{msg.content}</div>
                ))}
            </div>
        </div>
    );
}
```

---

### Vue 3 Composition API 예제

**`src/composables/useSparkMessaging.ts`**:

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import SparkMessaging from 'spark-messaging-client';
import type { MessageData } from 'spark-messaging-client';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const projectKey = import.meta.env.VITE_PROJECT_KEY || 'default-project-key-12345';

export function useSparkMessaging() {
    const client = new SparkMessaging({
        serverUrl,
        projectKey,
    });
    const isConnected = ref(false);
    const messages = ref<MessageData[]>([]);

    onMounted(() => {
        client.onConnected((data) => {
            isConnected.value = true;
            console.log('연결 성공:', data.socketId);
        });

        client.onMessage((data) => {
            messages.value.push(data);
        });

        client.onError((error) => {
            isConnected.value = false;
            console.error('에러:', error.message);
        });
    });

    onUnmounted(() => {
        client.disconnect();
    });

    return {
        client,
        isConnected,
        messages,
    };
}
```

---

### Preact Hook 예제

**`src/hooks/useSparkMessaging.ts`**:

```typescript
import { useEffect, useState } from 'preact/hooks';
import SparkMessaging from 'spark-messaging-client';
import type { MessageData } from 'spark-messaging-client';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
const projectKey = import.meta.env.VITE_PROJECT_KEY || 'default-project-key-12345';

export function useSparkMessaging() {
    const [client] = useState(
        () =>
            new SparkMessaging({
                serverUrl,
                projectKey,
            })
    );
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<MessageData[]>([]);

    useEffect(() => {
        const unsubscribeConnected = client.onConnected((data) => {
            setIsConnected(true);
        });

        const unsubscribeMessage = client.onMessage((data) => {
            setMessages((prev) => [...prev, data]);
        });

        const unsubscribeError = client.onError((error) => {
            setIsConnected(false);
            console.error('에러:', error.message);
        });

        return () => {
            unsubscribeConnected();
            unsubscribeMessage();
            unsubscribeError();
            client.disconnect();
        };
    }, [client]);

    return { client, isConnected, messages };
}
```

---

## 프로덕션 배포 시 주의사항

### 1. 환경 변수 설정

**Vercel**:

```
Settings → Environment Variables
- VITE_SERVER_URL: https://your-server.com
- VITE_PROJECT_KEY: your-production-key
```

**Netlify**:

```
Site settings → Environment variables
- VITE_SERVER_URL: https://your-server.com
- VITE_PROJECT_KEY: your-production-key
```

### 2. 빌드 시 환경 변수 확인

```bash
# 빌드 전 확인
echo $VITE_SERVER_URL
echo $VITE_PROJECT_KEY

# 빌드
npm run build
```

### 3. 키 노출 방지

-   ✅ 환경 변수 사용
-   ✅ `.env` 파일을 `.gitignore`에 추가
-   ✅ 빌드된 파일에 키가 포함되지 않도록 확인
-   ✅ 브라우저 DevTools에서 키가 노출되지 않도록 주의

---

## 트러블슈팅

### 환경 변수가 로드되지 않음

**문제**: `undefined` 값이 전달됨

**해결**:

1. 환경 변수 이름 확인 (Vite는 `VITE_` 접두사 필요)
2. `.env` 파일 위치 확인 (프로젝트 루트)
3. 개발 서버 재시작

### 키가 노출됨

**문제**: 브라우저에서 키가 보임

**해결**:

1. 환경 변수 사용 (빌드 시 주입)
2. 백엔드 프록시 사용 고려
3. 키를 서버에서 관리하는 방식으로 전환

---

이 가이드를 따라 프론트엔드 프로젝트에 SDK를 설정하고 사용할 수 있습니다.
