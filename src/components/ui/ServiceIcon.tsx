import type { ServiceId } from '@/content';

/**
 * Icones SVG, jamais d'emoji (regle no-emoji-icons).
 * viewBox 24x24 uniforme pour un rendu coherent.
 */
const PATHS: Record<ServiceId, string> = {
  towing: 'M3 17h2m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m10 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0M5 17V7h9l4 4v6M14 7v4h4',
  battery: 'M4 9h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2zm14 2h2v2h-2M7 11v2m3-2v2',
  tyre: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  fuel: 'M3 20h10V4H3v16zm0-9h10M16 8l3 3v7a2 2 0 0 1-4 0V6l-2-2',
  unlock: 'M7 11V7a5 5 0 0 1 9.9-1M5 11h14v10H5V11z',
  transport: 'M2 8h11v9H2V8zm11 3h4l4 3v3h-8m-9 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m10 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0',
  heavy: 'M2 7h9v10H2V7zm9 4h5l4 4v2h-9m-9 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m10 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0',
  accident: 'M12 2 2 20h20L12 2zm0 6v6m0 3v1',
};

export function ServiceIcon({ id }: { id: ServiceId }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 text-secondary"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[id]} />
    </svg>
  );
}
