# 제주 IP 갤러리 (Vite + React + Supabase + Pixabay)

제주 이야기 자산(돌하르방·해녀·감귤·한라산…) 사진 갤러리. Supabase로 회원가입/로그인, 로그인하면 사진 즐겨찾기(❤️) 가능. Vercel에 배포.

## 환경변수 3개

| 이름 | 어디서 얻나 | 노출 |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | 브라우저 OK |
| `VITE_SUPABASE_ANON_KEY` | 같은 화면의 `anon` (또는 `publishable`) key. **`service_role` 키는 절대 쓰지 마세요** | 브라우저 OK |
| `PIXABAY_API_KEY` | https://pixabay.com/api/docs/ 로그인 후 "Your API key" | 서버 전용 (`VITE_` 붙이지 않기) |

## 설정 순서

1. **Supabase 테이블 만들기:** Supabase → SQL Editor → `supabase/schema.sql` 내용을 붙여 넣고 Run.
2. **(테스트 편의) 이메일 확인 끄기:** Authentication → Sign In / Providers → Email → *Confirm email* 끄기. 켜 두면 가입 후 메일의 링크를 눌러야 로그인돼요.
3. **로컬 실행:** `.env.example`을 `.env`로 복사해 값을 채우고
   ```bash
   npm install
   npm run dev
   ```
4. **Vercel 배포:** Vercel → Add New Project → GitHub 저장소 선택 → **Root Directory를 `jeju-ip`** 로 지정 → Environment Variables에 위 3개 등록 → Deploy.
5. **배포 주소 등록:** 배포 후 Supabase → Authentication → URL Configuration의 *Site URL* 을 Vercel 주소(`https://xxx.vercel.app`)로 설정. (메일 확인 링크가 이 주소로 돌아옵니다.)

## 구조

- `src/` React 앱 (`Auth.jsx` 로그인/가입, `Gallery.jsx` 갤러리+즐겨찾기)
- `api/pixabay.js` Pixabay API 키를 숨기는 서버리스 함수 (로컬에선 `vite.config.js`의 플러그인이 대신 처리)
- `supabase/schema.sql` 즐겨찾기 테이블 + RLS(내 데이터만 접근)
