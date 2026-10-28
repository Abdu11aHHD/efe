# Sukkar Plus — website

React 18 + TypeScript + Vite + Tailwind. An Arabic, RTL, mobile-app-style website.

```bash
npm install
cp .env.example .env     # optional in development
npm run dev              # http://127.0.0.1:5173, /api proxied to :8000
npm run test             # 29 vitest tests
npm run lint             # tsc --noEmit
npm run build            # production bundle in dist/
```

The backend must be running on `:8000`, or set `VITE_PROXY_TARGET` / `VITE_API_BASE_URL`.

## Layout

| Path | Contents |
|---|---|
| `src/lib/` | `api.ts` (typed client, bearer token, real upload progress), `session.tsx`, `useApi.ts`, `format.ts`, `types.ts` |
| `src/components/` | `AppShell` (canvas, header, bottom nav), `ui.tsx` (card, button, badge, notice, dialog, toast, skeleton, empty and error states), `ServiceTile`, `Icons` |
| `src/screens/` | الرئيسية · المواعيد · جودة الحياة · ملفي · التنبيهات · sign-in |
| `src/sukkar/` | The Sukkar Plus service: landing, upload, reports, report detail, appointment preparation, follow-ups, how-it-works |
| `src/reviewer/` | The wider desktop reviewer dashboard |
| `src/test/` | Vitest + Testing Library suite and fixtures |

## Shell rules

* One `.sp-canvas`: 440 px centred on desktop, full width on a phone, `100dvh`, no
  horizontal scrolling down to 320 px.
* Exactly four bottom destinations. Sukkar Plus is **not** one of them — it is reached
  from ملفي, and the ملفي tab stays active throughout the service.
* Every screen implements loading, error, empty and content states.
* No hardcoded clinical data anywhere: every number on screen came from the API.
