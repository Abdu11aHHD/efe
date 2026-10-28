"""Health check, runtime configuration and the demo sign-in helper."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ..config import Settings, get_settings
from ..errors import not_found
from ..schemas.api import ConfigResponse, DemoSessionResponse, HealthResponse

router = APIRouter(tags=["meta"])

VERSION = "1.0.0"


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(version=VERSION)


@router.get("/config", response_model=ConfigResponse)
def config(settings: Settings = Depends(get_settings)) -> ConfigResponse:
    notes: list[str] = []
    if not settings.supabase_configured:
        notes.append(
            "لم تُضبط بيانات Supabase على الخادم، لذلك يعمل التطبيق في وضع العرض "
            "ببيانات تجريبية داخل الذاكرة فقط ولن تُحفظ بعد إعادة تشغيل الخادم."
        )
    if not settings.gemini_configured:
        notes.append(
            "لم يُضبط مفتاح Gemini، لذلك تُكتب الملخصات العربية بقوالب محلية "
            "وتُستخرج القيم بالتحليل النصي فقط."
        )
    return ConfigResponse(
        demo_mode=settings.effective_demo_mode,
        supabase_configured=settings.supabase_configured,
        gemini_configured=settings.gemini_configured,
        environment=settings.environment,
        max_upload_bytes=settings.max_upload_bytes,
        accepted_mime_types=["application/pdf"],
        setup_notes_ar=notes,
    )


@router.post("/auth/demo-session", response_model=DemoSessionResponse)
def demo_session(settings: Settings = Depends(get_settings)) -> DemoSessionResponse:
    """Only available while the server runs in demo mode."""
    if not settings.effective_demo_mode:
        raise not_found("وضع العرض غير مفعّل على هذا الخادم؛ سجّل الدخول عبر Supabase.")
    from ..demo import DEMO_PATIENT_TOKEN, DEMO_REVIEWER_TOKEN
    return DemoSessionResponse(
        patient_token=DEMO_PATIENT_TOKEN,
        reviewer_token=DEMO_REVIEWER_TOKEN,
        note_ar="حساب تجريبي ببيانات اصطناعية بالكامل. لا تستخدمه لبيانات صحية حقيقية.",
    )
