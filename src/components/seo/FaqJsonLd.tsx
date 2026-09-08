import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';

/**
 * schema.org FAQPage — emis UNIQUEMENT sur la page qui affiche la FAQ
 * visible (regle Google : le balisage doit refleter un contenu present a
 * l'ecran, jamais un contenu fantome). Les questions/reponses viennent de
 * la meme source que le texte affiche : une seule verite, pas deux copies
 * qui divergent.
 */
export function FaqJsonLd({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // Contenu statique issu de notre propre code, jamais d'entree
      // utilisateur : pas de vecteur d'injection ici.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
