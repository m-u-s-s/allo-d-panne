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

  test('le selecteur de langue conserve la page', async ({ page }) => {
    // LocaleSwitcher est un server component (finding 5) : de vraies
    // ancres <a href>, pas des boutons pilotes par du JS client.
    // Sur mobile il vit dans le menu du header (details natif) : le
    // parcours reel passe par l'ouverture du menu.
    await page.goto('/fr/tarifs');
    const burger = page.locator('header summary');
    if (await burger.isVisible()) {
      await burger.click();
      // laisse finir l'entree @starting-style du panneau (200 ms) :
      // cliquer un element en cours de transition = « not stable ».
      await page.waitForTimeout(350);
    }
    await page.getByRole('link', { name: 'NL' }).click();
    await expect(page).toHaveURL(/\/nl\/tarifs/);
  });

  test('le selecteur de langue fonctionne JS desactive', async ({
    browser,
  }) => {
    // Le point central de finding 5 : un site statique de liens n'a besoin
    // d'aucun JavaScript pour changer de langue. Avec JS coupe, seul un
    // vrai <a href> peut encore fonctionner — un onClick ne le peut pas.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/fr/tarifs');
    // Sur mobile, le selecteur vit dans le menu du header : <details>
    // NATIF, il s'ouvre au clic sans aucun JavaScript — c'est ce que ce
    // test verrouille desormais aussi.
    const burger = page.locator('header summary');
    if (await burger.isVisible()) {
      await burger.click();
      await page.waitForTimeout(350); // meme stabilisation que ci-dessus
    }
    await page.getByRole('link', { name: 'NL' }).click();
    await expect(page).toHaveURL(/\/nl\/tarifs/);
    await context.close();
  });
});

test.describe('Negociation de langue a la racine', () => {
  // On cree un contexte navigateur dedie par test, avec l'option `locale`,
  // pour que le contexte par defaut du projet Playwright (mobile/desktop)
  // n'interfere pas avec la negociation qu'on verifie ici.
  //
  // Verifie empiriquement (pas suppose) : `extraHTTPHeaders` ne fonctionne
  // PAS pour cet usage sous Chromium — la toute premiere requete de
  // navigation (document racine) part avec l'Accept-Language par defaut du
  // navigateur (`en-US`) quel que soit l'en-tete fourni ; seules les
  // sous-ressources chargees ensuite recoivent l'en-tete surcharge. L'option
  // `locale` du contexte, elle, pilote l'Accept-Language des la requete de
  // navigation elle-meme — confirme via une capture des en-tetes reellement
  // envoyes. C'est donc `locale` qui pilote la negociation next-intl (cf.
  // `getAcceptLanguageLocale` dans next-intl/middleware/resolveLocale.js,
  // qui lit `accept-language` sur la requete entrante).
  async function gotoRootWithLocale(
    browser: import('@playwright/test').Browser,
    locale: string,
  ) {
    const context = await browser.newContext({ locale });
    const page = await context.newPage();
    await page.goto('/');
    return { context, page };
  }

  test('Accept-Language: nl redirige vers /nl', async ({ browser }) => {
    const { context, page } = await gotoRootWithLocale(browser, 'nl-NL');
    await expect(page).toHaveURL(/\/nl$/);
    await context.close();
  });

  test('Accept-Language: fr redirige vers /fr', async ({ browser }) => {
    const { context, page } = await gotoRootWithLocale(browser, 'fr-FR');
    await expect(page).toHaveURL(/\/fr$/);
    await context.close();
  });

  test('une langue non servie (de) retombe sur /fr, la langue par defaut', async ({
    browser,
  }) => {
    const { context, page } = await gotoRootWithLocale(browser, 'de-DE');
    await expect(page).toHaveURL(/\/fr$/);
    await context.close();
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
  // Les `reason` de company.ts sont des notes internes pour l'equipe de
  // dev, pas du contenu public : PendingDataNotice ne doit jamais les
  // reciter, sur aucune des 3 langues. Trois chaines concretes couvrent
  // les trois champs todo : la TVA erronee (BE06922715996), l'adresse
  // incomplete (Schaarbeeklei, une rue sans numero ni commune) et la
  // pretention autoroute non verifiable ("agree autoroute" — texte exact
  // de company.ts, sans accent). Une regression sur n'importe lequel des
  // trois est le meme risque juridique : publier au nom de l'entreprise
  // une donnee que l'entreprise elle-meme n'a pas confirmee.
  const LEAKED_STRINGS = ['BE06922715996', 'Schaarbeeklei', 'agree autoroute'];

  for (const locale of LOCALES) {
    test(`[${locale}] aucune donnee client non confirmee ne fuite sur les mentions legales`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/mentions-legales`);
      const bodyText = await page.locator('body').innerText();
      for (const leaked of LEAKED_STRINGS) {
        expect(bodyText).not.toContain(leaked);
      }
    });
  }

  test('les mentions legales incompletes sont en noindex', async ({ page }) => {
    await page.goto('/fr/mentions-legales');
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /noindex/);
  });
});
