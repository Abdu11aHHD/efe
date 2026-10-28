# Setup

Works on Windows, macOS and Linux. Requirements: **Python 3.11+** and **Node 20+**.

## 1 — Backend (demo mode, no accounts needed)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: . .venv/bin/activate
pip install -r requirements-dev.txt
copy .env.example .env          # macOS/Linux: cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Check it: <http://127.0.0.1:8000/api/v1/health> and <http://127.0.0.1:8000/docs>.

With an empty `.env` the server starts in demo mode: one synthetic patient, one synthetic
reviewer, data held in memory only. `GET /api/v1/config` returns `demo_mode: true` plus
Arabic notes explaining exactly what is not configured.

## 2 — Website

```powershell
cd web
npm install
copy .env.example .env          # optional in development
npm run dev
```

Open <http://127.0.0.1:5173>. The Vite dev server proxies `/api` to
`http://127.0.0.1:8000`, so no CORS configuration is needed locally. To point at a
different backend set `VITE_API_BASE_URL=https://api.example.com` and rebuild — the client
then calls `<VITE_API_BASE_URL>/api/v1/...` directly, so add that origin to the backend's
`CORS_ORIGINS`.

## 3 — Supabase (live mode)

```bash
supabase link --project-ref <your-ref>
supabase db push
```

Then fill `backend/.env`:

```env
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server only, never in web/
DEMO_MODE=false
ENVIRONMENT=live
```

Restart the backend. `GET /api/v1/config` should now report
`supabase_configured: true, demo_mode: false`.

### Creating accounts

Sign users up through Supabase Auth. The `on_auth_user_created` trigger creates a
`profiles` row with role `patient`. Promote a reviewer manually:

```sql
update public.profiles set role = 'reviewer' where id = '<auth-user-uuid>';
```

Roles are **never** changeable from the client: `profiles` grants `update` on
`target_profile` only.

### Adding a display name and health number for the ملفي card

```sql
insert into public.patient_identities (user_id, display_name, health_record_number)
values ('<auth-user-uuid>', 'اسم تجريبي', 'SP-0000-0000-DEMO')
on conflict (user_id) do update
  set display_name = excluded.display_name,
      health_record_number = excluded.health_record_number;
```

Use **fictional** values. Do not paste a real national or health identifier into a
prototype.

### Signing in from the website in live mode

The sign-in screen accepts a Supabase access token. Obtain one with the Supabase JS client
or the auth REST endpoint and paste it in, or wire your organisation's own sign-in flow to
call `signIn(token)` in `web/src/lib/session.tsx`. The token is stored in `localStorage`
under `sukkar.token` and sent as `Authorization: Bearer …`.

## 4 — Gemini (optional)

```env
GEMINI_API_KEY=<key>
GEMINI_MODEL=gemini-2.5-flash
```

Server-side only. With the key set, Gemini does two bounded jobs:

1. **cross-checking** the printed fields the deterministic parser already read, and
2. **writing the Arabic summary** of values the backend has already verified.

Both are validated: the extraction response must satisfy a Pydantic schema and every value
must be plausible for its metric, and the summary passes a grounding guard that rejects any
number not traceable to a verified value plus any dosing, diagnosis or alarm language.
Without the key — or on timeout, transport error or failed validation — the backend falls
back to deterministic Python and says so in `ai_summary.fallback_reason_ar`.

## 5 — Tests

```bash
cd backend && python -m pytest          # 82 passed
cd web && npm run test                  # 29 passed
cd web && npm run lint                  # tsc --noEmit
cd web && npm run build                 # production bundle
```

## 6 — Production notes

* Serve the backend with `uvicorn app.main:app --host 0.0.0.0 --port 8000` behind a
  reverse proxy that terminates TLS.
* Build the website with `npm run build` and serve `web/dist` as static files; configure a
  SPA fallback so client-side routes resolve (`try_files $uri /index.html;`).
* Set `CORS_ORIGINS` to the exact website origin.
* Keep `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` in the server's secret store. They
  must never appear in a browser bundle, a log line or a client-side environment variable.
* The upload pipeline runs in a FastAPI `BackgroundTask`, so a single worker processes a
  report after responding `202`. Behind multiple workers, make sure the client polls
  `/reports/{id}/status` (the website already does) rather than assuming the same worker.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Website shows "تعذّر الوصول إلى الخادم" | Backend not running or wrong port | Start uvicorn on 8000, or set `VITE_PROXY_TARGET` |
| Upload returns 422 `no_text` | Scanned (image) PDF | Export a text PDF from the sensor app; OCR is out of scope |
| Upload returns 422 with "لم نتعرف على أي مؤشر سكر" | Not a CGM summary page | Upload the summary page of a sensor or pump report |
| `demo_mode` stays `true` after configuring Supabase | `DEMO_MODE=true` still set, or a key is missing | Set `DEMO_MODE=false` and fill all three Supabase values |
| Reviewer dashboard returns 403 | The signed-in profile is a patient | `update public.profiles set role = 'reviewer' …` |
| Arabic text renders in a fallback font | Google Fonts blocked | Self-host Noto Sans Arabic and update the `<link>` in `web/index.html` |
