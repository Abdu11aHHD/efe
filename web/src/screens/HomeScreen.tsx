/** الرئيسية — greeting, patient summary, shortcuts, next appointment and a
 *  small contextual pointer to Sukkar Plus. No fabricated glucose values and
 *  no analytics dashboard: numbers appear only once a report exists. */

import { useNavigate } from 'react-router-dom';
import { Screen, ScreenHeader } from '../components/AppShell';
import { Icon } from '../components/Icons';
import {
  Badge, Button, Card, ErrorState, ListSkeleton, Notice, SectionHeader, Skeleton,
} from '../components/ui';
import { api } from '../lib/api';
import { arDateTime, daysUntil } from '../lib/format';
import { useApi } from '../lib/useApi';
import { useSession } from '../lib/session';

const JOURNEY_TONE: Record<string, 'info' | 'ok' | 'warn' | 'mint'> = {
  no_report: 'info',
  processing: 'info',
  needs_review: 'warn',
  ready: 'mint',
  failed: 'warn',
  followup_pending: 'info',
  followup_reviewed: 'mint',
  appointment_ready: 'mint',
};

export default function HomeScreen() {
  const navigate = useNavigate();
  const { demoMode } = useSession();
  const { data, error, loading, reload } = useApi(() => api.home());

  return (
    <Screen
      header={
        <ScreenHeader
          title="الرئيسية"
          subtitle={data ? `${data.greeting_ar}، ${data.profile.display_name ?? 'بك'}` : undefined}
          bell
          unread={data?.unread_notifications ?? 0}
        />
      }
    >
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[96px] w-full" />
          <ListSkeleton rows={2} />
        </div>
      )}

      {error && <ErrorState message={error.messageAr} detail={error.detailAr} onRetry={reload} />}

      {data && (
        <div className="sp-enter space-y-6">
          {/* --------------------------------------- patient summary */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <span className="grid place-items-center size-11 shrink-0 rounded-xl bg-primary
                text-white text-[18px] font-bold">
                {(data.profile.display_name ?? 'م').trim().charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-ink truncate">
                  {data.profile.display_name ?? 'مستخدم سكر بلس'}
                </p>
                <p className="text-[12.5px] text-ink-2">
                  الفئة المرجعية: {data.profile.target_profile_label_ar}
                </p>
              </div>
            </div>
          </Card>

          {/* ------------------------------------ next appointment */}
          <section aria-labelledby="next-appointment">
            <SectionHeader
              title="موعدك القادم"
              actionLabel="كل المواعيد"
              onAction={() => navigate('/appointments')}
            />
            {data.next_appointment ? (
              <Card
                as="article"
                className="sp-pressable cursor-pointer p-4"
                onClick={() => navigate(`/appointments/${data.next_appointment!.id}`)}
              >
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center size-10 shrink-0 rounded-xl
                    bg-primary-soft text-primary">
                    <Icon name="calendar" size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-semibold text-ink">
                      {data.next_appointment.specialty_ar}
                    </p>
                    <p className="text-[12.5px] text-ink-2">{data.next_appointment.clinic_label}</p>
                    <p className="mt-1 text-[12.5px] text-primary">
                      {arDateTime(data.next_appointment.scheduled_at)}
                    </p>
                  </div>
                  <Badge tone="warn">بعد {daysUntil(data.next_appointment.scheduled_at)} يومًا</Badge>
                </div>
                <p className="mt-3 border-t border-line/70 pt-2.5 text-[11.5px] text-ink-3">
                  {data.next_appointment.simulated_label_ar}
                </p>
              </Card>
            ) : (
              <Card className="p-4">
                <p className="text-[13.5px] text-ink-2">
                  لا توجد مواعيد قادمة. تُنشأ المواعيد التجريبية بعد موافقة المراجع على طلب متابعة.
                </p>
              </Card>
            )}
          </section>

          {/* ------------------------ contextual Sukkar Plus pointer */}
          <section aria-labelledby="sukkar-pointer">
            <SectionHeader title="رحلتك مع السكر" />
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <span className="grid place-items-center size-10 shrink-0 rounded-xl
                  bg-mint-soft text-mint">
                  <Icon name="glucose" size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14.5px] font-semibold text-ink">{data.sukkar_plus.title_ar}</p>
                    <Badge tone={JOURNEY_TONE[data.sukkar_plus.state] ?? 'info'}>سكر بلس</Badge>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                    {data.sukkar_plus.body_ar}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2.5">
                <Button variant="primary" className="flex-1" onClick={() => navigate('/sukkar')}>
                  فتح سكر بلس
                </Button>
                <Button variant="secondary" onClick={() => navigate('/profile')}>
                  من ملفي
                </Button>
              </div>
              <p className="mt-3 text-[11.5px] text-ink-3">
                تجد سكر بلس دائمًا داخل «ملفي» ضمن خدمات الملف الصحي.
              </p>
            </Card>
          </section>

          {/* --------------------------------------------- shortcuts */}
          <section aria-labelledby="shortcuts">
            <SectionHeader title="خدمات سريعة" />
            <div className="grid grid-cols-2 gap-3">
              {data.shortcuts.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => navigate(s.route)}
                  className="sp-pressable rounded-tile border border-line/70 bg-surface p-3.5 text-right"
                >
                  <span className="mb-2 grid place-items-center size-9 rounded-xl
                    bg-primary-soft text-primary">
                    <Icon name={s.icon as 'glucose'} size={18} />
                  </span>
                  <span className="block text-[13.5px] font-semibold text-ink">{s.label_ar}</span>
                  <span className="block text-[11.5px] text-ink-3">{s.subtitle_ar}</span>
                </button>
              ))}
            </div>
          </section>

          {demoMode && (
            <Notice tone="warn" title="وضع العرض">
              جميع البيانات المعروضة اصطناعية. لا ترفع تقارير تحتوي بيانات صحية حقيقية.
            </Notice>
          )}
        </div>
      )}
    </Screen>
  );
}
