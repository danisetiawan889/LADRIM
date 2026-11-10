import { resolveTaxonomy, taxonomy } from '@/lib/taxonomy';
import { getCategoryHero, mapDbProductToItem } from '@/lib/catalogData';
import { prisma } from '@/lib/prisma';
import CategoryView from '@/components/shop/CategoryView';
import { notFound } from 'next/navigation';

type Props = {
  params: { slug?: string[] };
};

export default async function ShopPage({ params }: Props) {
  const slugs = params.slug || [];
  if (slugs.length === 0) {
    notFound();
  }

  const { pillar, category, subCategory } = resolveTaxonomy(slugs);
  const resolvedPillar = pillar || taxonomy[0];
  const allSubCategories = category?.children ?? resolvedPillar.children ?? [];

  // Build filter query for real database products
  const where: any = {};
  if (resolvedPillar.name) {
    where.department = { equals: resolvedPillar.name, mode: 'insensitive' };
  }
  if (category?.name) {
    where.subcategory = { equals: category.name, mode: 'insensitive' };
  }

  const dbProducts = await prisma.product.findMany({
    where,
    include: {
      images: true,
      variants: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const initialProducts = dbProducts.map(mapDbProductToItem);
  const hero = getCategoryHero(resolvedPillar.slug, category?.slug);

  return (
    <CategoryView
      pillar={resolvedPillar}
      category={category}
      subCategory={subCategory}
      hero={hero}
      initialProducts={initialProducts}
      allSubCategories={allSubCategories}
    />
  );
}
