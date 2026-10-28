# Architecture

```
sukkar_plus/
├── backend/                       Python 3.11+ / FastAPI — all medical logic lives here
│   ├── app/
│   │   ├── main.py                application factory, CORS, error handler
│   │   ├── config.py              pydantic-settings; secrets from env only
│   │   ├── deps.py                settings, repository and session injection
│   │   ├── errors.py              typed API errors with Arabic messages
│   │   ├── demo.py                the synthetic demo patient and reviewer
│   │   ├── domain/                pure Python, no FastAPI, no network
│   │   │   ├── units.py           glucose units, rounding, Arabic dates
│   │   │   ├── metrics.py         MetricKey, MetricValue, periods, data quality, CgmReport
│   │   │   ├── gmi.py             GMI formulas and the printed-GMI tolerance
│   │   │   ├── targets.py         2019 consensus reference targets per profile
│   │   │   ├── summary_checks.py  the six cross-checks, derived metrics, data sufficiency
│   │   │   ├── extraction.py      extraction models + structural PDF validation
│   │   │   ├── report_parser.py   the deterministic text parser (two layouts)
│   │   │   ├── rules.py           versioned rule set, rule engine, four outcomes
│   │   │   ├── comparison.py      period-to-period comparison with compatibility gates
│   │   │   ├── followup.py        state machine, access policy, idempotency
│   │   │   └── visit_prep.py      appointment-preparation summary + neutral questions
│   │   ├── services/
│   │   │   ├── pdf_extract.py     PyMuPDF text extraction, scanned-PDF detection
│   │   │   ├── report_service.py  the processing pipeline and re-analysis
│   │   │   ├── gemini.py          google-genai SDK, Pydantic schemas, grounding guard
│   │   │   ├── notifications.py   event-driven notifications with dedupe keys
│   │   │   └── appointments.py    idempotent simulated-appointment creation
│   │   ├── db/
│   │   │   ├── models.py          row-shaped records shared by both repositories
│   │   │   └── repository.py      InMemoryRepository (demo) + SupabaseRepository (live)
│   │   ├── schemas/api.py         request/response models
│   │   └── api/                   routers: meta, profile, home, reports, visit_prep,
│   │                              followups, reviewer, appointments, notifications, wellness
│   └── tests/                     82 pytest tests + the synthetic report fixture
│
├── web/                           React 18 + TypeScript + Vite + Tailwind
│   └── src/
│       ├── lib/                   typed API client, session context, formatters, useApi
│       ├── components/            AppShell, BottomNav, ScreenHeader, tiles, ui kit, icons
│       ├── screens/               الرئيسية · المواعيد · جودة الحياة · ملفي · التنبيهات · sign-in
│       ├── sukkar/                the Sukkar Plus service: landing, upload, reports,
│       │                          report detail, visit prep, follow-ups, how-it-works
│       ├── reviewer/              the wider desktop reviewer dashboard
│       └── test/                  29 vitest + Testing Library tests
│
├── supabase/migrations/           schema, RLS, RPCs, and the Sukkar Plus additions
└── docs/                          this documentation
```

## Layers

```
 React screens ──▶ lib/api.ts (typed client, bearer token)
                        │  HTTPS
                        ▼
                FastAPI routers  ──▶ deps.Session (auth + role + repository)
                        │
                        ├──▶ domain/*            pure, deterministic, unit-tested
                        ├──▶ services/*          PDF, Gemini, notifications, appointments
                        └──▶ db/repository.py
                                 ├── InMemoryRepository   (demo mode, tests)
                                 └── SupabaseRepository   (live mode)
                                          ├── user client  — carries the caller's JWT, RLS applies
                                          └── admin client — service role, server only
```

Business logic stays out of route handlers: a router validates input, resolves a session,
calls a domain object or service, and serialises the result.

## Two runtime modes

* **Demo mode** — the default, and forced whenever Supabase is not configured. A single
  synthetic patient and reviewer live in process memory. `GET /api/v1/config` reports
  `demo_mode: true` and the website shows a persistent "وضع العرض" banner. Nothing is
  persisted across a restart, and the API says so rather than implying it saved anything.
* **Live mode** — Supabase Postgres with RLS, Supabase Auth, and a private storage bucket.
  Gemini activates only when its key is set on the server; otherwise extraction stays
  deterministic and summaries come from local Arabic templates.

## Upload pipeline

