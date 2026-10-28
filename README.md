# سكر بلس — Sukkar Plus

**A diabetes-care service inside a Sehhaty-inspired Arabic healthcare web app.**
An Arabic, right-to-left **website** that feels like a mobile application, backed by a
**Python / FastAPI** service that reads printed CGM report PDFs, validates them
deterministically, produces an appointment-preparation summary, and runs a simulated
human-review workflow with a reviewer dashboard.

> Independent concept prototype. **Not** affiliated with Sehhaty, the Saudi Ministry of
> Health, Insulet, Dexcom or any provider. No diagnosis, no emergency triage, no dose or
> treatment advice. Review requests are simulated and never reach a real clinician.
> No appointment booked here is real.

---

## The product in one paragraph

You open the site and land in a dark, Arabic, Sehhaty-style healthcare app with four
bottom tabs — **الرئيسية · المواعيد · جودة الحياة · ملفي**. In **ملفي** you find your
patient card and a row of health-service tiles, and among them sits **سكر بلس** —
*رحلتك مع السكر، بطريقة أسهل*. Tapping it opens a warmer, friendlier diabetes companion
inside the same shell, where you upload a glucose report PDF, see every extracted value
next to the printed label and page it came from, read an Arabic summary with its data
limitations, prepare questions for your appointment, and — when a documented rule fires —
ask for a review. A reviewer with the right role sees the snapshot you approved, decides,
and on approval the backend creates a clearly-labelled **prototype** appointment and the
matching notifications.

---

## Repository layout

| Path | Contents | Status |
|------|----------|--------|
| `backend/` | **Python / FastAPI** service: PDF extraction, validation, rules, Gemini, workflow | **active** |
| `web/` | **React + TypeScript + Vite** patient website and reviewer dashboard | **active** |
| `supabase/migrations/` | SQL schema, RLS policies, workflow RPCs, storage | **active** |
| `docs/` | architecture, metrics, source mapping, setup, demo script, test report | **active** |
| `packages/sukkar_core/` | the original pure-Dart domain logic | superseded — see note below |
| `app/` | the original Flutter application | superseded — see note below |
| `supabase/functions/` | the original Deno edge functions | superseded — see note below |
| `make/` | Make.com scenario notes | **retired** — no external automation is used |

### Note on the superseded directories

The patient-facing product is now a **website**; the Flutter app is no longer the
deliverable. The clinical logic that lived in `packages/sukkar_core` (metric definitions,
GMI, consensus targets, the PDF parser, consistency checks, the rule engine, the follow-up
state machine, the visit summary) was **ported to Python**, not discarded — see
[docs/MIGRATION_FROM_FLUTTER.md](docs/MIGRATION_FROM_FLUTTER.md) for the file-by-file map.
Nothing in the running product reads from `app/`, `packages/`, `supabase/functions/` or
`make/`; they are kept only so the port can be reviewed against its source, and they can be
deleted at any time.

---

## Quick start

Two terminals. Everything below works with **no Supabase and no Gemini key**: the backend
starts in a clearly-labelled demo mode with synthetic data held in memory.

```bash
# 1 — backend  (Python 3.11+)
cd backend
python -m venv .venv && . .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
#   API docs: http://127.0.0.1:8000/docs

# 2 — website  (Node 20+)
cd web
npm install
cp .env.example .env            # optional; the dev proxy already points at :8000
npm run dev
#   website: http://127.0.0.1:5173
```

Open <http://127.0.0.1:5173>, choose **الدخول كمريض تجريبي**, and follow
[docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md). A ready synthetic report lives at
`backend/tests/fixtures/synthetic_discover_summary.pdf`.

---

## Environment variables

All secrets are **server-side only**. Nothing in `web/` ever receives a Gemini key or a
Supabase service-role key.

### `backend/.env`

| Variable | Required | Meaning |
|---|---|---|
| `SUPABASE_URL` | live mode | Supabase project URL |
| `SUPABASE_ANON_KEY` | live mode | Public anon key, used for per-request clients that carry the caller's JWT so RLS applies |
| `SUPABASE_SERVICE_ROLE_KEY` | live mode | **Server only.** Privileged writes: processing output, simulated appointments, notifications, reviewer queue |
| `SUPABASE_REPORTS_BUCKET` | no | Private storage bucket for report PDFs (default `reports`) |
| `GEMINI_API_KEY` | no | Without it, extraction stays deterministic and summaries use local Arabic templates |
| `GEMINI_MODEL` | no | Default `gemini-2.5-flash` |
| `GEMINI_TIMEOUT_SECONDS` | no | Default `45` |
| `ENVIRONMENT` | no | `demo` or `live`, written into responses |
| `DEMO_MODE` | no | `true` forces the in-memory synthetic store. Forced on automatically whenever Supabase is not configured |
| `CORS_ORIGINS` | no | Comma-separated list; default allows the Vite dev server |
| `MAX_UPLOAD_BYTES` | no | Default 15 MB |
| `STORE_REPORT_FILES` | no | Keep uploaded PDFs in private storage |
| `REPORT_RETENTION_DAYS` | no | Documented retention window (default 180) |

