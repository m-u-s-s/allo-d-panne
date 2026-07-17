import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';
import { CallButton } from './CallButton';
import { VideoRevealMount } from './VideoRevealMount';

/**
 * `videoReveal` est un opt-in : FinalCta sert aussi sur /tarifs, ou une
 * page utilitaire de prix n'a pas a porter 120vh de cinema avant son
 * CTA. Seul l'accueil l'active. Le bloc video est purement decoratif et
 * client-only : sans JavaScript ou en palier Static il n'existe pas, la
 * section reste identique a ce qu'elle a toujours ete.
 */
export function FinalCta({
  locale,
  videoReveal = false,
}: {
  locale: Locale;
  videoReveal?: boolean;
}) {
  const c = getContent(locale);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 text-center">
      {videoReveal && <VideoRevealMount />}
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
