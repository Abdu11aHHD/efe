/** The persistent mobile-application shell.
 *
 *  A single phone-sized canvas that stays 440px wide and centred on a laptop
 *  and fills the viewport on a phone, with a fixed bottom navigation bar that
 *  survives every patient-facing route. */

import { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BellIcon, CalendarIcon, ChevronRight, HomeIcon, LeafIcon, UserIcon } from './Icons';

const TABS = [
  { to: '/', label: 'الرئيسية', Icon: HomeIcon, match: (p: string) => p === '/' },
  { to: '/appointments', label: 'المواعيد', Icon: CalendarIcon, match: (p: string) => p.startsWith('/appointments') },
  { to: '/wellness', label: 'جودة الحياة', Icon: LeafIcon, match: (p: string) => p.startsWith('/wellness') },
  {
    to: '/profile', label: 'ملفي', Icon: UserIcon,
    // Sukkar Plus is a service reached from ملفي, so that tab stays active inside it.
    match: (p: string) => p.startsWith('/profile') || p.startsWith('/sukkar'),
  },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="absolute bottom-0 inset-x-0 z-30 border-t border-line/70
        bg-[#0a0d13]/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-around px-2 pt-1.5 pb-1.5">
        {TABS.map(({ to, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={to} className="flex-1">
              {/* A plain Link: the active tab is decided here, because ملفي
                  stays active while the user is inside the Sukkar Plus service. */}
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className="sp-pressable flex flex-col items-center justify-center gap-1
                  rounded-2xl py-1.5 min-h-[52px]"
                style={active ? { background: 'var(--sp-surface-3)' } : undefined}
              >
                <Icon size={21} className={active ? 'text-primary' : 'text-ink-2'} />
                <span className={`text-[11px] font-medium leading-none
                  ${active ? 'text-primary' : 'text-ink-2'}`}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Header used by every patient screen. Title at the start (right in RTL),
 *  optional back button, optional trailing action. */
export function ScreenHeader({
  title, back, onBack, action, subtitle, bell, unread = 0,
}: {
  title: string;
  back?: boolean;
  onBack?: () => void;
  action?: ReactNode;
  subtitle?: string;
  bell?: boolean;
  unread?: number;
}) {
  const navigate = useNavigate();
  return (
    <header className="sp-safe-top sticky top-0 z-20 bg-bg/95 backdrop-blur-md border-b border-line/50">
      <div className="flex items-center gap-2.5 px-4 py-3.5">
        {back && (
          <button
            type="button"
            onClick={() => (onBack ? onBack() : navigate(-1))}
            aria-label="رجوع"
            className="sp-pressable -mr-1.5 grid place-items-center size-9 rounded-xl text-ink"
          >
            <ChevronRight size={22} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-[20px] font-bold text-ink leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-[12.5px] text-ink-3 truncate">{subtitle}</p>}
        </div>
        {bell && (
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            aria-label={unread > 0 ? `التنبيهات، ${unread} غير مقروءة` : 'التنبيهات'}
            className="sp-pressable relative grid place-items-center size-10 rounded-xl
              bg-surface border border-line/70 text-ink"
          >
            <BellIcon size={20} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center
                rounded-full bg-unread text-white text-[10px] font-bold sp-ltr">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        )}
        {action}
      </div>
    </header>
  );
}

/** Patient-facing screen wrapper: header + scroll area + bottom navigation. */
export function Screen({ children, header, className = '' }: {
  children: ReactNode; header?: ReactNode; className?: string;
}) {
  return (
    <>
      {header}
      <main className={`sp-scroll px-4 pt-4 ${className}`}>{children}</main>
      <BottomNav />
    </>
  );
}

export function DemoBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      role="note"
      className="bg-warn-soft border-b border-warn/30 px-4 py-1.5 text-center
        text-[11.5px] font-medium text-warn"
    >
      وضع العرض — بيانات تجريبية بالكامل
    </div>
  );
}
