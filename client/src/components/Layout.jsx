import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Compass, Home, Layers, LogOut, MessagesSquare, Quote, Settings } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useReviewSummary } from '../hooks/useReview';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../store/auth';
import { LevelBadge, Logo } from './ui';

const ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/topics', label: 'Topics', icon: Compass },
  { to: '/chat', label: 'Chat', icon: MessagesSquare },
  { to: '/phrases', label: 'Phrases', icon: Quote },
  { to: '/review', label: 'Review', icon: Layers, badge: true },
];

// How many cards are waiting, on the Review tab.
function Badge({ count }) {
  if (!count) return null;
  return (
    <span className="ml-0.5 grid min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold leading-5 text-white" aria-label={`${count} due`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

const topLink = ({ isActive }) =>
  `flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
      : 'text-slate-600 hover:bg-white/70 dark:text-slate-400 dark:hover:bg-white/5'
  }`;

const tabLink = ({ isActive }) =>
  `flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition ${
    isActive ? 'text-violet-600 dark:text-violet-300' : 'text-slate-500 dark:text-slate-400'
  }`;

export default function Layout() {
  const logout = useAuth((s) => s.logout);
  const qc = useQueryClient();
  const { pathname } = useLocation();
  const { data: settings } = useSettings();
  const due = useReviewSummary().data?.due ?? 0;

  const signOut = () => {
    logout();
    qc.clear(); // don't leak the previous user's cached data
  };

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 pb-32 md:pb-12">
      <header className="flex items-center justify-between gap-3 py-5">
        <div className="flex items-center gap-2.5">
          <Logo size={36} />
          <span className="whitespace-nowrap text-lg font-extrabold tracking-tight">English Coach</span>
        </div>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {ITEMS.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end} className={topLink}>
              <Icon className="size-4" aria-hidden="true" />
              {label}
              {badge && <Badge count={due} />}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {settings?.level && <LevelBadge level={settings.level} size="sm" />}
          <NavLink
            to="/settings"
            aria-label="Settings"
            title="Settings"
            className={({ isActive }) =>
              `grid size-9 place-items-center rounded-xl transition ${
                isActive ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' : 'text-slate-500 hover:bg-white/70 hover:text-slate-800 dark:hover:bg-white/5 dark:hover:text-slate-200'
              }`
            }
          >
            <Settings className="size-[18px]" aria-hidden="true" />
          </NavLink>
          <button
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
            className="grid size-9 place-items-center rounded-xl text-slate-500 transition hover:bg-white/70 hover:text-slate-800 dark:hover:bg-white/5 dark:hover:text-slate-200"
          >
            <LogOut className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-3 bottom-3 z-20 flex rounded-3xl border border-white/70 bg-white/85 p-1.5 shadow-2xl shadow-indigo-500/15 backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-slate-900/85"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        {ITEMS.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink key={to} to={to} end={end} className={tabLink}>
            {({ isActive }) => (
              <>
                <span
                  className={`relative grid h-8 w-12 place-items-center rounded-full transition ${
                    isActive ? 'bg-violet-100 dark:bg-violet-500/20' : ''
                  }`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {badge && due > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-4 text-white" aria-label={`${due} due`}>
                      {due > 99 ? '99+' : due}
                    </span>
                  )}
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
