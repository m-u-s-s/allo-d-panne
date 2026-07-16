import { setRequestLocale } from 'next-intl/server';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="p-8">
      <h1 className="font-display text-2xl">ALB Dépannage — {locale}</h1>
    </main>
  );
}
