import type { Locale } from '@/i18n/routing';
import { en } from './en';
import { fr } from './fr';
import { nl } from './nl';
import type { SiteContent } from './types';

const CONTENT: Record<Locale, SiteContent> = { fr, nl, en };

export function getContent(locale: Locale): SiteContent {
  return CONTENT[locale];
}

export { SERVICE_IDS } from './types';
export type { Service, ServiceId, SiteContent } from './types';
