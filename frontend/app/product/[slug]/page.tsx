import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { mapDbProductToItem } from '@/lib/catalogData';
import ProductDetailView from '@/components/product/ProductDetailView';

type Props = {
  params: { slug: string };
};

export default async function ProductPage({ params }: Props) {
  const rawSlug = decodeURIComponent(params.slug || '').trim();

  // Find real product from database
  const dbProduct = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: { equals: rawSlug, mode: 'insensitive' } },
        { id: { equals: rawSlug, mode: 'insensitive' } },
      ],
    },
    include: {
      images: true,
      variants: true,
    },
  });

  if (!dbProduct) {
    notFound();
  }

  const product = mapDbProductToItem(dbProduct);

  // Find related products from database
  const relatedDbProducts = await prisma.product.findMany({
    where: {
      id: { not: dbProduct.id },
      department: dbProduct.department,
    },
    include: {
      images: true,
      variants: true,
    },
    take: 4,
  });

  const relatedProducts = relatedDbProducts.map(mapDbProductToItem);

  return (
    <ProductDetailView
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
