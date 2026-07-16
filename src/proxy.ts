import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * Next 16 : ce fichier s'appelle proxy.ts, pas middleware.ts, et l'export
 * nomme est `proxy`. Le runtime est nodejs et n'est pas configurable —
 * l'edge n'est pas supporte ici.
 */
export const proxy = createMiddleware(routing);
export default proxy;

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
