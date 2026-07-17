import { useTranslation } from '../lib/i18n';

const Navbar = () => {
  const { locale, toggleLocale, t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-20 border-b border-snap-border bg-snap-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-snap-yellow flex items-center justify-center">
            <span className="text-snap-ink text-xs font-bold">S</span>
          </div>
          <span className="font-semibold text-snap-ink tracking-tight">{t('app.title')}</span>
        </div>
        <button
          type="button"
          onClick={toggleLocale}
          className="rounded-xl border border-snap-border bg-snap-card px-3 py-2 text-xs font-semibold text-snap-ink hover:bg-snap-soft transition-all"
          aria-label={t('navbar.languageLabel')}
        >
          {locale.toUpperCase()}
        </button>
      </div>
    </header>
  );
};

export default Navbar;