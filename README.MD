# Shopping Mall Project 작업 기록

이 문서는 강의를 들으면서 만든 쇼핑몰 프로젝트의 작업 내용을 기록한 README입니다.

목표는 단순히 "무엇을 만들었다"가 아니라, **왜 만들었는지**, **어떤 파일이 어떤 일을 하는지**, **버튼을 누르면 서버까지 어떤 흐름으로 움직이는지**를 쉽게 이해하는 것입니다.

중학생도 이해할 수 있도록 어려운 말은 최대한 풀어서 설명했습니다.

---

## 1. 프로젝트 한 줄 설명

React로 화면을 만들고, Express 서버와 MongoDB를 연결해서 회원가입, 로그인, 관리자 페이지, 상품 등록, 상품 조회를 할 수 있는 쇼핑몰 웹페이지입니다.

---

## 2. 사용한 기술

### 화면 쪽, 즉 프론트엔드

- `React`: 화면을 여러 컴포넌트로 나누어 만드는 도구
- `Vite`: React 개발 서버를 빠르게 실행해 주는 도구
- `react-router-dom`: 주소에 따라 다른 페이지를 보여주는 도구
- `react-icons`: 아이콘을 쉽게 쓰게 해주는 도구
- `sessionStorage`: 로그인 토큰을 브라우저에 잠시 저장하는 공간
- `Cloudinary Upload Widget`: 이미지를 업로드하고 URL을 받아오는 도구

### 서버 쪽, 즉 백엔드

- `Express`: API 서버를 만드는 도구
- `Mongoose`: MongoDB 데이터를 자바스크립트 코드로 쉽게 다루는 도구
- `MongoDB`: 회원 정보와 상품 정보를 저장하는 데이터베이스
- `bcryptjs`: 비밀번호를 암호화해서 저장하는 도구
- `jsonwebtoken`: 로그인 토큰을 만들고 확인하는 도구
- `nodemon`: 서버 코드가 바뀌면 자동으로 서버를 다시 켜주는 도구

---

## 3. 프로젝트 폴더 구조

```txt
Shopping mall/
  client/                     # React 화면 코드
    src/
      api/                    # 서버 API를 호출하는 함수들
      components/             # 여러 페이지에서 같이 쓰는 컴포넌트
      pages/                  # 실제 페이지 화면들
    .env                      # 클라이언트 환경 변수

  server/                     # Express 서버 코드
    controllers/              # 실제 기능을 처리하는 함수들
    middleware/               # 로그인/관리자 권한 확인 같은 중간 검사
    models/                   # MongoDB 데이터 모양
    routes/                   # API 주소를 정하는 곳
    .env                      # 서버 환경 변수
```

쉽게 말하면:

- `client`는 사용자가 보는 화면입니다.
- `server`는 화면이 요청하면 데이터를 저장하거나 보내주는 곳입니다.
- `models`는 데이터의 모양입니다.
- `routes`는 API 주소입니다.
- `controllers`는 API가 실제로 하는 일입니다.

---

## 4. 실행 방법

### 서버 실행

```bash
cd server
npm install
npm run dev
```

서버는 기본적으로 `http://localhost:4000`에서 실행됩니다.

### 클라이언트 실행

```bash
cd client
npm install
npm run dev
```

화면은 기본적으로 `http://localhost:5173`에서 실행됩니다.

---

## 5. 환경 변수

### server/.env

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/shopping-mall
JWT_SECRET=아무도_모르는_긴_비밀문자열
JWT_EXPIRES_IN=7d
```

설명:

- `PORT`: 서버가 실행될 번호입니다.
- `MONGODB_URI`: MongoDB 주소입니다.
- `JWT_SECRET`: 로그인 토큰을 만들 때 쓰는 비밀 열쇠입니다.
- `JWT_EXPIRES_IN`: 토큰이 얼마나 오래 유지되는지 정합니다.

### client/.env

```env
VITE_CLOUDINARY_CLOUD_NAME=dnophcfpi
VITE_CLOUDINARY_UPLOAD_PRESET=shoppingmall
```

설명:

- `VITE_CLOUDINARY_CLOUD_NAME`: Cloudinary 계정 이름입니다.
- `VITE_CLOUDINARY_UPLOAD_PRESET`: 업로드 규칙 이름입니다.

중요:

Vite에서는 클라이언트 환경 변수 이름이 반드시 `VITE_`로 시작해야 화면 코드에서 읽을 수 있습니다.

---

## 6. 지금까지 작업한 내용

## 6-1. package.json 파싱 오류 해결

처음에는 `package.json` 파일을 Cursor나 VS Code가 제대로 읽지 못하는 문제가 있었습니다.

해결한 내용:

- `package.json` 파일 형식을 정상화했습니다.
- 줄바꿈 문제를 정리했습니다.
- 서버 package 정보에 설명을 추가했습니다.

쉽게 말하면, 프로젝트의 "설명서" 같은 파일을 에디터가 잘 읽을 수 있게 고쳤습니다.

---

## 6-2. 유저 스키마 만들기

파일:

- `server/models/User.js`

유저 스키마는 "회원 정보는 이런 모양으로 저장해야 한다"라고 정하는 설계도입니다.

```js
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,      // 이메일은 글자입니다.
      required: true,   // 반드시 있어야 합니다.
      unique: true,     // 같은 이메일은 두 번 가입할 수 없습니다.
    },
    name: {
      type: String,      // 이름도 글자입니다.
      required: true,   // 이름도 반드시 있어야 합니다.
    },
    password: {
      type: String,      // 비밀번호는 암호화된 글자로 저장됩니다.
      required: true,
    },
    'user-type': {
      type: String,
      enum: ['customer', 'admin'], // customer 또는 admin만 가능합니다.
      default: 'customer',
      required: true,
    },
    address: {
      type: String,      // 주소는 있어도 되고 없어도 됩니다.
    },
  },
  { timestamps: true }   // 만든 시간, 수정 시간이 자동으로 저장됩니다.
)
```

정리:

- 일반 회원은 `customer`
- 관리자는 `admin`
- 회원가입 시간이 자동으로 기록됩니다.

---

## 6-3. 유저 CRUD API 만들기

CRUD는 데이터의 기본 기능 4가지를 뜻합니다.

- Create: 만들기
- Read: 읽기
- Update: 수정하기
- Delete: 삭제하기

파일:

- `server/routes/users.js`
- `server/controllers/userController.js`

처음에는 라우터 파일 안에 기능을 모두 넣었지만, 나중에 controller로 분리했습니다.

이유:

라우터는 "주소 안내판" 역할만 하고, controller는 "실제 일하는 사람" 역할을 하게 만들기 위해서입니다.

예시:

```js
// routes/users.js
router.post('/', createUser)

