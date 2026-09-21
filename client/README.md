# Shoppingmall Client

React + Vite의 JavaScript(JSX) 프로젝트입니다. Node.js 22.12 이상을 사용하세요.

## 시작

```powershell
cd client
npm install
npm run dev
```

http://localhost:5173 을 엽니다. 포트가 사용 중이면 오류를 표시합니다.

- `npm run dev`: 개발 서버 및 변경 사항 자동 반영
- `npm run lint`: 공식 템플릿의 Oxlint로 코드 검사
- `npm run build`: 배포용 dist/ 생성
- `npm run preview`: 빌드 결과 로컬 미리 보기 (운영 서버가 아닙니다)

## 백엔드 연결

별도 터미널에서 server 폴더의 `npm run dev`를 실행하세요. MongoDB 연결이 필요합니다. 시작 화면의 연결 확인 버튼으로 /api/health를 호출할 수 있습니다.

개발 중 /api 요청은 Vite가 http://127.0.0.1:5000 으로 전달합니다. 초기 .env 파일도 생성되어 있습니다. 재설정 시 .env.example을 .env로 복사하세요. API_PROXY_TARGET을 수정하면 개발 프록시 주소가 변경됩니다. 환경변수 변경 후 Vite를 재시작하세요.

VITE_API_BASE_URL은 기본 /api입니다. 별도 도메인으로 배포하면 실제 API 주소(예: https://api.example.com/api)를 설정한 뒤 다시 빌드하고 서버의 CLIENT_ORIGIN도 프런트엔드 도메인으로 변경하세요. 같은 도메인을 사용하면 호스팅 서버에서 /api를 Express로 프록시해야 합니다. 개발 프록시는 배포 파일에 포함되지 않습니다.

VITE_ 환경변수는 브라우저에 공개되므로 비밀번호나 MongoDB 연결 문자열을 넣지 마세요.

## 구조

- src/main.jsx: React 진입점 및 StrictMode
- src/App.jsx: 시작 화면
- src/api/health.js: API 호출 예제
- src/index.css: 전역 스타일
- src/App.css: 화면 스타일
- vite.config.js: React 플러그인, 개발 프록시, @ 별칭
- jsconfig.json: 편집기에서 @/를 src/로 인식

기능이 늘어나면 src/components, src/pages, src/hooks 폴더를 추가하세요.

공식 가이드: [Vite](https://vite.dev/guide/), [React](https://react.dev/learn)

