import { expect, test } from '@playwright/test';

const LOCALES = ['fr', 'nl', 'en'] as const;

test.describe('Chemin de conversion', () => {
  for (const locale of LOCALES) {
    test(`[${locale}] le numero est atteignable sans scroll`, async ({
      page,
    }) => {
      await page.goto(`/${locale}`);
      const callLinks = page.locator('a[href="tel:+32467786456"]');
      await expect(callLinks.first()).toBeInViewport();
    });

    test(`[${locale}] aucun scroll horizontal`, async ({ page }) => {
      await page.goto(`/${locale}`);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(overflow).toBe(false);
    });
  }

  test('la racine redirige vers le francais', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/fr$/);
  });

  test('le selecteur de langue conserve la page', async ({ page }) => {
    await page.goto('/fr/tarifs');
    await page.getByRole('button', { name: 'NL' }).click();
    await expect(page).toHaveURL(/\/nl\/tarifs/);
  });
});

test.describe('Barre d appel mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile uniquement');

  test('reste visible apres un scroll en bas de page', async ({ page }) => {
    await page.goto('/fr');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const bar = page.locator('a[href="tel:+32467786456"]').last();
    await expect(bar).toBeInViewport();
  });

  test('ne masque pas le bas du footer', async ({ page }) => {
    await page.goto('/fr');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(
      page.getByText(/tous droits réservés/i),
    ).toBeInViewport();
  });
});

test.describe('Donnees non confirmees', () => {
  test('la TVA fausse n apparait nulle part', async ({ page }) => {
    await page.goto('/fr/mentions-legales');
    await expect(page.getByText('BE06922715996')).toHaveCount(0);
  });

  test('les mentions legales incompletes sont en noindex', async ({ page }) => {
    await page.goto('/fr/mentions-legales');
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /noindex/);
  });
});