// 뜻:
// POST /api/users 주소로 요청이 오면
// createUser 함수가 회원을 생성합니다.
```

---

## 6-4. 비밀번호 암호화

파일:

- `server/controllers/userController.js`

처음에는 비밀번호가 그대로 저장될 위험이 있었습니다.

그래서 `bcryptjs`를 사용해 비밀번호를 암호화했습니다.

```js
// 사용자가 입력한 비밀번호
const password = '1234'

// DB에는 이런 식의 복잡한 글자로 저장됩니다.
const hashed = '$2a$12$...'
```

왜 중요할까요?

만약 DB가 유출되어도, 실제 비밀번호가 바로 보이지 않게 하기 위해서입니다.

---

## 6-5. 회원가입 페이지 만들기

파일:

- `client/src/pages/Signup.jsx`
- `client/src/pages/Signup.css`
- `client/src/api/users.js`

작업 내용:

- 회원가입 화면을 만들었습니다.
- 이름, 이메일, 비밀번호, 주소 등을 입력하게 했습니다.
- 생년월일 입력란은 달력으로 선택할 수 있게 했습니다.
- 회원가입 성공 후 다시 폼을 보여주는 대신 "회원가입 완료" 메시지를 보여주게 했습니다.

흐름:

```txt
사용자가 회원가입 폼 입력
  ↓
가입 버튼 클릭
  ↓
client/src/api/users.js 에서 서버로 요청
  ↓
POST /api/users
  ↓
server/controllers/userController.js 에서 회원 저장
  ↓
성공하면 화면에 가입 완료 표시
```

---

## 6-6. nodemon 설정

파일:

- `server/package.json`
- `server/nodemon.json`

`nodemon`은 서버 개발을 편하게 해주는 도구입니다.

보통 서버 코드를 바꾸면 서버를 껐다 켜야 합니다.
하지만 `nodemon`을 쓰면 파일이 바뀔 때 자동으로 서버를 재시작합니다.

```json
{
  "scripts": {
    "dev": "nodemon"
  }
}
```

실행:

```bash
npm run dev
```

---

## 6-7. 로그인 API 만들기

파일:

- `server/controllers/authController.js`
- `server/routes/auth.js`
- `server/middleware/auth.js`
- `server/routes/index.js`

로그인은 이메일과 비밀번호로 합니다.

로그인 성공 시 서버는 JWT 토큰을 발급합니다.

JWT 토큰은 "이 사람은 로그인한 사람입니다"라는 임시 출입증 같은 것입니다.

```txt
사용자 로그인
  ↓
이메일과 비밀번호 서버로 전송
  ↓
서버가 DB에서 사용자 찾기
  ↓
비밀번호가 맞는지 bcrypt로 확인
  ↓
맞으면 JWT 토큰 발급
  ↓
브라우저 sessionStorage에 저장
```

로그인 API:

```txt
POST /api/auth/login
```

내 정보 조회 API:

```txt
GET /api/auth/me
Authorization: Bearer 토큰값
```

---

## 6-8. 로그인 페이지 만들기

파일:

- `client/src/pages/Login.jsx`
- `client/src/pages/Login.css`
- `client/src/api/auth.js`

작업 내용:

- 로그인 화면을 만들었습니다.
- 이메일과 비밀번호를 입력하면 서버에 로그인 요청을 보냅니다.
- 성공하면 토큰과 유저 정보를 `sessionStorage`에 저장합니다.
- 이미 로그인되어 있으면 로그인 페이지 대신 메인 페이지로 이동합니다.

예시:

```js
sessionStorage.setItem('token', token)
sessionStorage.setItem('authUser', JSON.stringify(user))
```

쉽게 말하면:

브라우저 안에 "이 사람은 로그인했다"라는 정보를 잠시 저장합니다.

---

## 6-9. 메인 페이지에서 로그인 상태 보여주기

파일:

- `client/src/pages/Home.jsx`
- `client/src/components/Navbar.jsx`

작업 내용:

- 메인 페이지 우측 상단에 로그인 여부를 표시했습니다.
- 로그인하지 않은 사람은 `로그인` 버튼을 봅니다.
- 로그인한 사람은 `OO님 환영합니다` 메시지를 봅니다.
- 관리자라면 `Admin` 버튼도 보입니다.
- 사용자 이름 버튼을 누르면 로그아웃 드롭다운이 나옵니다.

흐름:

```txt
메인 페이지 열림
  ↓
sessionStorage에서 token 확인
  ↓
GET /api/auth/me 요청
  ↓
서버가 토큰 검사
  ↓
사용자 정보 반환
  ↓
Navbar에 이름 표시
```

---

## 6-10. Navbar 컴포넌트 분리

파일:

- `client/src/components/Navbar.jsx`
- `client/src/components/Navbar.css`

처음에는 메인 페이지 안에 navbar 코드가 들어있었습니다.

하지만 로그인 페이지에서도 navbar를 써야 해서 따로 분리했습니다.

이유:

같은 코드를 여러 페이지에서 복사해서 쓰면 나중에 수정하기 어렵습니다.

그래서 `Navbar.jsx` 하나만 고치면 여러 페이지에 동시에 적용되도록 만들었습니다.

---

## 6-11. 관리자 페이지 만들기

파일:

- `client/src/pages/Admin.jsx`
- `client/src/pages/Admin.css`

관리자 페이지는 `admin` 권한이 있는 유저만 볼 수 있습니다.

기능:

- 관리자 권한 확인
- 통계 카드 표시
- 빠른 작업 버튼 표시
- 상품 관리, 주문 관리, 고객 관리 카드 표시
- 새 상품 등록 페이지로 이동

권한 확인 흐름:

```txt
/admin 접속
  ↓
토큰 확인
  ↓
GET /api/auth/me
  ↓
user-type이 admin인지 확인
  ↓
admin이면 페이지 표시
  ↓
