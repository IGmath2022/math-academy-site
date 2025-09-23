# 🚀 Render 배포 가이드

## 📋 배포 전 체크리스트

### ✅ 완료된 사항들
- [x] Node.js 엔진 버전 명시 (>=18.0.0)
- [x] 시작 스크립트 `npm start` 설정
- [x] 보안 헤더 (Helmet) 적용
- [x] 전역 에러 핸들러 구현
- [x] 환경별 데이터베이스 설정
- [x] PostgreSQL 지원 추가

## ⚠️ Render 배포 시 주의사항

### 1. 데이터베이스 설정
- **SQLite 파일은 Render에서 재시작 시 삭제됩니다**
- MongoDB + PostgreSQL(선택사항) 조합으로 구성됨
- PostgreSQL을 사용하려면 Render에서 PostgreSQL 서비스 추가 필요

### 2. 환경변수 설정 (Render Dashboard에서 설정)

#### 🔴 필수 환경변수
```bash
# 운영 환경 설정
NODE_ENV=production
PORT=10000

# MongoDB (필수)
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database

# CORS 설정 (프론트엔드 도메인)
CORS_ORIGINS=https://your-frontend-domain.com

# 기본 URL
REPORT_BASE_URL=https://your-render-app.onrender.com
```

#### 🟡 선택적 환경변수 (기능 사용 시 필요)
```bash
# PostgreSQL (Render PostgreSQL 서비스 사용 시 자동 설정)
DATABASE_URL=postgresql://user:pass@host:port/db

# Aligo SMS (SMS 발송 기능 사용 시)
ALIGO_API_KEY=your_api_key
ALIGO_USER_ID=your_user_id
ALIGO_SENDER_KEY=your_sender_key
ALIGO_SENDER=your_phone_number

# Cloudflare R2 (파일 업로드 사용 시)
R2_ENDPOINT=https://account_id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=your_bucket_name

# CRON 설정
CRON_ENABLED_AUTO_LEAVE=1
AUTO_LEAVE_CRON=30 22 * * *
DAILY_REPORT_AUTO=1
DAILY_REPORT_CRON=30 10 * * *
```

## 🔧 Render 서비스 설정

### Web Service 생성
1. **Build Command**: (비워두기 - 빌드 불필요)
2. **Start Command**: `npm start`
3. **Node Version**: `18` 또는 최신 LTS
4. **Root Directory**: `server` (서버 폴더 지정)

### 배포 시퀀스
1. GitHub/GitLab 연동
2. 환경변수 설정
3. 배포 트리거
4. 로그 확인

## 🚨 배포 후 확인사항

### 헬스체크
```bash
# 서버 상태 확인
curl https://your-app.onrender.com/healthz
```

### 로그 확인 포인트
- MongoDB 연결 성공: `[MongoDB] connected`
- PostgreSQL 연결 (사용 시): `[Sequelize] Database connection established`
- 서버 시작: `서버가 http://localhost:10000 에서 실행중`
- CORS 설정: `[CORS] allowed (env)`

## 🐛 자주 발생하는 에러와 해결방법

### 1. 데이터베이스 연결 실패
```
[MongoDB] 연결 실패
```
**해결**: `MONGO_URL` 환경변수 확인, MongoDB Atlas IP 화이트리스트 설정

### 2. CORS 에러
```
Access to fetch blocked by CORS policy
```
**해결**: `CORS_ORIGINS`에 프론트엔드 도메인 추가

### 3. 파일 업로드 실패
```
S3/R2 관련 에러
```
**해결**: R2 환경변수 설정 확인 또는 로컬 업로드로 폴백

### 4. Port 바인딩 에러
**해결**: Render가 자동으로 PORT 환경변수 설정 (수동 설정 불필요)

## 📱 프론트엔드 배포

### 클라이언트 환경변수
```bash
# .env.production
REACT_APP_API_URL=https://your-render-app.onrender.com
```

### Vercel/Netlify 배포 시
- Build Command: `npm run build`
- Output Directory: `build`
- Root Directory: `client`

## 🔄 업데이트 배포

코드 변경 후 Git push하면 Render가 자동으로 재배포됩니다.

```bash
git add .
git commit -m "feature: 새 기능 추가"
git push origin main
```

## 📞 배포 지원

배포 중 문제가 발생하면:
1. Render 로그 확인
2. 환경변수 재점검
3. MongoDB 연결상태 확인
4. 헬스체크 엔드포인트 테스트