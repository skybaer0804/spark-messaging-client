# Spark Messaging Client SDK - 기술 스택 문서

## 목차

1. [기술 스택 개요](#기술-스택-개요)
2. [핵심 라이브러리](#핵심-라이브러리)
3. [빌드 도구](#빌드-도구)
4. [개발 도구](#개발-도구)
5. [의존성 관리](#의존성-관리)
6. [버전 호환성](#버전-호환성)

---

## 기술 스택 개요

### 전체 스택 다이어그램

```
┌─────────────────────────────────────────┐
│         Spark Messaging SDK             │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      TypeScript (v5.3.3)          │ │
│  │      - 타입 안정성                 │ │
│  │      - 개발 경험 향상               │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Socket.IO Client (v4.7.2)      │ │
│  │   - 실시간 통신                    │ │
│  │   - WebSocket 폴백                │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      Rollup (v4.6.0)             │ │
│  │      - 번들링                     │ │
│  │      - Tree-shaking               │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 핵심 라이브러리

### 1. Socket.IO Client

**버전**: `^4.7.2`

**용도**: 실시간 양방향 통신

**주요 기능**:

-   WebSocket 기반 통신
-   자동 폴백 (Long Polling 등)
-   재연결 자동 처리
-   이벤트 기반 API

**사용 위치**:

-   `src/core/connection.ts`: Socket 인스턴스 생성 및 관리
-   모든 통신의 기반

**설정**:

```typescript
const socketOptions = {
    auth: {
        key: projectKey,
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
};
```

**인증 방식**:

-   `auth.key`: Socket.IO auth 객체 사용 (권장, Node.js/브라우저 모두 지원)
-   `query.key`: 쿼리 파라미터 사용 (대안, URL에 노출되므로 보안상 덜 권장)
-   `extraHeaders`: Socket.IO 연결에서 지원되지 않음 (Express REST API에서만 사용)

**의존성 이유**:

-   실시간 통신의 표준 라이브러리
-   브라우저 호환성 우수
-   자동 재연결 등 편의 기능 제공

---

### 2. TypeScript

**버전**: `^5.3.3`

**용도**: 타입 안정성 및 개발 경험 향상

**주요 기능**:

-   정적 타입 검사
-   타입 추론
-   인터페이스 및 타입 별칭
-   제네릭 지원

**설정 파일**: `tsconfig.json`

**주요 설정**:

```json
{
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "declaration": true
}
```

**타입 정의 위치**:

-   `src/types/index.ts`: 공개 타입
-   `src/types/globals.d.ts`: 전역 타입
-   `dist/*.d.ts`: 빌드된 타입 정의

**의존성 이유**:

-   런타임 전 타입 검사
-   IDE 자동완성 지원
-   문서화 효과 (타입 = 문서)

---

## 빌드 도구

### 1. Rollup

**버전**: `^4.6.0`

**용도**: 모듈 번들링

**설정 파일**: `rollup.config.mjs`

**출력 형식**:

-   **CommonJS** (`dist/index.js`): Node.js 환경
-   **ES Module** (`dist/index.esm.js`): 브라우저 및 모던 Node.js

**특징**:

-   Tree-shaking 지원
-   소스맵 생성
-   타입 정의 생성

**플러그인**:

#### @rollup/plugin-typescript (v11.1.5)

-   TypeScript 컴파일
-   타입 정의 생성 (`*.d.ts`)
-   소스맵 생성

#### @rollup/plugin-node-resolve (v15.2.3)

-   Node.js 모듈 해석
-   `node_modules` 의존성 해석

#### @rollup/plugin-commonjs (v25.0.7)

-   CommonJS 모듈을 ES Module로 변환
-   `socket.io-client` 변환에 필요

**빌드 명령**:

```bash
npm run build      # 프로덕션 빌드
npm run dev        # 개발 모드 (watch)
```

**의존성 이유**:

-   작은 번들 크기 (Tree-shaking)
-   다양한 출력 형식 지원
-   플러그인 생태계

---

### 2. tslib

**버전**: `^2.6.2`

**용도**: TypeScript 런타임 헬퍼

**필요성**:

-   `@rollup/plugin-typescript`가 요구
-   TypeScript 컴파일된 코드의 런타임 지원

**의존성 이유**:

-   TypeScript 컴파일러가 요구
-   번들 크기 최적화 (공통 헬퍼 재사용)

---

## 개발 도구

### 1. Node.js

**요구 버전**: v18 이상

**용도**:

-   개발 환경
-   테스트 실행
-   빌드 실행

**사용 위치**:

-   `test/` 디렉토리의 테스트 파일
-   빌드 스크립트

---

### 2. npm

**요구 버전**: v9 이상

**용도**: 패키지 관리

**주요 명령**:

```bash
npm install          # 의존성 설치
npm run build        # 빌드
npm run dev          # 개발 모드
npm run test:sdk     # 테스트 실행
npm publish          # 배포
```

---

### 3. @types/node

**버전**: `^20.10.0`

**용도**: Node.js 타입 정의

**필요성**:

-   TypeScript에서 Node.js API 사용 시 타입 지원
-   `process.env` 등 Node.js 전역 객체 타입

---

## 의존성 관리

### 프로덕션 의존성

```json
{
    "dependencies": {
        "socket.io-client": "^4.7.2"
    }
}
```

**특징**:

-   최소한의 의존성
-   `socket.io-client`만 포함
-   번들 크기 최소화

---

### 개발 의존성

```json
{
    "devDependencies": {
        "@rollup/plugin-commonjs": "^25.0.7",
        "@rollup/plugin-node-resolve": "^15.2.3",
        "@rollup/plugin-typescript": "^11.1.5",
        "@types/node": "^20.10.0",
        "rollup": "^4.6.0",
        "tslib": "^2.6.2",
        "typescript": "^5.3.3"
    }
}
```

**특징**:

-   빌드 도구만 포함
-   런타임에 포함되지 않음
-   개발 및 빌드에만 필요

---

## 버전 호환성

### Node.js 버전

**지원 버전**:

-   Node.js v18 이상
-   ES2020 기능 사용

**테스트 환경**:

-   Node.js v20.15.1

---

### 브라우저 호환성

**지원 브라우저**:

-   Chrome/Edge (최신 2개 버전)
-   Firefox (최신 2개 버전)
-   Safari (최신 2개 버전)

**필요 기능**:

-   WebSocket 지원
-   ES2020 지원
-   Promise 지원

---

### Socket.IO 버전

**클라이언트**: `^4.7.2`

**서버 호환성**:

-   Socket.IO Server v4.x 권장
-   Socket.IO Server v3.x도 호환 가능 (일부 기능 제한)

---

## 기술 선택 이유

### Socket.IO 선택 이유

1. **표준 라이브러리**: 실시간 통신의 사실상 표준
2. **자동 폴백**: WebSocket 실패 시 자동으로 Long Polling 사용
3. **재연결**: 네트워크 끊김 시 자동 재연결
4. **이벤트 기반**: 간단하고 직관적인 API
5. **브라우저 호환성**: 모든 주요 브라우저 지원

### TypeScript 선택 이유

1. **타입 안정성**: 런타임 전 오류 발견
2. **개발 경험**: IDE 자동완성 및 리팩토링 지원
3. **문서화**: 타입 정의가 문서 역할
4. **유지보수성**: 대규모 프로젝트에 적합

### Rollup 선택 이유

1. **Tree-shaking**: 사용하지 않는 코드 제거
2. **작은 번들**: 최소한의 번들 크기
3. **다양한 출력**: CommonJS와 ESM 동시 지원
4. **플러그인**: TypeScript, CommonJS 등 플러그인 지원

---

## 성능 고려사항

### 번들 크기

**현재 크기** (예상):

-   `dist/index.js`: ~15KB (gzipped)
-   `dist/index.esm.js`: ~15KB (gzipped)

**최적화**:

-   Tree-shaking으로 불필요한 코드 제거
-   `socket.io-client`는 외부 의존성으로 처리
-   소스맵은 별도 파일로 분리

---

### 런타임 성능

**최적화 포인트**:

1. **콜백 배열**: O(n) 순회이지만 일반적으로 콜백 수가 적음
2. **Set 사용**: 방 목록 조회 O(1)
3. **이벤트 리스너**: Socket.IO 네이티브 이벤트 활용
4. **메모리 관리**: `disconnect()` 시 모든 리소스 정리

---

## 보안 고려사항

### 의존성 보안

**정기 점검**:

```bash
npm audit
```

**업데이트**:

-   보안 패치가 있는 경우 즉시 업데이트
-   마이너 버전 업데이트는 호환성 확인 후 진행

### 인증 정보

**프로젝트 키**:

-   클라이언트에 하드코딩하지 않음
-   환경 변수 또는 설정으로 관리
-   민감한 정보 노출 방지

---

## 업그레이드 가이드

### Socket.IO 업그레이드

**주의사항**:

-   Major 버전 업그레이드 시 API 변경 확인
-   서버 버전과 호환성 확인
-   테스트 충분히 수행

**절차**:

1. 버전 업데이트
2. 타입 체크: `npx tsc --noEmit`
3. 빌드 테스트: `npm run build`
4. 통합 테스트: `npm run test:sdk`

### TypeScript 업그레이드

**주의사항**:

-   타입 체크 강화 가능
-   Breaking change 확인

**절차**:

1. 버전 업데이트
2. 타입 에러 확인 및 수정
3. 빌드 테스트

---

## 대안 기술 비교

### Socket.IO vs WebSocket

| 항목         | Socket.IO | WebSocket    |
| ------------ | --------- | ------------ |
| 폴백 지원    | ✅ 자동   | ❌ 없음      |
| 재연결       | ✅ 자동   | ❌ 수동 구현 |
| 브로드캐스트 | ✅ 내장   | ❌ 수동 구현 |
| 번들 크기    | 큰 편     | 작음         |
| **선택**     | ✅        | ❌           |

**선택 이유**: 편의성과 안정성

---

### Rollup vs Webpack

| 항목            | Rollup | Webpack           |
| --------------- | ------ | ----------------- |
| 번들 크기       | 작음   | 큰 편             |
| Tree-shaking    | 우수   | 보통              |
| 설정 복잡도     | 간단   | 복잡              |
| 라이브러리 빌드 | 적합   | 애플리케이션 적합 |
| **선택**        | ✅     | ❌                |

**선택 이유**: 라이브러리 빌드에 최적화

---

이 문서를 통해 프로젝트의 기술 스택을 완전히 이해할 수 있습니다. 각 기술의 선택 이유와 사용 방법을 파악하면 프로젝트를 더 효과적으로 개발하고 유지보수할 수 있습니다.
