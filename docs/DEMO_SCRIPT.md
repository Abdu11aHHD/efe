# Demo script — about four minutes

Prerequisites: backend on `:8000`, website on `:5173`, both in demo mode.
The sample report is `backend/tests/fixtures/synthetic_discover_summary.pdf` — a synthetic
file rendered in the supported layout. No real patient data is involved.

---

## 0 · Sign in (15 s)

Open <http://127.0.0.1:5173> → **الدخول كمريض تجريبي**.

> Say: everything is synthetic, and the amber banner at the top says so on every screen.

## 1 · The healthcare shell (30 s)

You land on **الرئيسية**: a greeting, the patient summary, the next appointment slot, and
four bottom tabs — **الرئيسية · المواعيد · جودة الحياة · ملفي**.

Tap through **المواعيد** and **جودة الحياة** and back.

> Point out: the bottom bar never disappears, the canvas stays phone-sized on a laptop,
> and there is no fifth tab.

## 2 · Finding Sukkar Plus inside ملفي (30 s)

Tap **ملفي**. Point out the patient card with the health number, the **الملف الصحي**
section, and the horizontally scrolling service tiles: **سكر بلس** sits alongside
**فريقي الطبي**, **السجل الصحي** and **الأدوية والوصفات**.

Tap **سكر بلس**.

> Say: Sukkar Plus is a service inside the profile, exactly like السجل الصحي — not a
> separate app and not an iframe.

## 3 · The Sukkar Plus landing screen (30 s)

**أهلًا بك في سكر بلس**, a short explanation, the journey illustration, the main action
**ابدأ بتقرير السكر**, the health-journey timeline (every step still pending), and four
shortcuts. Before any upload there are no numbers and no empty charts — just
*خلّنا نرتّب تقريرك مع بعض*.

## 4 · Uploading a report (60 s)

**ابدأ بتقرير السكر** → choose `synthetic_discover_summary.pdf`.

The file name and size appear. Tap **رفع التقرير**:

1. a real upload progress bar (XHR, not a fake animation),
2. **جارٍ تجهيز التقرير** while the server runs the pipeline,
3. **تم بنجاح** only after the backend reports `ready`.

> Optional: try `notes.txt` first — it is rejected client-side before any request, with
> an Arabic reason.

Tap **افتح التقرير**.

## 5 · What the report says, and where it came from (60 s)

Walk down the detail screen:

* **يحتاج إلى مراجعة مختص** with the exact rules that fired, each naming its threshold.
* The period card: 14 days, 88 % sensor coverage, *تنسيق مُتحقَّق منه*.
* The range bar and its legend.
* The Arabic summary, labelled **نص من قالب محلي (دون ذكاء اصطناعي)** because no Gemini
  key is configured — the app says so rather than implying an AI wrote it.
* **القيم المستخرجة ومصادرها** — every one of the twelve values with the printed English
  label it was found next to and the page number.
* **فحوص الاتساق** — all six deterministic checks passing.

> Say: the parser reads what is printed. It never invents a value, and a missing value is
> "غير متاح", never zero.

Optional 20 s: tap **تصحيح** on *منخفض جدًا*, change 1.4 to 9, save. The five bands no
longer total 100 %, `band_sum` flips to failed, the field is marked inconsistent and the
report returns to *يحتاج مراجعة بعض القيم*. Undo by correcting it back.

## 6 · Preparing for the appointment (30 s)

**جهّز أسئلتي للموعد** → the summary: period, available metrics with their sources,
observed patterns, why a historical comparison is not possible yet, data limitations, and
numbered neutral questions to ask a clinician.

## 7 · Asking for a review (30 s)

**طلب مراجعة مختص** → type a reason. The screen shows **ما سيراه المراجع** — the exact
snapshot, nothing else. Send it.

> Say: the reviewer never sees the patient's identity or full record.

Optional: press the button again from the report screen — HTTP 409, *يوجد طلب متابعة
مفتوح*. Duplicates are prevented by an idempotency key, not by hiding the button.

## 8 · The reviewer side (45 s)

In a **second browser profile or a private window** (so the patient session stays signed
in), open the site and choose **الدخول كمراجع تجريبي**. The layout widens: this is a
desktop dashboard, not the phone canvas.

Open the request. The reviewer sees the shared snapshot, the extracted values with their
sources, the rule results with their citations and `demonstration_only` labels, the data
sufficiency, and the generated summary — but no name and no `user_id`.

**بدء المراجعة** → write a note → **مراجعة مطلوبة — إنشاء موعد تجريبي**.

## 9 · Back on the patient side (30 s)

Return to the patient window:

* **المواعيد** → a new appointment, labelled *موعد تجريبي داخل النموذج الأولي — لم يُحجز
  أي موعد حقيقي*.
* **التنبيهات** → four personal notifications in order: تقريرك جاهز، أُرسل طلب المتابعة،
  تمت مراجعة طلبك، موعد تجريبي جاهز. Reload the page — still four. Switch to **العامة**
  for the two general notices. Try **تعليم الكل كمقروء** and **حذف الكل**.
* **سكر بلس** → the health-journey timeline now shows all five steps complete.

> Close with: every notification came from a real backend event, and the appointment was
> created by Python after the reviewer's decision — nothing on this screen is hardcoded.

---

## If you only have 60 seconds

ملفي → سكر بلس → upload the fixture → open the report → scroll to
**القيم المستخرجة ومصادرها**.
