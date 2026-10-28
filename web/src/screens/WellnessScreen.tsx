/** جودة الحياة — general education, lifestyle guidance and appointment tips.
 *  Content and sources come from the backend; nothing here is personalised
 *  treatment advice. */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, ScreenHeader } from '../components/AppShell';
import { ChevronDown, Icon, type IconName } from '../components/Icons';
import { Card, ErrorState, ListSkeleton, Notice, SectionHeader } from '../components/ui';
import { api } from '../lib/api';
import { useApi } from '../lib/useApi';
import type { WellnessTopic } from '../lib/types';

const ICONS: Record<string, IconName> = {
  range: 'range', calendar: 'calendar', lab: 'lab',
  clipboard: 'clipboard', heart: 'heart', alert: 'alert',
};

function TopicCard({ topic }: { topic: WellnessTopic }) {
  const [open, setOpen] = useState(false);
  const alert = topic.tone === 'alert';
  return (
    <Card as="article" className={alert ? 'border-warn/35' : ''}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="sp-pressable flex w-full items-start gap-3 p-4 text-right"
      >
        <span className={`grid place-items-center size-10 shrink-0 rounded-xl
          ${alert ? 'bg-warn-soft text-warn' : 'bg-mint-soft text-mint'}`}>
          <Icon name={ICONS[topic.icon] ?? 'info'} size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] font-semibold text-ink">{topic.title_ar}</span>
          <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-2">{topic.summary_ar}</span>
        </span>
        <ChevronDown size={18}
          className={`mt-1 shrink-0 text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="sp-enter border-t border-line/70 px-4 py-3.5">
          <ul className="space-y-2">
            {topic.body_ar.map((p) => (
              <li key={p} className="flex gap-2 text-[13px] leading-relaxed text-ink-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          {topic.source_ref && (
            <p className="mt-3 border-t border-line/70 pt-2.5 text-[11.5px] text-ink-3">
              المصدر: {topic.source_ref}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

export default function WellnessScreen() {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi(() => api.wellness());

  return (
    <Screen header={<ScreenHeader title="جودة الحياة" bell />}>
      {loading && <ListSkeleton rows={4} />}
      {error && <ErrorState message={error.messageAr} onRetry={reload} />}

      {data && (
        <div className="sp-enter space-y-5">
          <Notice tone="mint" icon="leaf" title="معلومات تساعدك على المتابعة">
            محتوى عام يشرح المؤشرات ويساعدك على تجهيز أسئلتك قبل الموعد.
          </Notice>

          <section>
            <SectionHeader title="مواضيع" />
            <div className="space-y-3">
              {data.topics.map((t) => <TopicCard key={t.id} topic={t} />)}
            </div>
          </section>

          {data.linked_report && (
            <section>
              <SectionHeader title="مرتبط بتقريرك" />
              <Card
                className="sp-pressable cursor-pointer p-4"
                onClick={() => navigate(`/sukkar/reports/${data.linked_report!.id}`)}
              >
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center size-10 shrink-0 rounded-xl
                    bg-primary-soft text-primary">
                    <Icon name="document" size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-ink">
                      {data.linked_report.outcome_title_ar ?? 'آخر تقرير'}
                    </p>
                    <p className="text-[12.5px] text-ink-2">
                      اطّلع على ملخص المؤشرات وحدود البيانات
                    </p>
                  </div>
                </div>
              </Card>
            </section>
          )}

          <Notice tone="neutral" title="تنويه">{data.disclaimer_ar}</Notice>
        </div>
      )}
    </Screen>
  );
}
