# 🧪 로컬에서 서버 환경과 동일하게 테스트하기

## 🤔 **왜 로컬과 서버에서 에러가 다를까?**

### 🔴 **핵심 차이점들**

**1. 데이터베이스 이중 구조**
```bash
# 로컬 환경 (기존)
SQLite: User, School, Assignment 등 → db.sqlite 파일
MongoDB: Setting, 기타 설정들 → 클라우드 DB

# 서버 환경 (Render)
SQLite: 재시작 시 삭제됨 (휘발성) → 데이터 손실
MongoDB: 모든 데이터 → 클라우드 DB (영구저장)
```

**2. 환경변수 차이**
```bash
# 로컬: NODE_ENV=development
# 서버: NODE_ENV=production
```

**3. API 연결 방식**
```bash
# 로컬: http://localhost:4000
# 서버: https://your-app.onrender.com
```

## 🚀 **서버와 동일한 환경에서 로컬 테스트하기**

### 📋 **방법 1: 운영 모드로 로컬 테스트**

```bash
# 서버 폴더에서
cd server
npm run test-prod

# 또는 실시간 재시작 (nodemon)
npm run test-prod:watch
```

**이렇게 하면:**
- ✅ SQLite 비활성화 (MongoDB만 사용)
- ✅ NODE_ENV=production 모드
- ✅ 서버와 동일한 데이터베이스 구조
- ✅ 운영 환경과 같은 에러 발생

### 📋 **방법 2: 클라이언트를 서버 API에 연결**

```bash
# client/.env.development.local 파일 수정
REACT_APP_API_URL=https://math-academy-server.onrender.com

# 클라이언트 실행
cd client
npm start
```

**이렇게 하면:**
- ✅ 실제 운영 서버 API 사용
- ✅ 실제 운영 데이터로 테스트
- ✅ 서버 에러를 로컬에서 바로 확인

## 🔍 **각 방법별 장단점**

### 🟢 **방법 1: 로컬 운영모드 (추천)**

**장점:**
- 빠른 테스트 사이클
- 로컬에서 서버 코드 수정 가능
- 디버깅 용이

**단점:**
- 운영 DB를 건드릴 위험
- 초기 설정 필요

### 🟡 **방법 2: 운영 API 연결**

**장점:**
- 100% 실제 운영 환경
- 설정 변경 최소

**단점:**
- 서버 재배포 필요 (코드 수정 시)
- 네트워크 지연

## ⚙️ **설정 상세 가이드**

### 1. 로컬 운영모드 설정

```bash
# server/.env.test 파일이 자동 생성됨
# 필요시 MongoDB URL 등 수정 가능

# 실행
cd server
npm run test-prod:watch
```

### 2. 클라이언트 API 연결 변경

```bash
# client/.env.development.local
REACT_APP_API_URL=http://localhost:4000  # 로컬 서버
# 또는
REACT_APP_API_URL=https://math-academy-server.onrender.com  # 운영 서버
```

## 🐛 **테스트 시나리오**

### 📝 **1. 기본 기능 테스트**
1. 로그인/로그아웃
2. 대시보드 로드
3. 사용자 목록 조회
4. 데이터 CRUD 작업

### 📝 **2. 에러 시나리오 테스트**
1. 잘못된 API 호출
2. 권한 없는 접근
3. 네트워크 에러
4. 데이터 유효성 검사

## 💡 **팁: 효율적인 테스트 워크플로우**

### 🔄 **개발 단계별 테스트**

```bash
# 1단계: 로컬 개발 모드 (빠른 개발)
cd server && npm run dev
cd client && npm start

# 2단계: 로컬 운영 모드 (서버 환경 시뮬레이션)
cd server && npm run test-prod:watch
cd client && npm start

# 3단계: 실제 배포 (최종 확인)
git push origin main
```

### 🎯 **문제 발생 시 체크리스트**

1. **로컬에서 정상** → **서버에서 에러**
   - 환경변수 차이 확인
   - 데이터베이스 연결 상태 점검
   - 로그 비교 분석

2. **로컬 운영모드에서 재현**
   - `npm run test-prod:watch`로 실행
   - 동일한 에러가 나오는지 확인
   - 로컬에서 수정 후 배포

3. **그래도 차이가 있다면**
   - Render 로그 확인
   - 환경변수 설정 재점검
   - 버전 차이 (Node.js, npm) 확인

## 🚨 **주의사항**

- **운영 DB 사용 시**: 테스트 데이터 추가/삭제 주의
- **API Rate Limiting**: 과도한 요청 자제
- **환경변수 보안**: .env.test 파일 Git 커밋 금지

---

**이제 로컬에서도 서버와 동일한 에러를 확인할 수 있습니다!** 🎉