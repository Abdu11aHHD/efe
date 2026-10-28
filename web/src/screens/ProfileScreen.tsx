/** ملفي — the Sehhaty-inspired profile screen.
 *
 *  Structure follows the reference layout: profile heading with a share
 *  action, patient card, a feature banner, the "الملف الصحي" service tile row
 *  (which is where سكر بلس lives) and the "التقارير والمستندات" list.
 *
 *  The patient details shown here come from the authenticated profile. In demo
 *  mode they are fictional and labelled as such. */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, ScreenHeader } from '../components/AppShell';
import { ChevronDown, Icon, ShareIcon } from '../components/Icons';
import { ServiceTile, SukkarPlusTile, TileRow, type ServiceTileSpec } from '../components/ServiceTile';
import {
  Badge, Card, ErrorState, ListSkeleton, Notice, RowGroup, ListRow, SectionHeader, Skeleton, Toast,
} from '../components/ui';
import { api } from '../lib/api';
import { useApi } from '../lib/useApi';
import { useSession } from '../lib/session';

const SERVICES: ServiceTileSpec[] = [
  { key: 'care_team', label_ar: 'فريقي الطبي', sublabel_ar: 'طبيب لكل أسرة', icon: 'stethoscope', available: false },
  { key: 'health_record', label_ar: 'السجل الصحي', icon: 'clipboard', available: false },
  { key: 'medicines', label_ar: 'الأدوية والوصفات', icon: 'pill', available: false },
];

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { profile, demoMode, signOut } = useSession();
  const { data, error, loading, reload } = useApi(() => api.healthProfile());
  const [toast, setToast] = useState<string | null>(null);
  const [showAllServices, setShowAllServices] = useState(false);

  const sukkarBadge = data?.sukkar_plus.open_followups
    ? 'قيد المراجعة'
    : data?.sukkar_plus.reports_count
      ? `${data.sukkar_plus.reports_count} تقرير`
      : 'ابدأ الآن';

  return (
    <Screen
      header={
        <ScreenHeader
          title="ملفي"
          action={
            <button
              type="button"
              onClick={() => setToast('المشاركة غير مفعّلة في النموذج الأولي.')}
              className="sp-pressable flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-primary"
            >
              <ShareIcon size={18} />
              <span className="text-[13px] font-medium">مشاركة</span>
            </button>
          }
        />
      }
    >
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-[86px] w-full" />
          <Skeleton className="h-[110px] w-full" />
          <ListSkeleton rows={2} />
        </div>
      )}

      {error && <ErrorState message={error.messageAr} detail={error.detailAr} onRetry={reload} />}

      {data && (
        <div className="sp-enter space-y-6">
          {/* ---------------------------------------------- patient card */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <span className="grid place-items-center size-11 shrink-0 rounded-xl bg-primary
                text-white text-[18px] font-bold">
                {(data.profile.display_name ?? 'م').trim().charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-ink truncate">
                  {data.profile.display_name ?? 'مستخدم سكر بلس'}
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink-2">
                  الرقم الصحي: <span className="sp-ltr">{data.profile.health_record_number ?? data.profile.pseudo_id}</span>
                </p>
              </div>
              <ChevronDown size={18} className="mt-1 shrink-0 text-ink-3" />
            </div>
            {data.profile.is_synthetic && (
              <div className="mt-3 border-t border-line/70 pt-3">
                <Badge tone="warn" icon="info">بيانات تجريبية — ليست لشخص حقيقي</Badge>
              </div>
            )}
          </Card>

          {/* ------------------------------------------- feature banner */}
          <button
            type="button"
            onClick={() => navigate('/sukkar/how-it-works')}
            className="sp-pressable relative block w-full overflow-hidden rounded-card
              border border-line/70 bg-surface p-4 text-right"
          >
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-1/2"
              style={{ background: 'linear-gradient(270deg, rgba(30,143,224,0.30), transparent)' }}
            />
            <span aria-hidden className="absolute bottom-0 left-3 text-primary/45">
              <Icon name="chart" size={64} strokeWidth={1} />
            </span>
            <span className="relative block text-[15px] font-bold text-primary">
              رحلتك مع السكر ←
            </span>
            <span className="relative mt-1 block text-[12.5px] text-ink-2 max-w-[62%]">
              افهم تقاريرك واستعد لموعدك خطوة بخطوة
            </span>
          </button>

          {/* ------------------------------------------- health profile */}
          <section aria-labelledby="health-profile-heading">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 id="health-profile-heading" className="text-[17px] font-bold text-ink">الملف الصحي</h2>
              <button
                type="button"
                onClick={() => setShowAllServices((v) => !v)}
                className="flex items-center gap-1 text-[13px] font-medium text-primary"
              >
                {showAllServices ? 'إخفاء' : 'إظهار الكل'}
                <ChevronDown size={15} className={showAllServices ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
            </div>

            <TileRow>
              {/* Sukkar Plus sits with the other health services, not above them. */}
              <SukkarPlusTile badge={sukkarBadge} />
              {SERVICES.map((s) => (
                <ServiceTile key={s.key} spec={s} onUnavailable={(l) => setToast(`${l}: غير مفعّلة في النموذج الأولي.`)} />
              ))}
            </TileRow>

            {showAllServices && (
              <div className="mt-3 space-y-3">
                <Notice tone="neutral" title="الأهداف المرجعية المطبّقة على تقاريرك">
                  <p className="mb-2">{data.targets.profile_label_ar}</p>
                  {data.targets.items.length > 0 ? (
                    <ul className="space-y-1">
                      {data.targets.items.map((t) => (
                        <li key={t.metric} className="flex justify-between gap-3">
                          <span>{t.label_ar}</span>
                          <span className="text-ink shrink-0">{t.text_ar}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{data.targets.notes_ar[0]}</p>
                  )}
                </Notice>
                <p className="px-1 text-[11.5px] text-ink-3">
                  {data.sukkar_plus.data_sufficiency_rule_ar}
                </p>
              </div>
            )}
          </section>

          {/* --------------------------------- reports and documents */}
          <section aria-labelledby="documents-heading">
            <SectionHeader title="التقارير والمستندات" />
            <RowGroup>
              <ListRow
                icon="document"
                label="تقارير السكر"
                sublabel={data.sukkar_plus.reports_count
                  ? `${data.sukkar_plus.reports_count} تقرير مرفوع`
                  : 'لم ترفع تقريرًا بعد'}
                onClick={() => navigate('/sukkar/reports')}
              />
              <ListRow
                icon="clipboard"
                label="ملخصات الاستعداد للموعد"
                sublabel="ملخص بالعربية لآخر تقرير"
                onClick={() => navigate('/sukkar/visit-prep')}
              />
              <ListRow
                icon="stethoscope"
                label="طلبات المتابعة"
                sublabel={data.sukkar_plus.open_followups
                  ? `${data.sukkar_plus.open_followups} طلب مفتوح`
                  : 'لا توجد طلبات مفتوحة'}
                onClick={() => navigate('/sukkar/followups')}
              />
              <ListRow
                icon="bed"
                label="الإجازات المرضية"
                sublabel="غير مفعّلة في النموذج الأولي"
                onClick={() => setToast('الإجازات المرضية غير مفعّلة في النموذج الأولي.')}
              />
            </RowGroup>
          </section>

          {/* ---------------------------------------------- account */}
          <section aria-labelledby="account-heading">
            <SectionHeader title="الحساب" />
            <RowGroup>
              <ListRow
                icon="question"
                label="كيف يعمل سكر بلس؟"
                onClick={() => navigate('/sukkar/how-it-works')}
              />
              <ListRow
                icon="alert"
                label="تسجيل الخروج"
                danger
                onClick={() => { signOut(); navigate('/sign-in', { replace: true }); }}
              />
            </RowGroup>
          </section>

          <p className="px-2 pb-2 text-center text-[11.5px] leading-relaxed text-ink-3">
            {demoMode
              ? 'وضع العرض: جميع البيانات اصطناعية وتُحذف عند إعادة تشغيل الخادم.'
              : `المعرّف المستعار: ${profile?.pseudo_id ?? ''}`}
          </p>
        </div>
      )}

      {toast && <Toast message={toast} tone="danger" onDismiss={() => setToast(null)} />}
    </Screen>
  );
}
