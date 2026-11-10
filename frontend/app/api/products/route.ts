import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface CreateProductInput {
  name: string;
  slug?: string;
  description?: string;
  basePrice: number;
  category?: string;
  department?: string; // Men | Women | Accessories
  subcategory?: string; // Tops | Bottoms | Outerwear | Bags etc.
  itemType?: string; // Polo Shirt | T-Shirt | Hoodie etc.
  tags?: string; // Comma-separated search tags
  isTrending?: boolean;
  isNewRelease?: boolean;
  colorImages?: Record<string, string[]> | { colorTag: string; url: string }[];
  variants: {
    color: string;
    size: string;
    sku: string;
    price: number;
    stock: number;
  }[];
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateProductInput = await req.json();
    const {
      name,
      slug,
      description,
      basePrice,
      category,
      department,
      subcategory,
      itemType,
      tags,
      isTrending,
      isNewRelease,
      colorImages,
      variants,
    } = body;

    if (!name || basePrice === undefined || !variants || variants.length === 0) {
      return NextResponse.json(
        { error: 'Name, basePrice, and at least one variant are required.' },
        { status: 400 }
      );
    }

    const finalSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Math.random().toString(36).substring(2, 7)}`;

    // Normalize images: map colorTag -> urls
    const imageRecords: { colorTag: string; url: string }[] = [];
    if (colorImages) {
      if (Array.isArray(colorImages)) {
        colorImages.forEach((img) => {
          if (img.url && img.colorTag) {
            imageRecords.push({ colorTag: img.colorTag.trim(), url: img.url });
          }
        });
      } else {
        Object.entries(colorImages).forEach(([colorTag, urls]) => {
          if (Array.isArray(urls)) {
            urls.forEach((url) => {
              if (url) imageRecords.push({ colorTag: colorTag.trim(), url });
            });
          } else if (typeof urls === 'string' && urls) {
            imageRecords.push({ colorTag: colorTag.trim(), url: urls });
          }
        });
      }
    }

    // Database transaction: Product -> ProductImage -> Variant.createMany
    const created = await prisma.$transaction(async (tx) => {
      // 1. Create Product with hierarchy, tags, and homepage flags
      const product = await tx.product.create({
        data: {
          name,
          slug: finalSlug,
          description: description || null,
          basePrice: Number(basePrice),
          category: category || `${department || 'Men'} / ${subcategory || 'Tops'}`,
          department: department || 'Men',
          subcategory: subcategory || 'Tops',
          itemType: itemType || 'T-Shirt',
          tags: tags || null,
          isTrending: Boolean(isTrending),
          isNewRelease: isNewRelease !== undefined ? Boolean(isNewRelease) : true,
        },
      });

      // 2. Insert Color-Tagged Images (strictly grouped by colorTag)
      if (imageRecords.length > 0) {
        await tx.productImage.createMany({
          data: imageRecords.map((img) => ({
            productId: product.id,
            url: img.url,
            colorTag: img.colorTag,
          })),
        });
      }

      // 3. Map out flat combination arrays to Variant.createMany
      const variantRows = variants.map((v) => ({
        productId: product.id,
        color: v.color.trim(),
        size: v.size.trim(),
        sku:
          v.sku ||
          `${finalSlug.slice(0, 4).toUpperCase()}-${v.color.slice(0, 3).toUpperCase()}-${v.size.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        price: Number(v.price ?? basePrice),
        stock: Number(v.stock ?? 0),
      }));

      await tx.variant.createMany({
        data: variantRows,
      });

      // Fetch the created product with its relation tree
      const completeProduct = await tx.product.findUnique({
        where: { id: product.id },
        include: {
          images: true,
          variants: {
            orderBy: [{ color: 'asc' }, { size: 'asc' }],
          },
        },
      });

      return completeProduct;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Product, color-grouped images, and variant matrix created successfully.',
        data: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API_PRODUCTS_POST_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const isTrending = searchParams.get('trending');
    const isNewRelease = searchParams.get('newRelease');
    const search = searchParams.get('search');

    const where: any = {};
    if (department) {
      where.department = { equals: department, mode: 'insensitive' };
    }
    if (isTrending === 'true') {
      where.isTrending = true;
    }
    if (isNewRelease === 'true') {
      where.isNewRelease = true;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
        { itemType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        images: true,
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isTrending, isNewRelease } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (typeof isTrending === 'boolean') dataToUpdate.isTrending = isTrending;
    if (typeof isNewRelease === 'boolean') dataToUpdate.isNewRelease = isNewRelease;

    const updated = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
      include: {
        images: true,
        variants: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Product status updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('[API_PRODUCTS_PATCH_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
