# 🏦 MOIN Backend Assignment

> **해외 송금 서비스 백엔드 API 구현**

## 📌 프로젝트 개요

&#x20;**Nest.js + TypeORM + PostgreSQL**을 기반으로 **해외 송금 서비스**의 백엔드 API를 구현했습니다. 핵심적으로 **회원 가입, 로그인, 송금 견적서 생성, 송금 요청 및 거래 내역 조회** 기능을 포함하며, JWT 인증 및 보안 적용을 수행하였습니다. 또한, Jest 기반의 단위 테스트를 포함하여 안정성을 검증하였습니다.

---

## 🚀 **API 실행 방법**

### **1️⃣ 프로젝트 설정**

```bash
# 1. 패키지 설치
yarn install

# 2. 환경 변수 설정 (.env 파일 확인)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=moin
DATABASE_PASSWORD=moin1234
DATABASE_NAME=moin
PORT=3000
JWT_SECRET=123123
JWT_EXPIRATION=1800s # 30분
```

### **2️⃣ Docker 실행** (PostgreSQL 포함)

```bash
# Docker 컨테이너 실행
docker-compose up -d
```

### **3️⃣ 서버 실행**

```bash
# 서버 실행
yarn start
```

### **4️⃣ 테스트 실행**

```bash
# 전체 유닛 테스트 실행
yarn test
```

---

## 🔑 **API 사용 방법**

### **1️⃣ 회원가입 (User Signup)**

📌 **사용자 정보를 저장하며, 비밀번호 및 민감 정보는 암호화됩니다.**

```http
POST /user/signup
```

#### ✅ 요청 예시

```json
{
  "userId": "test@example.com",
  "password": "1234abcd",
  "name": "홍길동",
  "idType": "REG_NO",
  "idValue": "900101-1234567"
}
```

#### ✅ 응답 예시

```json
{
  "resultCode": 200,
  "resultMsg": "OK"
}
```

📌 **비밀번호는 bcrypt로 해싱되어 저장되며, 주민등록번호/사업자번호는 추가로 암호화됩니다.**

---

### **2️⃣ 로그인 (User Login)**

📌 **JWT 기반 로그인 인증을 수행합니다.**

```http
POST /user/login
```

#### ✅ 요청 예시

```json
{
  "userId": "test@example.com",
  "password": "1234abcd"
}
```

#### ✅ 응답 예시

```json
{
  "resultCode": 200,
  "resultMsg": "OK",
  "token": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

📌 **로그인 성공 시 JWT 토큰이 발급되며, 이후 API 요청 시 인증을 위해 사용됩니다.**

---

### **3️⃣ 송금 견적서 조회 (Get Transfer Quote)**

📌 **환율 API를 활용하여 실시간으로 송금 견적을 생성하며, 견적서는 10분 동안 유효합니다.**

```http
POST /transfer/quote
Authorization: Bearer {JWT}
```

#### ✅ 요청 예시

```json
{
  "amount": 10070,
  "targetCurrency": "JPY"
}
```

#### ✅ 응답 예시

```json
{
  "resultCode": 200,
  "resultMsg": "OK",
  "quote": {
    "quoteId": "18d14c44-1bfd-492e-a063-41f0415fa5ea",
    "exchangeRate": 9.571,
    "expireTime": "2025-02-11 00:09:19",
    "targetAmount": 733.44
  }
}
```

---

### **4️⃣ 송금 요청 (Request Transfer)**

📌 \*\*송금 요청 시 견적서 만료 여부 및 1일

