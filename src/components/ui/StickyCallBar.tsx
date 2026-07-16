import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';
import { CallButton } from './CallButton';

/**
 * Barre d'appel fixee en bas sur mobile — le meilleur apport de
 * l'approche C. Visible sur 100% des vues, a portee de pouce.
 * Masquee sur desktop, ou le header porte deja le CTA.
 */
export function StickyCallBar({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface md:hidden">
      <CallButton label={c.hero.callCta} variant="bar" showNumber />
    </div>
  );
}
