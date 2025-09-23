# 🐛 배포 후 에러 디버깅 가이드

## 📋 에러 공유 방법

### 🔍 **1. 프론트엔드 에러 (F12 개발자 도구)**

#### Console 탭에서 복사:
```javascript
// ✅ 이런 정보들을 복사해서 공유해주세요
🚨 Error Details
  Error: TypeError: Cannot read properties of undefined (reading 'map')
  Context: Dashboard component - user list rendering
  URL: https://your-app.com/dashboard
  Time: 2024-01-15T10:30:45.123Z

🌐 API Error Details
  Endpoint: /api/users
  Status: 404 Not Found
  Response: { error: "사용자 목록을 찾을 수 없습니다." }
```

#### Network 탭에서 확인:
1. **실패한 요청들** (빨간색으로 표시)
2. **Status Code** (404, 500, 403 등)
3. **Response 내용** (클릭해서 확인)

### 🖥️ **2. 서버 에러 (Render 로그)**

#### Render Dashboard → 서비스 → Logs에서 복사:
```bash
# ✅ 이런 로그들을 복사해서 공유해주세요
Jan 15 10:30:45 PM [MongoDB] connected: mongodb+srv://****@cluster
Jan 15 10:30:50 PM [ERROR] TypeError: Cannot read property 'id' of undefined
Jan 15 10:30:50 PM     at /opt/render/project/src/controllers/userController.js:23:15
Jan 15 10:30:50 PM [Global Error Handler] 500 Internal Server Error
```

## 🚀 **즉시 해결 가능한 에러 유형들**

### ❌ **1. API 연결 에러**
```javascript
// 증상: Network 탭에서 빨간색 에러
GET https://your-app.onrender.com/api/users 404

// 원인 & 해결:
✅ API 엔드포인트 오타 수정
✅ 서버 라우트 추가
✅ CORS 설정 수정
```

### ❌ **2. 환경변수 누락**
```bash
# 증상: 서버 로그
[ERROR] MONGO_URI is not defined

# 해결: Render Dashboard에서 환경변수 추가
✅ MONGO_URL=mongodb+srv://...
✅ NODE_ENV=production
```

### ❌ **3. React 컴포넌트 에러**
```javascript
// 증상:
TypeError: users.map is not a function

// 해결:
✅ 배열 체크 로직 추가
✅ 로딩 상태 처리
✅ 기본값 설정
```

### ❌ **4. 인증/권한 에러**
```javascript
// 증상:
401 Unauthorized
403 Forbidden

// 해결:
✅ JWT 토큰 확인
✅ 로그인 상태 검증
✅ 권한 체크 로직 수정
```

## 📱 **에러 공유 템플릿**

### 프론트엔드 에러 공유 시:
```
🐛 **에러 발생 상황**
- 페이지: /dashboard
- 동작: 사용자 목록 로드 시
- 브라우저: Chrome/Safari/Firefox

🔍 **콘솔 에러**
[여기에 F12 Console 에러 복사]

🌐 **네트워크 에러** (있다면)
[여기에 Network 탭 실패 요청 정보 복사]
```

### 서버 에러 공유 시:
```
🖥️ **서버 로그**
[여기에 Render 로그 복사]

⚙️ **환경변수 상태**
- NODE_ENV: production
- MONGO_URL: 설정됨/미설정
- CORS_ORIGINS: 설정됨/미설정
```

## 🔧 **즉시 시도해볼 수 있는 해결방법들**

### 1. **브라우저 새로고침 + 캐시 삭제**
```
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)
```

### 2. **환경변수 재확인**
- Render Dashboard → Environment
- 필수 변수들이 모두 설정되었는지 확인

### 3. **서버 재시작**
- Render Dashboard → Manual Deploy

### 4. **헬스체크 확인**
```
https://your-app.onrender.com/healthz
```

## 📞 **에러 리포팅 절차**

1. **에러 재현** 단계 기록
2. **콘솔 에러** 복사
3. **네트워크 탭** 확인
4. **서버 로그** 확인 (가능하면)
5. **환경변수 상태** 점검
6. **전체 정보를 터미널에 공유**

## ⚡ **빠른 대응이 가능한 시간대**
- 평일 09:00-18:00 (즉시 대응)
- 주말/야간 (4-8시간 내 대응)

---

**💡 팁**: 에러 정보가 많을수록 빠르고 정확한 해결이 가능합니다!