import HeroSection from '@/components/home/HeroSection';
import TrendingSection from '@/components/home/TrendingSection';
import NewReleasesSection from '@/components/home/NewReleasesSection';
import { prisma } from '@/lib/prisma';
import { mapDbProductToItem } from '@/lib/catalogData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  let newReleasesProducts: any[] = [];
  let trendingProducts: any[] = [];

  try {
    const [newReleasesDb, trendingDb] = await Promise.all([
      prisma.product.findMany({
        where: { isNewRelease: true },
        include: { images: true, variants: true },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      prisma.product.findMany({
        where: { isTrending: true },
        include: { images: true, variants: true },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
    ]);

    let resolvedNewReleases = newReleasesDb;
    if (resolvedNewReleases.length === 0) {
      resolvedNewReleases = await prisma.product.findMany({
        include: { images: true, variants: true },
        orderBy: { createdAt: 'desc' },
        take: 12,
      });
    }

    let resolvedTrending = trendingDb;
    if (resolvedTrending.length === 0) {
      resolvedTrending = await prisma.product.findMany({
        include: { images: true, variants: true },
        orderBy: { createdAt: 'desc' },
        take: 12,
      });
    }

    newReleasesProducts = resolvedNewReleases.map(mapDbProductToItem);
    trendingProducts = resolvedTrending.map(mapDbProductToItem);
  } catch (err) {
    console.error('[HOMEPAGE_FETCH_ERROR]', err);
  }

  return (
    <>
      <HeroSection />
      <TrendingSection initialProducts={trendingProducts} />
      <NewReleasesSection initialProducts={newReleasesProducts} />
    </>
  );
}
