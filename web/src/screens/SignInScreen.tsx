/** Sign-in. In demo mode the backend issues clearly-labelled demo tokens;
 *  in live mode this screen explains that Supabase Auth must be configured. */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, ErrorState, Notice, Spinner } from '../components/ui';
import { DropletIcon } from '../components/Icons';
import { ApiError, api } from '../lib/api';
import { useSession } from '../lib/session';

export default function SignInScreen() {
  const { config, signIn, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState('');

  async function enterDemo(role: 'patient' | 'reviewer') {
    setBusy(role);
    setError(null);
    try {
      const session = await api.demoSession();
      await signIn(role === 'patient' ? session.patient_token : session.reviewer_token);
      navigate(role === 'patient' ? '/' : '/reviewer', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.messageAr : 'تعذّر الدخول.');
    } finally {
      setBusy(null);
    }
  }

  async function enterWithToken() {
    if (!token.trim()) return;
    setBusy('token');
    setError(null);
    try {
      await signIn(token.trim());
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.messageAr : 'تعذّر الدخول.');
    } finally {
      setBusy(null);
    }
  }

  if (sessionLoading) {
    return <div className="grid place-items-center min-h-dvh"><Spinner size={28} /></div>;
  }

  return (
    <main className="sp-scroll sp-safe-top px-5 pt-10 !pb-10">
      <div className="sp-enter flex flex-col items-center text-center">
        <div className="grid place-items-center size-16 rounded-2xl bg-primary-soft text-primary">
          <DropletIcon size={34} />
        </div>
        <h1 className="mt-4 text-[24px] font-bold text-ink">سكر بلس</h1>
        <p className="mt-1.5 text-[13.5px] text-ink-2 max-w-[300px] leading-relaxed">
          خدمة تساعدك على فهم تقارير السكر والاستعداد لموعدك الطبي.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {config?.demo_mode ? (
          <>
            <Notice tone="warn" title="وضع العرض">
              هذا الخادم يعمل ببيانات تجريبية في الذاكرة فقط. لا تُدخل أي بيانات صحية حقيقية.
            </Notice>
            <Card className="p-4 space-y-3">
              <Button full icon="user" loading={busy === 'patient'} onClick={() => void enterDemo('patient')}>
                الدخول كمريض تجريبي
              </Button>
              <Button full variant="secondary" icon="stethoscope" loading={busy === 'reviewer'}
                onClick={() => void enterDemo('reviewer')}>
                الدخول كمراجع تجريبي
              </Button>
            </Card>
          </>
        ) : (
          <>
            <Notice tone="info" title="تسجيل الدخول عبر Supabase">
              هذا الخادم مضبوط على الوضع المباشر. سجّل الدخول عبر Supabase Auth ثم الصق رمز
              الوصول (access token) هنا، أو اربط واجهة الدخول الخاصة بمؤسستك.
            </Notice>
            <Card className="p-4 space-y-3">
              <label className="block text-[13px] font-medium text-ink-2" htmlFor="token">
                رمز الوصول
              </label>
              <input
                id="token"
                type="password"
                dir="ltr"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="eyJhbGciOi…"
                className="w-full rounded-xl bg-surface-2 border border-line px-3 py-3
                  text-[13px] text-ink placeholder:text-ink-3 sp-ltr"
              />
              <Button full loading={busy === 'token'} onClick={() => void enterWithToken()}
                disabled={!token.trim()}>
                متابعة
              </Button>
            </Card>
          </>
        )}

        {error && <ErrorState message={error} />}

        {config?.setup_notes_ar?.length ? (
          <Notice tone="neutral" title="حالة الإعداد">
            <ul className="list-disc pr-4 space-y-1">
              {config.setup_notes_ar.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </Notice>
        ) : null}

        <p className="px-2 pt-2 text-center text-[11.5px] leading-relaxed text-ink-3">
          نموذج أولي مستقل غير مرتبط بتطبيق صحتي أو بوزارة الصحة أو بأي مُصنّع أجهزة.
          لا يقدّم تشخيصًا ولا توصيات علاجية، ولا يحجز مواعيد حقيقية.
        </p>
      </div>
    </main>
  );
}
