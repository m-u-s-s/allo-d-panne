import { useEffect } from 'react';

/**
 * Appelle `callback` quand un clic/tap se produit HORS de l'element reference.
 * Utilise mousedown + touchstart (comme la version shadcn) pour reagir avant
 * le click. Aucune dependance externe.
 */
export function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  callback: (event: MouseEvent | TouchEvent) => void,
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      callback(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, callback]);
}
