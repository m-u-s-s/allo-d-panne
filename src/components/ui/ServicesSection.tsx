import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';
import { ServiceIcon } from './ServiceIcon';

export function ServicesSection({ locale }: { locale: Locale }) {
  const c = getContent(locale);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
        {c.servicesSection.title}
      </h2>
      <p className="mt-2 max-w-[60ch] text-muted">{c.servicesSection.subtitle}</p>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {c.services.map((service) => (
          <li
            key={service.id}
            className="rounded-lg border border-border bg-surface p-5 transition-colors duration-200 hover:border-cta"
          >
            <ServiceIcon id={service.id} />
            <h3 className="mt-3 font-semibold text-text">{service.title}</h3>
            <p className="mt-1 text-sm text-muted">{service.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
