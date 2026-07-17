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
