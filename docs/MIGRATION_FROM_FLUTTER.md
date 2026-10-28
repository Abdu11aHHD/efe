# Migration: Flutter + Dart + Deno → Website + Python

This project began as a Flutter application with a pure-Dart domain package and Supabase
Edge Functions written in Deno, plus a Make.com webhook for automation. The product is now
a **website** with a **Python / FastAPI** backend and no external automation platform.

The clinical logic was **ported, not rewritten from scratch and not discarded**. The table
below maps every Dart source file to its Python counterpart so the port can be reviewed
line by line.

## Domain logic

| Dart (`packages/sukkar_core/lib/src/…`) | Python (`backend/app/…`) | Notes |
|---|---|---|
| `common/units.dart` | `domain/units.py` | Same conversion factor (18.0182), same round-half-away-from-zero, same Arabic date words |
| `models/enums.dart` | `domain/metrics.py` | `DataProvenance`, `ValueOrigin`, `VerificationStatus`, `UserRole`, `TargetProfile` with the same Arabic labels |
| `models/cgm.dart` | `domain/metrics.py` | `MetricKey` wire names are unchanged, so stored JSON stays compatible |
| `cgm/gmi.dart` | `domain/gmi.py` | Identical formulas and the 0.15 % consistency tolerance |
| `cgm/targets.dart` | `domain/targets.py` | The same consensus tables and the same empty sets for pregnancy / pediatric / unspecified |
| `cgm/summary_checks.dart` | `domain/summary_checks.py` | All six checks, the same tolerances, `with_derived_metrics`, `quality_from_summary` |
| `extraction/extraction_models.dart` | `domain/extraction.py` | Field model, plausible ranges, bulk-confirm eligibility |
| `extraction/pdf_validation.dart` | `domain/extraction.py` | Same rejection reasons and Arabic messages |
| `extraction/report_parser.dart` | `domain/report_parser.py` | Both layouts, the unlabelled TIR triple reconciliation, day/month disambiguation against the "N-Day Summary" header |
| `extraction/review.dart` | `services/report_service.py` + `api/reports.py` | Per-field confirm / correct / mark-unavailable, re-running the checks |
| `rules/rules.dart` | `domain/rules.py` | The same four rules, the same versioned rule set id `2026.10-demo.1`, the same four outcomes |
| `followup/followup_workflow.dart` | `domain/followup.py` | Same state machine, access policy and idempotency key format |
| `models/followup.dart` | `domain/followup.py` | Same statuses, decisions and Arabic labels |
| `summary/visit_summary.dart` | `domain/visit_prep.py` | Adapted to the data this backend holds; the neutral-question generator is preserved |
| `comparison/trends.dart` | `domain/comparison.py` | Period comparison with unit / format / overlap compatibility gates |
| `ai/ai.dart` | `services/gemini.py` | `GroundedValue`, allowed-number set, the banned-phrase list, digit normalisation, and the local-template fallback are ported verbatim in behaviour |

## Infrastructure

| Was | Now | Why |
|---|---|---|
| `supabase/functions/extract-report` (Deno + Gemini) | `services/gemini.cross_check_extraction` | The backend must be Python; extraction now happens server-side with PyMuPDF and Gemini is only a cross-check |
| `supabase/functions/explain` (Deno + Gemini) | `services/gemini.explain` | Same guard, same fallback, now in Python |
| `supabase/functions/followup-dispatch` → Make.com | `services/appointments` + `services/notifications` | External workflow automation is explicitly out of scope; the workflow is plain Python inside FastAPI |
| `make/` | — | Retired |
| `app/` (Flutter, pdfrx/PDFium on device) | `web/` (React) + PyMuPDF on the server | The deliverable is a website; PDF text extraction moved to the server |

## Behavioural differences worth knowing

* **PDF text now comes from PyMuPDF, not PDFium on a device.** The parser works line by
  line on normalised text, and `tests/test_domain_extraction.py` asserts the real fixture
  PDF produces the same twelve fields and the same six passing checks as the Dart suite.
* **Raw-reading features are not part of this build.** The Flutter app could import CSV
  readings and detect hypoglycaemia episodes. Uploaded PDFs carry printed summaries only,
  so `CgmReport.has_raw_readings` is always false and the `EPI54-REPEATED` rule reports
  `not_applicable` with that reason rather than silently passing.
* **Labs, reminders and HbA1c comparison are not in this build.** The Dart package has
  them (`labs/`, `reminders/`, `comparison/gmi_hba1c.dart`) and the SQL tables remain, but
  no API surface exposes them yet. The appointment-preparation summary names the gap
  instead of pretending the data exists.

## Safe to delete

Nothing in the running product imports from `app/`, `packages/`, `supabase/functions/` or
`make/`. Once you are satisfied the port is faithful, you can remove them:

```bash
git rm -r app packages supabase/functions make
```

They were left in place so the port above can be checked against its source.
