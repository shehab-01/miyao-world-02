# MIYAO WORLD

Shopping mall web app — Next.js storefront, FastAPI backend, PostgreSQL.

| Service  | Local URL                    | Stack                                 |
| -------- | ---------------------------- | ------------------------------------- |
| frontend | http://localhost:3000        | Next.js 16 / React 19 / Tailwind      |
| backend  | http://localhost:8000/docs   | FastAPI / SQLAlchemy (async) / Alembic |
| db       | `localhost:5432`             | PostgreSQL 17 (user/pass `miyao`)     |

Ports can be changed in `.env` (copy `.env.example`).

## Local development

Only Docker Desktop is required.

```sh
docker compose up --build --watch      # start everything, live-reload code
docker compose exec backend python -m app.seed   # first run: demo catalog with photos (--reset to replace)
```

- Backend code is bind-mounted; uvicorn reloads on save.
- Frontend `src/` and `public/` are synced by `--watch`; editing `package.json` rebuilds the image.
- Migrations run automatically every time the backend starts.

## Database migrations

After changing a model in `backend/app/models/`:

```sh
docker compose exec backend alembic revision --autogenerate -m "describe the change"
# review the new file in backend/alembic/versions/, then:
docker compose exec backend alembic upgrade head
```

Other useful commands:

```sh
docker compose exec backend alembic downgrade -1   # undo the last migration
docker compose exec db psql -U miyao miyao_world   # SQL shell
docker compose down -v                             # stop and wipe the local database
```

> Git Bash on Windows rewrites `/app`-style paths; prefix commands with `MSYS_NO_PATHCONV=1` if you hit that.

## Login & social login

- The browser only talks to the frontend; Next.js proxies `/api/*` to the backend (`next.config.ts`), so the session cookie is first-party.
- ID/password members sign up at `/join`. Kakao/Naver members are sent to `/join/social` on their first login to confirm name/email/phone and agree to the terms; after that they're signed straight in.
- Sessions are an httpOnly signed cookie (14 days). Passwords are hashed with argon2.

### Social login setup

Put the keys in `.env` (see `.env.example`), then `docker compose up -d backend`. A provider with no keys shows "준비 중" on the login page.

Redirect URIs to register (add the production domain's version too when you deploy):

| Provider | Redirect / Callback URI |
| -------- | ----------------------- |
| Kakao    | `http://localhost:3000/api/auth/kakao/callback` |
| Naver    | `http://localhost:3000/api/auth/naver/callback` |

**Kakao** — https://developers.kakao.com
1. 내 애플리케이션 → 애플리케이션 추가.
2. [앱] > [플랫폼 키] > [REST API 키]: copy the key → `KAKAO_CLIENT_ID`; register the redirect URI; copy the client secret → `KAKAO_CLIENT_SECRET`.
3. [카카오 로그인]: turn 사용 설정 ON.
4. [동의항목]: nickname works out of the box. Email, name and phone need a 비즈 앱 (register the business number under 비즈니스 정보), then request 카카오계정(이메일), 이름, 전화번호 — name and phone go through Kakao's review.

**Naver** — https://developers.naver.com
1. Application → 애플리케이션 등록, 사용 API: 네이버 로그인.
2. 제공 정보: 회원이름, 연락처 이메일 주소, 휴대전화번호.
3. 서비스 환경 PC 웹: 서비스 URL `http://localhost:3000`, Callback URL as above.
4. Copy Client ID / Client Secret → `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET`.
5. While the app is 개발 중, only the admin and 테스트 ID added under 멤버관리 can log in. Submit 검수요청 before launch.

## Admin (`/admin`)

http://localhost:3000/admin — dashboard, orders (입금 확인, 배송 상태, 송장번호), products (images, sizes/colors, stock), categories, members, admin accounts.

- Admins are separate from shop members: own table, own login (email + password), own cookie (sent only to `/api/admin/*`, 12h).
- The first admin is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` on backend start, only if it doesn't exist yet. Passwords are stored as argon2 hashes.
- Add more admins and change your password at `/admin/admins`.
- 5 wrong passwords lock an admin account for 15 minutes.
- Locked out or forgot the password:
  ```sh
  docker compose exec backend python -m app.admin_bootstrap <email> <new-password>
  ```
- Uploaded images live in the `uploads` Docker volume and are served at `/uploads/*`.

## Production

```sh
cp .env.prod.example .env.prod   # fill in real values
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

The prod images run as non-root users, the frontend uses Next.js standalone output, `/docs` is disabled, and cookies are `Secure`.
Both services bind to `127.0.0.1` — put a reverse proxy with HTTPS (Caddy, Nginx, or your host's load balancer) in front of the frontend.
`PUBLIC_URL` must be the exact public origin: Kakao/Naver redirect URIs are built from it.
To use a managed Postgres such as Neon, set `DATABASE_URL` and `DB_NULL_POOL=true` and remove the `db` service.
