import { PHONE_NATIONAL, TEL_HREF } from '@/lib/phone';

type Props = {
  label: string;
  variant: 'primary' | 'bar' | 'header';
  showNumber?: boolean;
};

/**
 * L'element de conversion central du site.
 *
 * href toujours en E.164 : les clients du transport europeen appellent
 * depuis l'etranger. text-cta-fg (sombre) et jamais text-white : blanc
 * sur l'ambre donne 2,68:1 et echoue WCAG AA.
 */
export function CallButton({ label, variant, showNumber = false }: Props) {
  const base =
    'inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-2 ' +
    'bg-cta font-semibold text-cta-fg transition-opacity duration-200 ' +
    'hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2';

  const byVariant = {
    primary: 'rounded-md px-6 py-3 text-base',
    bar: 'w-full rounded-none px-4 py-4 text-lg',
    // Le CTA du header : icone seule sous md, icone + libelle (+ numero)
    // des md. Contrairement a une paire de liens bascules par `hidden` /
    // `md:hidden`, ce <a> n'est JAMAIS display:none — seul son PADDING et
    // son CONTENU changent de taille. Un second lien tel: masque par
    // breakpoint serait invisible a l'AUTRE breakpoint et romprait la
    // promesse "numero atteignable sans scroll" pour l'un des deux : le
    // premier a[href="tel:..."] du DOM est celui teste, sans connaitre le
    // viewport (voir e2e/conversion.spec.ts).
    header: 'rounded-md px-0 py-3 md:px-6',
  } as const;

  if (variant === 'header') {
    return (
      <a
        href={TEL_HREF}
        aria-label={label}
        className={`${base} ${byVariant.header}`}
      >
        <PhoneIcon />
        <span className="hidden md:inline">{label}</span>
        {showNumber ? (
          <span className="hidden font-mono tabular-nums md:inline">
            {PHONE_NATIONAL}
          </span>
        ) : null}
      </a>
    );
  }

  return (
    <a href={TEL_HREF} className={`${base} ${byVariant[variant]}`}>
      <PhoneIcon />
      <span>{label}</span>
      {showNumber ? (
        <span className="font-mono tabular-nums">{PHONE_NATIONAL}</span>
      ) : null}
    </a>
  );
}

/** Icone SVG, pas un emoji (regle : no-emoji-icons). */
function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
