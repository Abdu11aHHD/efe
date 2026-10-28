/** Square health-service tiles in the "الملف الصحي" row, and the Sukkar Plus
 *  tile that sits alongside them. */

import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from './Icons';

export interface ServiceTileSpec {
  key: string;
  label_ar: string;
  sublabel_ar?: string;
  icon: IconName;
  route?: string;
  available?: boolean;
}

export function ServiceTile({ spec, onUnavailable }: {
  spec: ServiceTileSpec; onUnavailable?: (label: string) => void;
}) {
  const navigate = useNavigate();
  const available = spec.available !== false;
  return (
    <button
      type="button"
      onClick={() => (available && spec.route ? navigate(spec.route) : onUnavailable?.(spec.label_ar))}
      aria-label={spec.label_ar}
      className="sp-pressable relative shrink-0 w-[132px] h-[132px] overflow-hidden rounded-tile
        bg-surface border border-line/70 p-3 text-right"
    >
      <span className="block text-[13.5px] font-bold leading-snug text-ink">{spec.label_ar}</span>
      {spec.sublabel_ar && (
        <span className="mt-0.5 block text-[11px] leading-snug text-ink-3">{spec.sublabel_ar}</span>
      )}
      <span className="absolute -bottom-2 left-2 text-primary/70" aria-hidden>
        <Icon name={spec.icon} size={56} strokeWidth={1.2} />
      </span>
      {!available && (
        <span className="absolute top-2 left-2 rounded-pill bg-surface-3 px-2 py-0.5
          text-[10px] text-ink-3">قريبًا</span>
      )}
    </button>
  );
}

/** The سكر بلس service tile. Same shape and weight as its neighbours, with a
 *  blue accent and one restrained mint highlight so it reads as a service of
 *  the same family rather than a promotional banner. */
export function SukkarPlusTile({ badge }: { badge?: string | null }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      data-testid="sukkar-plus-tile"
      onClick={() => navigate('/sukkar')}
      aria-label="سكر بلس — رحلتك مع السكر، بطريقة أسهل"
      className="sp-pressable relative shrink-0 w-[132px] h-[132px] overflow-hidden rounded-tile
        border border-primary/40 bg-surface p-3 text-right
        hover:border-primary/70"
    >
      <span
        aria-hidden
        className="absolute inset-0 opacity-90"
        style={{ background: 'linear-gradient(200deg, rgba(30,143,224,0.18) 0%, rgba(50,212,180,0.08) 55%, transparent 80%)' }}
      />
      <span className="relative block text-[13.5px] font-bold leading-snug text-ink">سكر بلس</span>
      <span className="relative mt-0.5 block text-[11px] leading-snug text-ink-2">
        رحلتك مع السكر، بطريقة أسهل
      </span>
      {badge && (
        <span className="relative mt-1.5 inline-block max-w-full truncate rounded-pill
          bg-mint-soft px-2 py-0.5 text-[10px] font-semibold text-mint">{badge}</span>
      )}
      <span className="absolute -bottom-3 -left-2 text-primary/80" aria-hidden>
        <Icon name="glucose" size={52} strokeWidth={1.3} />
      </span>
    </button>
  );
}

export function TileRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="sp-hide-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
      {children}
    </div>
  );
}
