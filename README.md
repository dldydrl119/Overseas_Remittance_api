# MOIN Backend 기술 과제

> 해외 송금 서비스 백엔드 API 

## 프로젝트 개요

&#x20;**Nest.js + TypeORM + PostgreSQL**을 기반으로 **해외 송금 서비스**의 백엔드 API를 제작했습니다. \
1\. 회원 가입 API 

2\. 로그인 API 

3\. 송금 견적서를 갖고 오는 API 

4\. 송금 접수 요청 API 

5\. 회원의 거래 이력을 가지고 오는 API 

JWT 인증 및 보안적인 부분도 제작하였습니다. \
추가로 Jest 기반의 단위 테스트를 포함하여 안정성을 검증하였습니다.

---

## 🛠 기술 스택

- **Backend**: Nest.js (TypeScript)
- **Database**: PostgreSQL (TypeORM)
- **Security**: JWT 인증, bcrypt 해싱
- **Testing**: Jest (Unit Test)
- **API Documentation**: Postman

---

## API 실행 방법

### **1️⃣ 프로젝트 설정**

```bash
# 패키지 설치
yarn install

# 환경 변수 설정 (.env 파일 확인)
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

## API 사용 방법

### **1️⃣ 회원가입 (User Signup)**

**사용자 정보를 저장하며, 비밀번호 및 민감 정보는 암호화됩니다.**

```http
POST {{API_URL}}/user/signup
```

#### 요청 예시

```json
{
  "userId": "test@example.com",
  "password": "1234abcd",
  "name": "홍길동",
  "idType": "REG_NO",
  "idValue": "900101-1234567"
}
```

#### 응답 예시

```json
{
  "resultCode": 200,
  "resultMsg": "OK"
}
```

비밀번호는 bcrypt로 해싱되어 저장되며, 주민등록번호/사업자번호는 추가로 암호화됩니다.

---

### **2️⃣ 로그인 (User Login)**

📌 **JWT 기반 로그인 인증을 수행합니다.**

```http
POST {{API_URL}}/user/login
```

#### 요청 예시

```json
{
  "userId": "test@example.com",
  "password": "1234abcd"
}
```

#### 응답 예시

```json
{
  "resultCode": 200,
  "resultMsg": "OK",
  "token": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

**로그인 성공 시 JWT 토큰이 발급되며, 이후 API 요청 시 인증을 위해 사용됩니다.**

---

### **3️⃣ 송금 견적서 조회 (Get Transfer Quote)**

**환율 API를 활용하여 실시간으로 송금 견적을 생성하며, 견적서는 10분 동안 유효합니다.**

```http
POST {{API_URL}}/transfer/quote
Authorization: Bearer {JWT}
```

#### 요청 예시

```json
{
  "amount": 10070,
  "targetCurrency": "JPY"
}
```

#### 응답 예시

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


---

### **4️⃣ 송금 요청 (Request Transfer)**

**견적서 검증 & 한도 초과 체크**

```http
POST {{API_URL}}/transfer/request
Authorization: Bearer {JWT}
```

#### 요청 예시

```json
{
  "quoteId": "18d14c44-1bfd-492e-a063-41f0415fa5ea"
}
```

#### 응답 예시

```json
{
  "resultCode": 200,
  "resultMsg": "OK"
}
```

**송금 요청 시 견적서 만료 여부 및 1일 한도를 초과하는지 확인 후 처리합니다.**

---

### **5️⃣ 거래 내역 조회 (Get Transaction List)**

**사용자의 송금 기록 & 총 송금액 조회**

```http
GET {{API_URL}}/transfer/list
Authorization: Bearer {JWT}
```

#### 응답 예시

```json
{
  "resultCode": 200,
  "resultMsg": "OK",
  "userId": "test@example.com",
  "name": "홍길동",
  "todayTransferCount": 0,
  "todayTransferUsdAmount": 0,
  "history": [
    {
      "sourceAmount": 6949,
      "fee": 1013,
      "usdExchangeRate": 9.573,
      "usdAmount": 620.0773,
      "targetCurrency": "JPY",
      "exchangeRate": 9.573,
      "targetAmount": 725,
      "requestedDate": "2025-02-10T08:09:15.976Z"
    },
    {
      "sourceAmount": 6950,
      "fee": 1013,
      "usdExchangeRate": 9.572,
      "usdAmount": 620.2466,
      "targetCurrency": "JPY",
      "exchangeRate": 9.572,
      "targetAmount": 726,
      "requestedDate": "2025-02-10T07:46:56.141Z"
    },
    {
      "sourceAmount": 7019,
      "fee": 1014,
      "usdExchangeRate": 9.571,
      "usdAmount": 627.4162,
      "targetCurrency": "JPY",
      "exchangeRate": 9.571,
      "targetAmount": 733,
      "requestedDate": "2025-02-10T05:59:34.958Z"
    },
    {
      "sourceAmount": 6950,
      "fee": 1013,
      "usdExchangeRate": 9.571,
      "usdAmount": 620.3114,
      "targetCurrency": "JPY",
      "exchangeRate": 9.571,
      "targetAmount": 726,
      "requestedDate": "2025-02-10T05:58:56.637Z"
    }
  ]
}
```

**사용자의 송금 내역을 확인하며, 날짜별로 정렬되어 제공됩니다.**

---

## 📝 이슈 및 회고

### 💡 **구현하면서 겪은 이슈**

- **환율 API 장애 대응**
실시간 환율 데이터를 가져오는 업비트 API 서버가 일시적으로 다운되면서 송금 견적서 생성에 실패하는 문제가 발생
장애 발생 시 캐싱된 환율 데이터를 우선 제공하도록 Redis 기반 캐싱 로직을 추가하여 해결했습니다.

- **트랜잭션 롤백 문제**
송금 요청 처리 중 오류가 발생했을 때 일부 데이터만 저장되는 문제가 발생
TypeORM의 QueryRunner를 활용하여 트랜잭션을 명확하게 제어하도록 개선했습니다.

- **테스트 환경에서 ConfigService 누락 문제**
Jest 환경에서 ConfigService가 주입되지 않아 테스트가 실패
RootTestModule을 만들어 모든 테스트에서 ConfigService를 공통적으로 사용할 수 있도록 수정하여 해결했습니다.

### **개선할 점**

- 환율 API 장애 대응 로직 추가 고도화
  단순 캐싱 외에도 장애 시 fallback API를 활용하는 방안 
- Swagger 기반 API 문서 자동화
  Postman 대신 Swagger 문서를 자동으로 생성하여 유지보수 편의성을 높일 필요가 있음
---

### Postman
---
Postman API 로 충분히 테스트가 가능합니다.
각 API 요청 예제와 응답 예시는 위 내용대로 Postman에서 진행하시면 됩니다.



