# Shoppingmall Server

Node.js + Express + MongoDB(Mongoose) API 시작 프로젝트입니다. Node.js 22 이상이 필요합니다.

## 실행

```powershell
cd server
npm install
Copy-Item .env.example .env # .env가 없는 최초 설정 시에만 실행
npm run dev
```

`.env`는 초기 설정 시 생성되어 있습니다. 로컬 MongoDB를 별도로 설치하고 실행하거나, MongoDB Atlas 연결 문자열을 `MONGODB_URI`에 입력하세요. MongoDB에 연결되어야 HTTP 서버가 시작됩니다.

- `PORT`: API 포트, 기본 5000
- `MONGODB_URI`: 기본 `mongodb://127.0.0.1:27017/shoppingmall`
- `CLIENT_ORIGIN`: 프런트엔드 주소, 기본 `http://localhost:5173`

개발 시 `npm run dev`는 파일 변경 시 서버를 재시작합니다. 일반 실행은 `npm start`입니다.

## 확인

- `GET http://localhost:5000/`: API 안내
- `GET http://localhost:5000/api/health`: DB 연결 시 200, 연결 해제 시 503

`src/app.js`에 라우터를 연결하고, 기능이 늘어나면 `src/routes`, `src/controllers`, `src/models`로 분리하세요. 환경변수는 `src/config/env.js`, DB 연결은 `src/config/db.js`, 실행 및 종료 처리는 `src/server.js`에서 관리합니다.

연결 실패 시 MongoDB 실행 여부, Atlas 네트워크 접근 허용 및 계정 정보, `.env`의 연결 문자열을 확인하세요. `.env`는 Git에서 제외됩니다.

공식 문서: [Express](https://expressjs.com/), [Mongoose 연결](https://mongoosejs.com/docs/connections.html)

## 사용자 CRUD

| 메서드 | 경로 | 동작 |
| --- | --- | --- |
| POST | /api/users | 생성 (201) |
| GET | /api/users?page=1&limit=20 | 목록 및 전체 개수 (200), limit 최대 100 |
| GET | /api/users/:id | 단건 조회 (200) |
| PATCH | /api/users/:id | 전달한 필드만 수정 (200) |
| DELETE | /api/users/:id | 삭제 (204, 본문 없음) |

POST 요청 예시:

```json
{
  "phone_number": "01012345678",
  "name": "홍길동",
  "password": "my-password",
  "user_type": "customer",
  "address": "서울"
}
```

단건 응답은 `{ "user": { ... } }`, 목록은 `{ "users": [], "page": 1, "limit": 20, "total": 0 }` 형태입니다. 비밀번호는 컨트롤러에서 salt를 적용한 scrypt 해시로 저장하고 모든 응답에서 제외합니다. 모델을 직접 사용하면 이 해시 처리는 적용되지 않습니다. 생성·수정 시 스키마 검증과 자동 타임스탬프가 적용됩니다.

입력값 오류와 잘못된 ID는 400, 없는 사용자는 404입니다. PATCH는 비어 있지 않은 객체를 받으며 address를 지우려면 빈 문자열을 전달하세요. 스키마에 없는 필드와 문자열이 아닌 값은 거부합니다. 전화번호 중복 제한은 원래 스키마와 마찬가지로 없습니다.

현재 인증·권한 미들웨어는 없습니다. 이 개발용 CRUD는 누구나 조회·수정·삭제 및 admin 지정이 가능하므로 외부 서비스에 공개하기 전에 로그인과 관리자/본인 권한 검사를 연결해야 합니다.

`npm test`는 임시 MongoDB로 CRUD와 입력 검증, 비밀번호 응답 제외, 타임스탬프를 확인합니다. 기존 DB는 사용하지 않습니다. 최초 실행 시 테스트용 MongoDB 바이너리를 다운로드합니다.

사용자 API의 경로 연결과 검증 미들웨어는 `src/routes/users.js`, CRUD 처리와 비밀번호 해시는 `src/controllers/userController.js`에서 관리합니다.
