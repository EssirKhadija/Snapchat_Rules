import { Outlet } from 'react-router-dom';

import { Zap } from 'lucide-react';

const AuthLayout = () => (
  <div className="min-h-screen bg-snap-bg py-10 px-4 text-snap-ink sm:px-6 lg:px-8">
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-[2rem] border border-snap-border bg-snap-card/95 p-6 shadow-[0_24px_80px_-30px_rgba(26,26,24,0.35)] backdrop-blur sm:p-8">
        <div className="mb-8 flex items-center justify-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-snap-yellow text-snap-ink shadow-sm">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">SnapRules</p>
            <p className="text-[11px] uppercase tracking-[0.32em] text-snap-muted">Automation Studio</p>
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  </div>
);

export default AuthLayout;
