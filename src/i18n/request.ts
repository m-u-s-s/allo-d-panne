import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Le contenu est du TypeScript type (src/content), pas des messages
  // JSON : next-intl ne sert ici qu'au routage et a la negociation.
  return { locale, messages: {} };
});