### `web/.env`

| Variable | Meaning |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the API. Leave empty in development to use the Vite proxy |
| `VITE_PROXY_TARGET` | Dev proxy target (default `http://127.0.0.1:8000`) |

---

## Database setup (live mode)

```bash
supabase link --project-ref <your-ref>
supabase db push          # applies all three migrations in order
```

| Migration | Adds |
|---|---|
| `20261028000001_schema.sql` | profiles, identities, consents, device reports, metrics, labs, appointments, follow-up requests, history, notes |
| `20261028000002_rls_and_rpc.sql` | RLS on every table, column grants, the follow-up state-machine RPCs, `delete_my_data()` |
| `20261028000003_sukkar_plus_api.sql` | `sukkar_reports`, `notifications`, appointment columns, the private `reports` storage bucket, extended `delete_my_data()` |

Then promote one account to reviewer:

```sql
update public.profiles set role = 'reviewer' where id = '<auth-user-uuid>';
```

Security model, in short:

* **Patients** read and write only their own rows. RLS keys every table on `auth.uid()`.
* **Reviewers** never read patient tables directly. They see the `shared_snapshot` the
  patient approved, plus the report's extracted values and analysis, and never `user_id`.
* The FastAPI layer checks the caller's role **before** it uses the service-role client,
  so frontend visibility is never the security boundary.
* Report PDFs live in a **private** bucket under `<user_id>/<report_id>.pdf`, reachable
  only through short-lived signed URLs.
* `delete_my_data()` removes every row a user owns.

---

## Testing

```bash
cd backend && python -m pytest        # 82 passed
cd web && npm run test                # 29 passed
cd web && npm run lint                # tsc --noEmit, clean
cd web && npm run build               # production bundle
```

Full results and what each suite proves: [docs/TEST_REPORT.md](docs/TEST_REPORT.md).

---

## Safety and honesty constraints encoded in the product

* The deterministic Python parser is the **only** source of a number. Gemini may
  cross-check a field or write prose, never introduce a value. Its output is validated
  with Pydantic and then passed through a grounding guard that rejects any digit not
  traceable to a verified value, plus any dosing, diagnosis or alarm language.
* Missing values are `null` with status `unavailable`, never `0`. A database CHECK
  constraint enforces it.
* A report is "ready" only after the backend pipeline has actually finished. Upload
  progress is real (XHR), and processing status is polled from the server.
* Four outcomes only: **ملخص روتيني للموعد**, **يحتاج إلى مراجعة مختص**,
  **بيانات غير مكتملة**, **يرجى طلب المساعدة الطبية المناسبة**. A flag is not a diagnosis.
* Urgent-concern guidance never waits for a reviewer.
* Every appointment carries `is_simulated = true` and an Arabic label saying so.
* No Make.com, n8n, Zapier, Node backend, Redis, Celery or microservices.

See [docs/PRIVACY_AND_LIMITATIONS.md](docs/PRIVACY_AND_LIMITATIONS.md) and
[docs/SOURCE_MAPPING.md](docs/SOURCE_MAPPING.md) — every threshold is sourced or marked
demo-only.

---

## Documentation

* [Architecture](docs/ARCHITECTURE.md) — layers, pipeline, workflow
* [Setup](docs/SETUP.md) — local, Supabase, Gemini, deployment notes
* [Demo script](docs/DEMO_SCRIPT.md) — the end-to-end walkthrough
* [Test report](docs/TEST_REPORT.md) — what was executed and what was not
* [Migration from Flutter](docs/MIGRATION_FROM_FLUTTER.md) — the Dart → Python port map
* [Metric definitions](docs/METRICS.md) · [Supported PDF format](docs/PDF_REPORT_FORMAT.md)
* [Source mapping](docs/SOURCE_MAPPING.md) · [Privacy and limitations](docs/PRIVACY_AND_LIMITATIONS.md)
* [Design system](docs/DESIGN_SYSTEM.md)

## Data and licences

All bundled data is synthetic. The real report used during development is **not** in this
repository; tests use a synthetic report rendered in the same layout. Arabic typography is
Noto Sans Arabic, loaded from Google Fonts (SIL Open Font License).
