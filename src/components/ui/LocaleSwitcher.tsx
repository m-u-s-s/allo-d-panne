'use client';

import { getContent } from '@/content';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const LABELS: Record<Locale, string> = { fr: 'FR', nl: 'NL', en: 'EN' };

export function LocaleSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const c = getContent(current);

  return (
    <nav aria-label={c.localeSwitcher.label} className="flex items-center gap-1">
      {routing.locales.map((locale) => {
        const isActive = locale === current;
        return (
          <button
            key={locale}
            type="button"
            aria-current={isActive ? 'true' : undefined}
            onClick={() => router.replace(pathname, { locale })}
            className={
              'min-h-[44px] min-w-[44px] cursor-pointer rounded px-2 text-sm ' +
              'transition-colors duration-200 ' +
              (isActive
                ? 'text-text underline underline-offset-4'
                : 'text-muted hover:text-text')
            }
          >
            {LABELS[locale]}
          </button>
        );
      })}
    </nav>
  );
}