```
POST /api/v1/reports (multipart)
  ├─ size guard + validate_pdf_bytes   extension, empty, >15 MB, %PDF-, %%EOF, /Encrypt
  ├─ insert sukkar_reports row, status = processing      → 202 Accepted
  └─ BackgroundTask:
       extract_page_texts (PyMuPDF)    scanned PDF → explicit "OCR required" error
       ReportTextParser.parse          omnipod_discover_agp_summary_v1 | generic_agp_unverified
       [GeminiService.cross_check]     optional; agreement/disagreement only, never a new number
       apply_consistency_checks        six deterministic cross-checks
       auto_confirm                    only fields that passed every check
       verified_metrics_from           + with_derived_metrics (TBR, TAR, GMI)
       quality_from_summary            14 days / 70 % coverage
       RuleEngine.evaluate             → one of four outcomes
       GeminiService.explain           guarded; falls back to a local Arabic template
       save + notify(report_ready)     status = ready | needs_review | failed
```

The website polls `GET /api/v1/reports/{id}/status` and only shows success once the server
reports `ready`. Correcting a value re-enters the pipeline at `apply_consistency_checks`
through `PATCH /api/v1/reports/{id}/fields`, so a correction re-runs the checks and the
rule evaluation rather than editing a stored conclusion.

## Follow-up workflow

```
draft ─submit─▶ awaiting_review ─start─▶ under_review ─decide─┬─▶ reviewed ─close─▶ closed
  │                   │                                       └─▶ more_info_requested ─submit─▶ awaiting_review
  └──withdraw─────────┴──▶ closed
```

* Enforced in Python (`domain/followup.py`) and mirrored by the SQL RPCs; invalid
  transitions raise `InvalidTransitionError` → HTTP 400 with an Arabic message.
* Duplicate prevention: idempotency key `user|report|trigger|sorted rule ids`, rejected
  with HTTP 409 while an open request with the same key exists, and backed by a partial
  unique index in SQL.
* `decide(review_required)` is the only path that creates an appointment, and
  `create_simulated_appointment` is idempotent on `followup_id` (plus a unique index), so
  a retried request cannot produce two appointments.
* Every transition writes a status-history row and, where it matters to the patient, a
  notification with a deterministic `dedupe_key`.

## Authorisation

`deps.get_session` resolves the bearer token to a profile and role. Reviewer routes depend
on `get_reviewer_session`, which raises HTTP 403 for a patient. The reviewer serialiser
strips `user_id`. In live mode patient reads additionally pass through PostgREST with the
caller's own JWT, so RLS is a second, independent gate.

## The website shell

A single `.sp-canvas` element: 440 px wide and centred on a laptop, full width on a phone,
`min-height: 100dvh`, its own scroll area, and a fixed bottom navigation with exactly four
destinations. Sukkar Plus is **not** a fifth tab — it is a service reached from ملفي, and
the ملفي tab stays active throughout it. The reviewer dashboard deliberately escapes the
canvas and uses a wider desktop layout.

## API surface

All routes are under `/api/v1`. Everything except `/health`, `/config` and
`/auth/demo-session` requires `Authorization: Bearer <token>`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness |
| GET | `/config` | demo mode, what is configured, upload limits, Arabic setup notes |
| POST | `/auth/demo-session` | demo-mode tokens (404 in live mode) |
| GET | `/me` | authenticated profile |
| PATCH | `/me/target-profile` | change the reference-target profile |
| GET | `/me/health-profile` | the ملفي screen: identity, targets, Sukkar Plus state |
| GET | `/home` | the الرئيسية aggregate |
| GET | `/sukkar/state` | the Sukkar Plus landing screen in one call |
| POST | `/reports` | upload a PDF → 202 + report id |
| GET | `/reports` | paginated history |
| GET | `/reports/{id}` | full detail |
| GET | `/reports/{id}/status` | processing status |
| GET | `/reports/{id}/metrics` | verified metrics + the extraction record |
| GET | `/reports/{id}/summary` | analysis + Arabic summary |
| PATCH | `/reports/{id}/fields` | confirm / correct / mark unavailable, then re-analyse |
| GET | `/visit-prep`, `/visit-prep/{report_id}` | appointment-preparation summary |
| GET/POST | `/followups` | list / create (and submit) |
| GET | `/followups/{id}` | detail incl. the simulated appointment |
| POST | `/followups/{id}/submit`, `/withdraw`, `/close` | patient transitions |
| GET | `/reviewer/requests` | the queue (reviewer role only) |
| GET | `/reviewer/requests/{id}` | snapshot + report + analysis, no patient identity |
| POST | `/reviewer/requests/{id}/start`, `/decide`, `/notes` | reviewer transitions |
| GET | `/appointments`, `/appointments/{id}` | simulated appointments + preparation |
| GET | `/notifications`, `/notifications/{id}` | list and detail |
| POST | `/notifications/{id}/read`, `/notifications/read-all` | read states |
| DELETE | `/notifications` | delete all, optionally one channel |
| GET | `/wellness` | جودة الحياة content and sources |

Interactive docs: `http://127.0.0.1:8000/docs`.
