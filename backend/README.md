# Sukkar Plus — backend

Python / FastAPI. All medical logic lives here; the website only renders what this
service returns.

```bash
python -m venv .venv && . .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
python -m pytest
```

Interactive docs at <http://127.0.0.1:8000/docs>. With an empty `.env` the service runs in
demo mode with a synthetic patient and reviewer held in memory.

## Layout

| Path | Contents |
|---|---|
| `app/domain/` | Pure Python: units, metrics, GMI, consensus targets, consistency checks, the PDF parser, the rule engine, the follow-up state machine, comparison, appointment preparation. No FastAPI, no network — this is the part that is unit-tested on its own |
| `app/services/` | PyMuPDF extraction, the processing pipeline, Gemini (guarded), notifications, simulated appointments |
| `app/db/` | `InMemoryRepository` for demo mode and tests, `SupabaseRepository` for live mode |
| `app/api/` | Routers; thin, with the logic in `domain` and `services` |
| `tests/` | 82 pytest tests and the synthetic report fixture |

## Rules the code is written to keep

* The deterministic parser is the only source of a number. Gemini may agree, disagree, or
  write prose — it can never introduce a value into a verified metric.
* A missing value is `None` with status `unavailable`. Never `0`.
* Nothing reports success before the pipeline has finished.
* Four outcomes only, each with its Arabic explanation and its source reference.
* Reviewer routes check the role before any privileged database client is used.
* No secret is ever returned to a client; `/config` says only *whether* something is set.
