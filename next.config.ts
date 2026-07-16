import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  images: {
    // Next 16 : defaut [75]. On ajoute 90 pour le poster du hero (LCP).
    qualities: [75, 90],
  },
};

// Sans ce wrapper, next-intl/config (importe en interne par
// NextIntlClientProvider et getRequestConfig) reste un stub qui leve
// "Couldn't find next-intl config file" : c'est ce plugin qui alias
// next-intl/config vers src/i18n/request.ts (detecte par defaut).
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