아니면 메인 페이지로 이동
```

---

## 6-12. 상품 옵션 스키마 만들기

파일:

- `server/models/ProductOption.js`

상품 옵션 스키마는 상품 정보를 DB에 어떤 모양으로 저장할지 정합니다.

```js
const productOptionSchema = new mongoose.Schema({
  option_id: Number,          // 자동으로 증가하는 상품 옵션 번호
  product_name: String,       // 상품명
  option_name: String,        // 옵션 이름
  product_category: String,   // men, women, unisex
  sub_category: String,       // 상의, 하의, 악세사리
  price: Number,              // 가격
  additional_price: Number,   // 옵션 추가 금액
  stock_quantity: Number,     // 재고 수량
  sku: String,                // 상품 식별 코드, 중복 불가
  option_image_url: String,   // 상품 이미지 URL
})
```

중요한 점:

- `option_id`는 자동으로 1, 2, 3, 4처럼 증가합니다.
- `sku`는 입력하면 반드시 고유해야 합니다.
- 이미지는 Cloudinary URL로 저장됩니다.

---

## 6-13. 상품 CRUD API 만들기

파일:

- `server/routes/productOptions.js`
- `server/controllers/productOptionController.js`
- `server/routes/index.js`

상품 API 주소:

```txt
GET    /api/product-options        상품 목록 조회
GET    /api/product-options/:id    상품 1개 조회
POST   /api/product-options        상품 등록
PATCH  /api/product-options/:id    상품 수정
DELETE /api/product-options/:id    상품 삭제
```

라우터 예시:

```js
router.get('/', listProductOptions)
router.post('/', requireAuth, requireAdmin, createProductOption)
```

주석으로 설명하면:

```js
// GET 요청은 상품을 보는 기능입니다.
// 누구나 상품 목록을 볼 수 있습니다.
router.get('/', listProductOptions)

// POST 요청은 상품을 등록하는 기능입니다.
// 로그인했고 관리자 권한이 있어야 합니다.
router.post('/', requireAuth, requireAdmin, createProductOption)
```

---

## 6-14. 상품 등록 페이지 만들기

파일:

- `client/src/pages/ProductNew.jsx`
- `client/src/pages/ProductNew.css`
- `client/src/api/productOptions.js`

관리자 페이지에서 `새 상품 등록` 버튼을 누르면 상품 등록 페이지로 이동합니다.

입력할 수 있는 정보:

- 상품명
- 가격
- 상품 카테고리
- 하위탭: 상의, 하의, 악세사리
- 옵션 추가 금액
- 재고 수량
- SKU
- 대표 이미지 URL

흐름:

```txt
관리자가 상품 정보 입력
  ↓
상품 등록하기 버튼 클릭
  ↓
POST /api/product-options 요청
  ↓
서버가 관리자 권한 확인
  ↓
DB에 상품 저장
  ↓
성공 메시지 표시
```

---

## 6-15. Cloudinary 이미지 업로드 연결

파일:

- `client/src/pages/ProductNew.jsx`
- `client/.env`

처음에는 이미지 URL을 직접 입력해야 했습니다.

이후 Cloudinary 위젯을 연결해서 이미지를 직접 업로드할 수 있게 했습니다.

흐름:

```txt
이미지 업로드 버튼 클릭
  ↓
Cloudinary 위젯 열림
  ↓
이미지 선택
  ↓
Cloudinary에 업로드
  ↓
이미지 URL을 받아옴
  ↓
상품 이미지 미리보기에 바로 표시
  ↓
상품 등록 시 DB에 이미지 URL 저장
```

중요했던 문제:

`your-cloud-name`으로 요청이 가는 문제가 있었습니다.

원인:

에디터에는 값이 바뀐 것처럼 보였지만 실제 `.env` 파일이 저장되지 않아, Vite가 예전 placeholder 값을 읽고 있었습니다.

해결:

`client/.env` 파일을 실제 디스크에 아래처럼 저장했습니다.

```env
VITE_CLOUDINARY_CLOUD_NAME=dnophcfpi
VITE_CLOUDINARY_UPLOAD_PRESET=shoppingmall
```

---

## 6-16. 상품 관리 페이지 만들기

파일:

- `client/src/pages/ProductManage.jsx`
- `client/src/pages/ProductManage.css`
- `client/src/api/productOptions.js`
- `client/src/App.jsx`
- `client/src/pages/Admin.jsx`

관리자 페이지의 `상품 관리` 버튼을 누르면 상품 목록 페이지로 이동하게 했습니다.

주소:

```txt
/admin/products
```

기능:

- 서버에서 상품 목록 가져오기
- 상품명 검색
- 카테고리 필터
- 하위탭 필터
- 상품 이미지 표시
- 가격 표시
- 재고 표시
- 상품 삭제
- 새로고침
- 페이지네이션

상품 목록 조회 흐름:

```txt
/admin/products 접속
  ↓
관리자 권한 확인
  ↓
GET /api/product-options?page=1&limit=2
  ↓
서버가 상품 2개 반환
  ↓
화면 테이블에 상품 표시
```

삭제 흐름:

```txt
휴지통 버튼 클릭
  ↓
삭제 확인 창 표시
  ↓
DELETE /api/product-options/:id 요청
  ↓
서버가 관리자 권한 확인
  ↓
DB에서 상품 삭제
  ↓
