'use client';

import { useActionState } from 'react';
import { submitQuote, type QuoteState } from '@/app/[locale]/contact/actions';
import { getContent } from '@/content';
import type { Locale } from '@/i18n/routing';

const INITIAL: QuoteState = { status: 'idle' };

export function QuoteForm({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  const [state, formAction, pending] = useActionState(submitQuote, INITIAL);

  const field =
    'mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text ' +
    'placeholder:text-muted focus-visible:border-cta';

  return (
    <form action={formAction} className="max-w-xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm text-muted">
            {c.contactPage.fields.name} *
          </label>
          <input id="name" name="name" type="text" required className={field} />
        </div>

        <div>
          <label htmlFor="phone" className="text-sm text-muted">
            {c.contactPage.fields.phone} *
          </label>
          <input id="phone" name="phone" type="tel" required className={field} />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="email" className="text-sm text-muted">
          {c.contactPage.fields.email}
        </label>
        <input id="email" name="email" type="email" className={field} />
      </div>

      <div className="mt-4">
        <label htmlFor="service" className="text-sm text-muted">
          {c.contactPage.fields.service} *
        </label>
        <select id="service" name="service" required className={field}>
          {c.services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label htmlFor="location" className="text-sm text-muted">
          {c.contactPage.fields.location}
        </label>
        <input id="location" name="location" type="text" className={field} />
      </div>

      <div className="mt-4">
        <label htmlFor="message" className="text-sm text-muted">
          {c.contactPage.fields.message}
        </label>
        <textarea id="message" name="message" rows={4} className={field} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-md bg-cta px-6 py-3 font-semibold text-cta-fg transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
      >
        {pending ? '…' : c.contactPage.submit}
      </button>

      {/*
        aria-live : le retour est annonce aux lecteurs d'ecran.

        Un echec d'envoi et un champ invalide ne disent pas la meme chose.
        Afficher « l'envoi a echoue, appelez-nous » parce qu'un nom fait
        une lettre enverrait le client au telephone pour rien.
      */}
      <p aria-live="polite" className="mt-4 text-sm">
        {state.status === 'success' ? (
          <span className="text-secondary">{c.contactPage.success}</span>
        ) : null}
        {state.status === 'error' ? (
          <span className="text-cta">
            {state.field === 'smtp'
              ? c.contactPage.error
              : c.contactPage.invalidFields}
          </span>
        ) : null}
      </p>
    </form>
  );
}
