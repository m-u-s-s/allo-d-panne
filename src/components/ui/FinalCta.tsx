import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';
import { CallButton } from './CallButton';

export function FinalCta({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 text-center">
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-4xl">
        {c.finalCta.title}
      </h2>
      <p className="mx-auto mt-3 max-w-[60ch] text-muted">{c.finalCta.body}</p>
      <div className="mt-8 flex justify-center">
        <CallButton label={c.finalCta.button} variant="primary" showNumber />
      </div>
    </section>
  );
}