목록 다시 불러오기
```

---

## 6-17. 상품 목록 페이지네이션

파일:

- `server/controllers/productOptionController.js`
- `client/src/pages/ProductManage.jsx`

전체 상품을 한 번에 다 보여주면 상품이 많을 때 화면이 느려질 수 있습니다.

그래서 상품 관리 페이지는 한 페이지에 2개씩 보여주도록 했습니다.

서버 응답 예시:

```json
{
  "items": ["상품 2개"],
  "page": 1,
  "limit": 2,
  "total": 4,
  "totalPages": 2,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

뜻:

- `items`: 이번 페이지에 보여줄 상품들
- `page`: 현재 페이지 번호
- `limit`: 한 페이지에 몇 개 보여줄지
- `total`: 전체 상품 개수
- `totalPages`: 전체 페이지 개수
- `hasNextPage`: 다음 페이지가 있는지
- `hasPrevPage`: 이전 페이지가 있는지

---

## 6-18. 메인 페이지에서 실제 상품 데이터 보여주기

파일:

- `client/src/pages/Home.jsx`
- `client/src/pages/Home.css`
- `client/src/api/productOptions.js`

처음 메인 페이지는 테스트용 상품 배열을 사용했습니다.

이제는 서버 API를 호출해서 DB에 등록된 실제 상품을 가져와 보여줍니다.

흐름:

```txt
메인 페이지 접속
  ↓
listAllProductOptionsRequest 호출
  ↓
GET /api/product-options?page=1&limit=100
  ↓
서버에서 상품 전체 가져오기
  ↓
상품 카드로 화면에 표시
```

상품 카드에 표시되는 정보:

- 상품 이미지
- 상품명
- 가격
- 카테고리
- 하위탭
- 찜 아이콘

성별 탭 필터:

```txt
MEN 클릭 → product_category가 men 또는 unisex인 상품 표시
WOMEN 클릭 → product_category가 women 또는 unisex인 상품 표시
```

---

## 6-19. 상품 디테일 페이지 만들기

파일:

- `client/src/pages/ProductDetail.jsx`
- `client/src/pages/ProductDetail.css`
- `client/src/api/productOptions.js`
- `client/src/App.jsx`

지금까지는 메인 페이지에서 상품을 보여주기만 했습니다. 이제 상품을 클릭하면 그 상품 하나만 자세히 볼 수 있는 페이지로 이동하게 만들었습니다.

흐름:

```txt
메인 페이지에서 상품 카드 클릭
  ↓
URL이 /products/:id 로 이동
  ↓
ProductDetail 컴포넌트가 마운트됨
  ↓
useParams 로 :id 값을 꺼냄
  ↓
getProductOptionRequest(id) 호출
  ↓
GET /api/product-options/:id
  ↓
서버에서 상품 1개 데이터를 JSON으로 응답
  ↓
화면에 큰 이미지, 이름, 가격, 사이즈 선택, 쇼핑백 담기 버튼 등 표시
```

상품 카드를 클릭 가능하게 만든 부분:

```jsx
// client/src/pages/Home.jsx 의 ProductCard
<Link to={`/products/${product.option_id}`} className="product-card">
  {/* 카드 내용 */}
</Link>
```

주석:

```jsx
// Link 컴포넌트는 a 태그처럼 보이지만 페이지를 새로고침하지 않습니다.
// 클릭하면 주소만 /products/123 처럼 바뀌고, 같은 React 앱 안에서 화면만 갈아끼웁니다.
```

상품 디테일 페이지에 들어간 요소:

- 좌측: 큰 상품 이미지 (없으면 "No Image" 플레이스홀더)
- 우측 상단: 카테고리/하위 카테고리 배지
- 우측 본문: 상품명, 부제목, 가격
- 사이즈 선택 버튼 (S, M, L, XL 등 옵션 선택)
- 매장 재고 확인 안내
- 쇼핑백 담기 버튼
- 케어 가이드, 소재 정보
- 펼쳤다 접을 수 있는 아코디언 (상품 정보, 배송/반품, 리뷰)
- 추천 상품 목록
- 뉴스레터 가입 영역

쉽게 말하면, 이 페이지 하나가 "상품 한 개의 모든 정보를 보여주는 카탈로그 페이지" 역할을 합니다.

---

## 6-20. 장바구니 스키마 만들기

파일:

- `server/models/Cart.js`

장바구니는 "유저가 사려고 담아둔 상품들의 임시 보관함"입니다. 그래서 다음 두 가지 정보가 필요합니다.

- 이 장바구니가 누구 것인지 (`user`)
- 그 안에 담긴 항목들이 무엇인지 (`items`)

각 항목(`cartItemSchema`)은 다음을 가집니다.

- `option_id`: 어떤 상품 옵션인지
- `quantity`: 몇 개 담았는지
- `size`: 어떤 사이즈인지
- `added_at`: 언제 담았는지

```js
// server/models/Cart.js
const cartItemSchema = new mongoose.Schema(
  {
    option_id: { type: Number, required: true }, // 상품 옵션의 고유 번호
    quantity: { type: Number, required: true, min: 1 }, // 1개 이상이어야 합니다.
    size: { type: String, required: true }, // S, M, L 같은 글자
    added_at: { type: Date, default: Date.now }, // 담은 시간 자동 기록
  },
  { _id: false } // 따로 _id 를 만들지 않습니다.
)

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // 한 유저는 장바구니 1개만 가집니다.
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
)
```

중요한 규칙:

같은 상품을 같은 사이즈로 두 번 담으면 "중복 항목"이 생깁니다. 이걸 막기 위해 저장 직전에 검사하는 `pre('save')` 훅을 달았습니다.

```js
cartSchema.pre('save', function (next) {
  const seen = new Set()
  for (const item of this.items) {
    const key = `${item.option_id}::${item.size}`
    if (seen.has(key)) {
      return next(new Error('같은 옵션과 사이즈는 중복으로 담을 수 없습니다.'))
    }
    seen.add(key)
  }
  next()
})
```

주석:

```js
// (option_id, size) 조합을 set에 저장하면서
// 이미 본 조합이 또 나오면 에러를 발생시킵니다.
// 이렇게 하면 "같은 검정 M 사이즈 티셔츠 2줄"이 아니라 "수량 2"로 합쳐지게 됩니다.
```

---

## 6-21. 장바구니 CRUD API 만들기

파일:

- `server/controllers/cartController.js`
- `server/routes/cart.js`
- `server/routes/index.js`

장바구니는 로그인한 사람에게만 의미가 있습니다. 그래서 모든 라우트에 `requireAuth` 미들웨어를 붙여서 토큰이 있어야만 동작합니다.

API 주소:

```txt
GET    /api/cart                       내 장바구니 가져오기 (없으면 만들어줌)
POST   /api/cart/items                 장바구니에 상품 담기
PATCH  /api/cart/items/:option_id      장바구니 항목 수정 (수량/사이즈)
DELETE /api/cart/items/:option_id      장바구니에서 항목 빼기
DELETE /api/cart                       장바구니 전체 비우기
```

핵심 로직 요약:

```txt
GET /api/cart
  ↓
유저의 장바구니가 없으면 빈 장바구니를 자동 생성
  ↓
각 항목의 option_id로 상품 정보를 조회 (이름, 가격, 이미지)
  ↓
총 수량, 총 금액을 계산해서 함께 응답
```

```txt
POST /api/cart/items
  ↓
이미 같은 (option_id, size) 항목이 있으면
  → 수량만 더해줌 (중복 항목 만들지 않음)
  ↓
없으면 새 항목으로 추가
```

도우미 함수 예시:

```js
// 같은 옵션 + 같은 사이즈 항목이 이미 있는지 찾기
function findItemIndex(items, option_id, size) {
  return items.findIndex(
    (it) => it.option_id === option_id && it.size === size
  )
}
```

`GET /api/cart`의 응답을 풍성하게 해주는 `enrichCart`:

```js
// cart 안의 option_id들로 상품 옵션을 한 번에 조회한 뒤
// 각 항목에 product_name, price, option_image_url을 붙여 줍니다.
// 동시에 총 수량, 총 금액도 계산합니다.
```

이렇게 하면 화면에서는 추가로 상품 정보를 따로 조회할 필요 없이, 장바구니 응답 한 번으로 화면을 다 그릴 수 있습니다.

라우터 등록:

```js
// server/routes/index.js
router.use('/cart', cartRouter)
```

주석:

```js
// 이제 /api/cart 로 시작하는 모든 요청은 cart 라우터가 책임집니다.
```

---

## 6-22. 클라이언트 장바구니 페이지와 상품 디테일 연동

파일:

- `client/src/api/cart.js`
- `client/src/pages/Cart.jsx`
- `client/src/pages/Cart.css`
- `client/src/pages/ProductDetail.jsx`
- `client/src/App.jsx`

API 호출 함수들을 `client/src/api/cart.js` 한 곳에 모아두었습니다.

```js
// 모든 함수는 sessionStorage에 있는 token을 받아서 Authorization 헤더에 담아 보냅니다.
export async function getMyCartRequest(token) { ... }
export async function addCartItemRequest(payload, token) { ... }
export async function updateCartItemRequest(option_id, body, token) { ... }
export async function removeCartItemRequest(option_id, size, token) { ... }
export async function clearCartRequest(token) { ... }
```

상품 디테일 페이지의 "쇼핑백 담기" 버튼:

```txt
사용자가 사이즈 선택
  ↓
"쇼핑백 담기" 클릭
  ↓
addCartItemRequest({ option_id, size, quantity: 1 }, token) 호출
  ↓
POST /api/cart/items
  ↓
서버가 같은 (option_id, size)가 있으면 수량을 +1, 없으면 새로 추가
  ↓
응답으로 업데이트된 cart를 받아 토스트 메시지 표시
```

장바구니 페이지(`/cart`)의 동작:

- 진입 시 `getMyCartRequest`로 내 장바구니를 가져옴
- 항목별로 수량을 +/- 할 수 있고, 즉시 `updateCartItemRequest` 호출
- 각 항목에 있는 삭제 버튼은 `removeCartItemRequest` 호출
- 우측 요약 패널에 총 수량, 상품 금액, 배송비, 결제 예상 금액 표시
- "전체 비우기" 버튼은 `clearCartRequest` 호출 (확인창 표시)
- 비어 있을 때는 "상품 둘러보기" 버튼으로 메인으로 돌아갈 수 있음
- 로딩 중에는 스켈레톤 카드, 에러는 다시 시도 버튼 표시

화면 라우트 등록:

```jsx
// client/src/App.jsx
<Route path="/products/:id" element={<ProductDetail />} />
<Route path="/cart" element={<Cart />} />
```

주석:

```jsx
// :id 부분은 동적 파라미터입니다.
// /products/1, /products/2 처럼 어떤 숫자든 같은 컴포넌트에서 처리합니다.
```

---

## 6-23. Navbar 장바구니 아이콘에 개수 표시 UI

파일:

- `client/src/api/cart.js`
- `client/src/components/Navbar.jsx`
- `client/src/components/Navbar.css`
- `client/src/pages/Cart.jsx`
- `client/src/pages/ProductDetail.jsx`

목표:

상단 우측 BAG 아이콘 위에 작은 빨간 배지를 띄워, 지금 장바구니에 몇 개가 들어 있는지 한눈에 보여주는 것입니다.

설계 아이디어:

장바구니는 여러 페이지(상품 디테일, 장바구니 페이지)에서 바뀝니다. 그래서 "장바구니가 바뀌었다"는 사실을 어디서든 알릴 수 있어야 합니다.

전역 상태(Redux 등) 없이도 풀 수 있도록, 브라우저의 `CustomEvent`를 사용했습니다.

1. 장바구니가 바뀐 페이지 → `notifyCartUpdated(cart)` 호출
2. `notifyCartUpdated`는 `window`에 `cart:updated` 이벤트를 발행
3. Navbar는 그 이벤트를 듣다가, 새 수량으로 배지를 갱신

```js
// client/src/api/cart.js
export const CART_UPDATED_EVENT = 'cart:updated'

export function notifyCartUpdated(cart) {
  if (typeof window === 'undefined') return
  const totalQuantity =
    cart && Number.isFinite(Number(cart.total_quantity))
      ? Number(cart.total_quantity)
      : null
  window.dispatchEvent(
    new CustomEvent(CART_UPDATED_EVENT, { detail: { totalQuantity } })
  )
}
```

주석:

```js
// window.dispatchEvent는 "방송"이라고 생각하면 됩니다.
// 누구든 이 방송에 귀를 기울이고 있으면, 같은 메시지를 받을 수 있습니다.
```

Navbar 안에 만든 작은 훅 `useCartCount(me)`:

```jsx
function useCartCount(me) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!me) {
      setCount(0)
      return
    }

    let cancelled = false

    async function fetchCount() {
      const token = sessionStorage.getItem('token')
      if (!token) return
      const { ok, data } = await getMyCartRequest(token)
      if (!ok || cancelled) return
      const total = Number(data?.cart?.total_quantity)
      setCount(Number.isFinite(total) ? total : 0)
    }

    fetchCount()

    function onCartUpdated(e) {
      const next = e?.detail?.totalQuantity
      if (Number.isFinite(next)) setCount(next)
      else fetchCount()
    }

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated)
    return () => {
      cancelled = true
      window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated)
    }
  }, [me])

  return count
}
```

주석:

```jsx
// 1. 로그인 상태(me)가 바뀔 때마다 effect가 다시 실행됩니다.
// 2. 처음 한 번은 서버에서 직접 cart를 가져와 카운트를 채웁니다.
// 3. 그 후로는 cart:updated 이벤트가 올 때마다,
//    이벤트에 담긴 totalQuantity로 바로 갱신합니다.
// 4. 만약 이벤트에 숫자가 없으면 안전하게 다시 fetch 합니다.
```

배지 UI:

```jsx
{hasBadge ? (
  <span className="home__icon-badge" aria-hidden>
    {badge > 99 ? '99+' : badge}
  </span>
) : null}
```

```css
.home__icon-badge {
  position: absolute;
  top: -0.45rem;
  right: -0.55rem;
  min-width: 1.05rem;
  height: 1.05rem;
  border-radius: 999px;
  background: #b00020;
  color: #fff;
  box-shadow: 0 0 0 2px #fff; /* 아이콘과 자연스럽게 분리 */
}
```

연결 지점:

- `ProductDetail.jsx`에서 담기 성공 시 `notifyCartUpdated(d.cart)`
- `Cart.jsx`에서 모든 cart 변경 지점을 `applyCart`로 통일해 자동으로 이벤트 발행

쉽게 말하면, 이제 어디서 무엇을 담아도 화면을 새로고침하지 않고 우측 상단 BAG 아이콘의 숫자가 즉시 바뀝니다.

---

## 7. 중요한 API 정리

### 회원 API

```txt
POST   /api/users       회원가입
GET    /api/users       유저 목록 조회
GET    /api/users/:id   유저 1명 조회
PATCH  /api/users/:id   유저 수정
DELETE /api/users/:id   유저 삭제
```

### 로그인 API

```txt
POST /api/auth/login    로그인
GET  /api/auth/me       토큰으로 내 정보 조회
```

### 상품 API

```txt
GET    /api/product-options        상품 목록 조회
GET    /api/product-options/:id    상품 1개 조회
POST   /api/product-options        상품 등록, 관리자만 가능
PATCH  /api/product-options/:id    상품 수정, 관리자만 가능
DELETE /api/product-options/:id    상품 삭제, 관리자만 가능
```

### 장바구니 API

```txt
GET    /api/cart                       내 장바구니 조회, 없으면 자동 생성
POST   /api/cart/items                 장바구니에 상품 담기
PATCH  /api/cart/items/:option_id      장바구니 항목 수정, 수량/사이즈
DELETE /api/cart/items/:option_id      장바구니에서 항목 삭제
DELETE /api/cart                       장바구니 전체 비우기
```

장바구니 API는 모두 로그인 토큰이 있어야 사용할 수 있습니다.

---

## 8. 화면 주소 정리

```txt
/                         메인 페이지
/signup                   회원가입 페이지
/login                    로그인 페이지
/admin                    관리자 대시보드
/admin/products           상품 관리 페이지
/admin/products/new       새 상품 등록 페이지
/products/:id             상품 디테일 페이지
/cart                     장바구니 페이지, 로그인 필요
```

---

## 9. 서버와 화면이 연결되는 방식

예를 들어 상품 목록을 가져올 때:

```txt
Home.jsx 또는 ProductManage.jsx
  ↓
client/src/api/productOptions.js
  ↓
fetch('/api/product-options')
  ↓
Vite proxy가 localhost:4000으로 전달
  ↓
server/routes/index.js
  ↓
server/routes/productOptions.js
  ↓
server/controllers/productOptionController.js
  ↓
MongoDB에서 상품 조회
  ↓
JSON으로 화면에 응답
```

조금 더 쉽게 말하면:

```txt
화면: 상품 주세요!
서버: DB에서 찾아볼게요.
DB: 여기 상품 데이터 있어요.
서버: 화면아, 이 데이터를 JSON으로 줄게.
화면: 받은 데이터로 상품 카드를 그릴게.
```

---

## 10. 로그인 토큰 흐름

```txt
로그인 성공
  ↓
서버가 JWT 토큰 발급
  ↓
브라우저 sessionStorage에 저장
  ↓
관리자 페이지나 상품 등록 페이지 접속
  ↓
토큰을 Authorization 헤더에 담아 서버로 보냄
  ↓
서버가 토큰 확인
  ↓
admin 권한이면 통과
```

코드 느낌:

```js
headers: {
  Authorization: `Bearer ${token}`,
}
```

주석:

```js
// Authorization은 "내가 로그인한 사람인지 확인해 주세요"라는 표식입니다.
// Bearer 뒤에는 서버에서 받은 토큰을 붙입니다.
```

---

## 11. 관리자 권한 확인

파일:

- `server/middleware/auth.js`

관리자만 할 수 있는 일:

- 상품 등록
- 상품 수정
- 상품 삭제
- 관리자 대시보드 접근

쉽게 설명하면:

```txt
로그인한 사람인가?
  ↓
아니면 거절
  ↓
로그인한 사람이라면 admin인가?
  ↓
admin이면 허용
  ↓
customer면 거절
```

---

## 12. 내가 배운 핵심 개념

### 컴포넌트

화면을 작은 조각으로 나누는 것입니다.

예:

- `Navbar`
- `Home`
- `Login`
- `Signup`
- `Admin`
- `ProductNew`
- `ProductManage`

### API

화면과 서버가 대화하는 통로입니다.

예:

```txt
GET /api/product-options
```

뜻:

"서버야, 상품 목록을 보내줘."

### DB 모델

데이터가 어떤 모양으로 저장되는지 정하는 설계도입니다.

예:

- `User`
- `ProductOption`

### Controller

실제 일을 처리하는 함수입니다.

예:

- 회원 만들기
- 로그인하기
- 상품 등록하기
- 상품 조회하기

### Router

주소와 controller를 연결하는 길 안내판입니다.

예:

```js
router.get('/', listProductOptions)
```

뜻:

`GET /api/product-options` 요청이 오면 `listProductOptions`를 실행합니다.

---

## 13. 앞으로 추가하면 좋은 기능

아직 더 발전시킬 수 있는 기능들입니다.

- 상품 수정 페이지
- 주문 기능과 결제 연동
- 회원 정보 수정 페이지
- 관리자 주문 관리
- 상품 검색 기능 강화 (자동완성, 정렬)
- 이미지 여러 장 업로드와 슬라이드 뷰
- 위시리스트(찜) 기능
- 실제 배포 (Vercel, Render 등)

이미 완성된 항목 (오늘 작업으로 체크):

- ✅ 상품 상세 페이지 (`/products/:id`)
- ✅ 장바구니 기능 (스키마, API, 화면, Navbar 카운트 배지)

---

## 14. 내가 요청했던 내용 원문

아래는 이 프로젝트를 만들면서 실제로 요청했던 내용을 가능한 한 원문 그대로 정리한 기록입니다.

처음에는 작은 오류 해결로 시작했지만, 점점 회원가입, 로그인, 관리자 페이지, 상품 등록, 상품 조회까지 이어졌습니다.

1. `Error: Npm task detection: failed to parse the file d:\Cursor\vibe-coding\Shopping mall\server\package.json 이 에러가 발생했는데 해결해줘`
2. `서버에서 유저 스키마를 만들고 싶다. 디테일 정보는 다음과 같다. email 필수 name 필수 password 필수 user-type 필수, customer (customer, admin) address 필수아님 이런 스키마를 timestamp기능과 함께 만들어줘`
3. `@server/models/User.js 이 스키마를 참고해서 유저 데이터를 CRUD 하는 라우터를 만들어줘`
4. `@server/routes/users.js 여기에서 기능들은 controller로 따로 빼줘`
5. `@client/src/App.jsx 내가 첨부한 이미지와 같이 회원가입 페이지를 만들어줘. 메인 페이지에서 회원가입 버튼을 누르면 회원가입 페이지로 넘어가게 해줘. 회원가입 페이지에서의 폼은 @server/controllers/userController.js 여기 컨트롤러를 참고해서 폼을 만들어줘`
6. `회원가입 페이지에서 생년월일 입력란에 달력 모양을 클릭했는데 아무것도 안뜬다. 달력모양 누르면 생년월일 날짜를 선택할 수 있는 달력이 뜨도록 수정해줘`
7. `@server/controllers/userController.js 유저 정보를 생성할 때 password는 암호화 해서 저장해줘`
8. `지금은 회원가입하면 다시 회원가입 화면이 뜨는데 회원가입 완로하면 회원가입 완료라고 보여주게 변경해줘.`
9. `nodemon을 서버에 설치해줘`
10. `앞으로 nodemon을 이용해서 서버를 재생할 수 있게 코드를 수정해줘`
11. `로그인 기능을 만들고 싶은데 로그인을 만들기위해 어떤 기능들이 개발이 되엉야 하는지 알려줘`
12. `@server/controllers/userController.js @server/routes/index.js @server/routes/users.js 이 파일들을 참고해서 로그인 라우터를 만들어줘, 유저는 이메일과 비밀번호를 이용해서 로그인을 할 예정이다. 그리고 로그인 성공 실패시 적절한 처리도 해줘.`
13. `토큰발행 기능도 추가 해준거야?`
14. `@client/src/App.jsx 첨부한 이미지를 참고해서 로그인 페이지를 디자인 해줘.`
15. `@client/src/pages/Login.jsx 여기에 로그인 기능 연동을 해줘@server/controllers/userController.js @server/routes/index.js @server/routes/users.js 이 서버코드를 참고해서 만들어줘`
16. `[auth] JWT_SECRET is not set in environment 이렇게 터미널에 뜨고 웹페이지에서 로그인하려고 하니까 로그인이 안되`
17. `Request URL http://localhost:5173/api/auth/login Request Method POST Status Code 401 Unauthorized Remote Address [::1]:5173 Referrer Policy strict-origin-when-cross-origin network에 위와 같이 에러가 발생하면서 로그인이 안되`
18. `로그인 되는거 같은데 로그인 하고 나서 로그인이 되었는지 안되었는지 확인이 안되. @server 토큰으로 유저정보를 가져올수 있는 라우터를 만들어줘`
19. `@client/src/pages/Home.jsx 메인페이지에서 토큰이 있으면 토큰을 가지고 유저정보를 가져와서 우측 상단에 name님 반갑습니다. 메세지를 보여줘`
20. `@client/src/pages/Login.jsx 이미 토큰값을 통해 유저정보를 가져올수 있으면 로그인페이지가 아닌 메인 페이지로 가게 해줘`
21. `"name님 반갑습니다"를 버튼으로 만들고 버튼을 누르면 로그아웃이라는 드랍다운 메뉴가 나오게 해줘, 로그아웃 버튼을 누르면 로그아웃이 되게 해줘.`
22. `@client/src/pages/Home.jsx 이 이미지 참조해서 메인 페이지 디자인 해줘. 단 navbar에서 로그인한 유저가 없다면 로그인 버튼을 보여주고 로그인한 유저가 있다면 로그인 버튼 대신에 유저이름과 함께 00님 환영합니다 라는 메세지를 보여줘. 어드민 버튼의 경우 이미 로그인한 유저가 어드민 권한을 가지고 있으면 보여주고 아니면 숨겨줘`
23. `@client/src/pages/Home.jsx 이 페이지 컴포넌트를 최적화 할 수 있을까?`
24. `@client/src/pages/Home.jsxnavbar는 다른 컴포넌트로 분리 해줘`
25. `https://github.com/whaleonbush/shoppingmall-project.git 이 레포에 지금까지 작업한거 업로드 해줘`
26. `@client/src/pages/Home.jsx 로그인 페이지에서도 상단에 navbar를 보여줘`
27. `@client/src/pages/Admin.jsx 어드민 페이지를 첨부한 사진과 같이 만들어줘. 사진은 한번에 캡쳐를 못해서 두번에 나눠서 캡처하고 업로드 했어.`
28. `@server 상품등록하기 기능을 만들 예쩡이다. 상품에는 컬럼명,타입,제약조건,설명 option_id,INT (PK),AUTO_INCREMENT,옵션 고유 ID product_id,INT (FK),NOT NULL,상품 ID option_name,VARCHAR(100),NOT NULL,옵션 조합명 (ex: Black / L) additional_price,INT,DEFAULT 0,옵션 추가 금액 stock_quantity,INT,DEFAULT 0,옵션별 현재 재고량 sku,VARCHAR(50),"UNIQUE, NULL",상품 식별 코드 (Stock Keeping Unit) option_image_url,VARCHAR(500),NULL,옵션 대표 이미지 경로 (S3 URL 등) 위 스키마 정보가 들어가야 한다. sku값은 항상 유니크 해야한다. 이런 상품 스키마를 만들어줘`
29. `상품을 생성 수정 삭제 읽어오는 crud 라우터를 만들어줘`
30. `@client/src/pages/Admin.jsx 여기에서 새상품 등록하기 버튼을 누르면 상품 등록 페이질로 넘어가게 해줘. 상품 등록 페이지는 이미지와 같이 디자인을 만들어줘.`
31. `상품케테고리를 선택할 수 있게 해주고. 하위탭에 "상의, 하의, 악세사리" 선택할 수 있게 해줘`
32. `상품ID를 상품명으로, 옵션 조합명을 가격 탭으로 변경해줘`
33. `@client/src/pages/ProductNew.jsx 이미지 추가를 cloudinary 위젯을 이용해서 업데이트 하고 싶어, 그리고 이미지를 업데이트 하면 미리보기도 보일 수 있게 해줘.`
34. `cloudinary 위젯을 사용하기 위해 필요한 환경변수 값이 뭐가 있는지 알려주고 그 값을 사용해서 위젯을 사용하게 코드를 수정해줘`
35. `이미지 url을 입력하면 사진은 뜨는데 cloud_name is disabled이라고 왼쪽 상단에 뜨는데 이거 정상이야?`
36. `unsigned로 변경했는데 여전히 동일한 에러가 발생하는데. Request URL https://api.cloudinary.com/v1_1/your-cloud-name/image/upload Request Method POST Status Code 401 Unauthorized Remote Address 13.222.82.181:443 Referrer Policy strict-origin-when-cross-origin network에는 위와 같이 떠`
37. `시키는데로 했는데 여전히 your-cloud-name으로 나와`
38. `@client/src/pages/ProductNew.jsx 상품 등록 버튼을 누르면 @server/routes/index.js @server/routes/productOptions.js 이 코드를 참고하여 상품등록 Api를 만들어줘`
39. `이 페이지에서 상품관리 버튼을 클릭하면 볼수 있느 상품 조회 페이지를 만들어줘. 첨부한 이미지를 참고하되 더 잘 만들어도 좋아.`
40. `@server/routes/index.js @server/routes/productOptions.js @client/src/pages/ProductManage.jsx api 호출을 통해 서버에서 데이터를 가져와 상품 정보를 보여줘`
41. `@server/routes/productOptions.js 전체 상품 조회시 데이터를 2개씩 보여주는 페이지네이션을 만들어줘.`
42. `@client/src/pages/Home.jsx 메인페이지에서 API 호출을 통해 상품 데이터 전체를 가져올 수 있게 해줘@server/routes/index.js @server/routes/productOptions.js`
43. `지금까지 작업한 내용 중학생이 이해할수 있는 수준으로 주석 달아서 설명해주고 이걸 REAME.MD 파일로 만들어줘. 지금 강의 들으면서 웹페이지 만들고 있는 중이라. 내가 작업요청한 코딩 하나하나 기록해서 보고 싶어.`
44. `내가 너한테 요청한 내용 원문도 같이 포함 시켜줘.`
45. `지금까지 새로 추가로 작업한 내용과 README.MD 파일 GITHUB에 업데이트 해줘`
46. `@client/src/pages/Home.jsx 여기서 상품카드를 클릭하면 상품디테일 페이지로 넘어가게 만들어줘, 상품 디테일 페이지 디자인은 이미지와 같이 만들어줘`
47. `@server/models 여기에 장바구니 스키마를 만들어줘`
48. `@server/routes 여기에서 장바구니 crud 라우터를 짜줘`
49. `좋아 이어서 만들어줘`
50. `navbar의 장바구니 아이콘에 현재 장바구니에 몇개의 아이템이 들어가 있는지 표시하는 ui를 만들어줘`
51. `오늘 한거 @README.MD 여기에 작업한 내용이랑 그에 대한 설명 주석 같이 추가해줘`

---

## 15. 전체 작업 순서 요약

1. `package.json` 오류 해결
2. 유저 스키마 생성
3. 유저 CRUD API 생성
4. 유저 controller 분리
5. 회원가입 페이지 생성
6. 생년월일 달력 기능 수정
7. 비밀번호 암호화
8. 회원가입 완료 화면 추가
9. `nodemon` 설치 및 설정
10. 로그인 기능 설계
11. 로그인 API 생성
12. JWT 토큰 발급
13. 로그인 페이지 생성
14. 로그인 페이지와 서버 연동
15. `JWT_SECRET` 환경 변수 문제 해결
16. 예전 평문 비밀번호 로그인 문제 해결
17. 토큰으로 내 정보 조회 API 생성
18. 메인 페이지에 사용자 이름 표시
19. 로그인 상태면 로그인 페이지에서 메인으로 이동
20. 사용자 이름 버튼과 로그아웃 드롭다운 생성
21. 메인 페이지 디자인 변경
22. `Home.jsx` 최적화
23. `Navbar` 컴포넌트 분리
24. GitHub 저장소에 업로드
25. 로그인 페이지에도 navbar 표시
26. 관리자 대시보드 생성
27. 상품 옵션 스키마 생성
28. 상품 CRUD API 생성
29. 상품 등록 페이지 생성
30. 상품 카테고리와 하위탭 추가
31. 상품명과 가격 필드로 변경
32. Cloudinary 이미지 업로드 위젯 연결
33. Cloudinary 환경 변수 문제 해결
34. 상품 등록 API에 관리자 권한 연결
35. 상품 관리 페이지 생성
36. 상품 목록을 서버에서 조회
37. 상품 목록 페이지네이션을 2개씩 표시
38. 메인 페이지에서 실제 상품 데이터 조회
39. 상품 디테일 페이지 생성, 상품 카드 클릭 시 이동
40. 장바구니 스키마 생성 (`Cart`, `cartItemSchema`)
41. 장바구니 중복 옵션 방지 `pre('save')` 훅 추가
42. 장바구니 CRUD API 생성, 모두 로그인 필요
43. `enrichCart`로 상품 정보 + 총액 계산까지 한 번에 응답
44. 클라이언트 `api/cart.js` 작성, 토큰 자동 첨부
45. 장바구니 페이지 생성, 수량 변경/삭제/전체 비우기 지원
46. 상품 디테일의 "쇼핑백 담기" 버튼을 장바구니 API와 연결
47. Navbar BAG 아이콘에 카운트 배지 UI 추가
48. `cart:updated` 커스텀 이벤트로 카운트 실시간 동기화

---

## 16. 마지막 정리

이 프로젝트는 단순한 화면 만들기에서 시작해서, 점점 실제 쇼핑몰처럼 동작하도록 발전했습니다.

처음에는 정적인 화면이었지만, 이제는:

- 회원가입 가능
- 로그인 가능
- 토큰으로 로그인 유지 가능
- 관리자 권한 확인 가능
- 상품 등록 가능
- 이미지 업로드 가능
- 상품 목록 조회 가능 (페이지네이션 포함)
- 메인 페이지에서 실제 상품 표시 가능
- 상품 카드 클릭 시 디테일 페이지로 이동 가능
- 사이즈를 골라 장바구니에 담기 가능
- 장바구니 페이지에서 수량 변경, 항목 삭제, 전체 비우기 가능
- Navbar BAG 아이콘에서 장바구니 개수 실시간 확인 가능

까지 구현되었습니다.

즉, 지금 프로젝트는 **React 화면 + Express API + MongoDB 데이터베이스가 서로 연결된, "회원 → 상품 탐색 → 장바구니"까지 한 흐름이 완성된 쇼핑몰 프로젝트**입니다.

다음 단계로 주문/결제까지 이어진다면 실제 사용자가 구매할 수 있는 쇼핑몰에 한 발 더 가까워집니다.
