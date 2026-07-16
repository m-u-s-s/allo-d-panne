import { getContent } from '@/content';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { company } from '@/content/company';
import { CallButton } from './CallButton';
import { LocaleSwitcher } from './LocaleSwitcher';

export function SiteHeader({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="font-display text-sm font-bold tracking-widest text-text"
        >
          {company.displayName}
        </Link>

        <nav aria-label="Principale" className="hidden items-center gap-6 md:flex">
          <Link
            href="/transport-europe"
            className="text-sm text-muted transition-colors duration-200 hover:text-text"
          >
            {c.nav.transport}
          </Link>
          <Link
            href="/tarifs"
            className="text-sm text-muted transition-colors duration-200 hover:text-text"
          >
            {c.nav.pricing}
          </Link>
          <Link
            href="/contact"
            className="text-sm text-muted transition-colors duration-200 hover:text-text"
          >
            {c.nav.contact}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher current={locale} />
          <div className="hidden md:block">
            <CallButton label={c.hero.callCta} variant="primary" />
          </div>
        </div>
      </div>
    </header>
  );
}
