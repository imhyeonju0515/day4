---
name: jeju-ip-site
description: Build, extend, deploy or debug the Jeju IP gallery in jeju-ip/ — Vite + React + Supabase auth (signup/login/favorites) + Pixabay photo proxy + Three.js tangerine hero, deployed on Vercel. Use when asked to add features, change the Jeju/citrus UI, fix Supabase or Vercel env/login problems, or redeploy.
---

# 제주 IP 갤러리 (`jeju-ip/`)

Vite + React 18 SPA. 제주 이야기 자산(한라산·돌하르방·해녀·감귤·유채꽃·조랑말) 사진 갤러리. 이메일 회원가입/로그인(Supabase), 로그인하면 사진 ❤️ 즐겨찾기. GitHub repo `imhyeonju0515/day4` 의 `jeju-ip/` 폴더, Vercel 배포 `https://day4-8djs.vercel.app`.

## 구조
- `src/App.jsx` 헤더·3D 히어로·검색창·푸터, 세션(`onAuthStateChange`) 관리
- `src/Auth.jsx` 로그인/가입 모달 (오류를 쉬운 한국어로 변환, 제주풍 헤더)
- `src/Gallery.jsx` 카테고리 칩 · 검색어 칩 · 20장씩 "더 보기" · 크게 보기(라이트박스) · 즐겨찾기 탭 · 스켈레톤
- `src/Hero3D.jsx` Three.js (r160): 일렁이는 바다 + 한라산/오름 + 둥둥 뜬 감귤. `lazy` 로 분리 로드, 화면 밖이면 멈춤, `prefers-reduced-motion` 이면 정지 화면, 좁은 화면은 감귤 수·위치 조정
- `src/jejuData.js` 카테고리와 Pixabay 검색어
- `src/supabase.js` 환경변수 없으면 `supabaseReady=false` → 로그인 UI 숨기고 안내 문구
- `api/pixabay.js` Vercel 서버리스 프록시(키 숨김). `q`, `per_page`(3~40), `page`(1~25), 한글이면 `lang=ko`, 24시간 캐시 헤더. Node 스타일 `res.statusCode/end` 라서 Vercel·로컬 모두 동작
- `vite.config.js` 로컬 `npm run dev` 에서 `/api/pixabay` 를 같은 핸들러로 처리하는 플러그인
- `supabase/schema.sql` `favorites` 테이블 + RLS (본인 행만 select/insert/delete, `user_id default auth.uid()`)
- 스타일: `src/styles.css` (귤색 `#ff8a1f`, 바다색 `#169c8e`, 크림 배경, 제목 글꼴 Jua)

## 환경변수 (Vercel + 로컬 `.env`)
| 이름 | 값 | Vercel 저장 방식 |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` (**경로 없이 도메인만**) | config |
| `VITE_SUPABASE_ANON_KEY` | anon 또는 `sb_publishable_…` | config |
| `PIXABAY_API_KEY` | pixabay.com/api/docs | secret (`VITE_` 금지) |

`service_role`/`secret` 키는 절대 사용·커밋 금지. `.env` 는 `.gitignore` 됨. 환경변수는 저장 **후** 재배포해야 적용.

## 설정 순서 (처음 한 번)
1. Supabase SQL Editor 에 `supabase/schema.sql` 실행 (테이블명 `favorites`)
2. Vercel: repo `day4` import, **Root Directory = `jeju-ip`**, 환경변수 3개 등록, Deploy
3. Supabase → Authentication → URL Configuration: **Site URL** = Vercel 주소(끝 `/` 없음), Redirect URLs 에 `https://<주소>/**` (로컬용 `http://localhost:5173/**` 선택)
4. 테스트 중엔 Authentication → Sign In / Providers → Email → **Confirm email 끄기** (공개 전엔 다시 켜고 커스텀 SMTP 연결)

## 겪었던 문제와 해결
- **"Invalid path specified in request URL"** → `VITE_SUPABASE_URL` 에 Data API 화면의 `…/rest/v1/` 까지 복사함. 도메인만 남기고 재배포.
- **Vercel "public framework prefix cannot use visibility: secret"** → `VITE_` 변수는 `config` 로 저장.
- **가입 시 "요청이 너무 많아요"** → Supabase 기본 SMTP 시간당 ~2–3통 한도. Confirm email 끄기, 1시간 대기, 또는 커스텀 SMTP.
- **확인 메일 링크가 localhost** → Site URL 이 기본값. 위 3번 설정. 이미 보낸 메일은 못 고치니 사용자 삭제 후 재가입.
- **배포 화면에 가입/즐겨찾기가 없음** → Vercel Root Directory 가 저장소 루트라 옛 `index.html` 이 배포됨. `jeju-ip` 로 변경 후 재배포(또는 별도 프로젝트).
- 로컬 `dev` 의 `/api/pixabay` 는 `PIXABAY_API_KEY` 가 `.env` 에 없으면 오류. `process.env.X ??= undefined` 는 문자열 "undefined" 가 되므로 값이 있을 때만 대입.

## 작업 방식 메모
- 코드 수정 후 `npm run build` 로 확인, 푸시하면 Vercel 이 `main` 자동 배포. 이 저장소에는 다른 미커밋 작업물(transformer.html 등)이 많으니 **`git add jeju-ip` 처럼 필요한 경로만** 스테이징.
- Pixabay 키 없이 UI 확인: 임시 `.env`(가짜 Supabase 값) 만들고 브라우저에서 `window.fetch` 를 덮어 가짜 hits(`{id,url,large,tags,user,page}`)를 돌려줌. 끝나면 `.env` 삭제.
- 사진 출처 표기(Pixabay)는 유지. 결과는 서버 캐시 가능, 이미지 원본은 Pixabay URL 직접 사용.
- 로컬 미리보기: `.claude/launch.json` 의 `jeju-ip` 설정(포트 5177).
- 셸 heredoc 에 한글/작은따옴표가 많은 긴 파일을 넣으면 파싱 오류가 나므로 파일 생성은 Write 도구를 쓸 것.
- 사용자는 한국어로 대화하고 쉬운 설명을 선호. 요청 전에는 커밋/푸시하지 않음(푸시 요청 시에만).
