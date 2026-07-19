import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = [
  '/fr',
  '/fr/transport-europe',
  '/fr/tarifs',
  '/fr/contact',
  '/fr/mentions-legales',
  '/nl',
  '/en',
];

/*
 * Les scans axe tournent en prefers-reduced-motion : pratique standard
 * (axe recommande de neutraliser les animations pendant l'analyse — il
 * scrolle la page et lit des etats instantanes, les animations le font
 * begayer et le rendent non deterministe). Ce que le site anime est
 * decoratif et aria-hidden (canvas WebGL, marquees) : le palier Static
 * qu'active reduced-motion EST le rendu accessible du site — c'est
 * exactement la surface qu'axe doit auditer. Les tests clavier plus bas
 * gardent, eux, le rendu par defaut.
 */
test.describe('axe', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  for (const path of PAGES) {
    test(`${path} n a aucune violation axe (wcag2a, wcag2aa)`, async ({
      page,
    }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test('le parcours d appel est accessible au clavier', async ({ page }) => {
  await page.goto('/fr');

  // On tabule jusqu'a atteindre un lien d'appel : il doit etre
  // joignable sans souris.
  let found = false;
  for (let i = 0; i < 15 && !found; i++) {
    await page.keyboard.press('Tab');
    const href = await page.evaluate(
      () => (document.activeElement as HTMLAnchorElement)?.href ?? '',
    );
    if (href === 'tel:+32467786456') found = true;
  }
  expect(found).toBe(true);
});

test('le focus est visible', async ({ page }) => {
  await page.goto('/fr');
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    return getComputedStyle(el).outlineStyle;
  });
  expect(outline).not.toBe('none');
});
