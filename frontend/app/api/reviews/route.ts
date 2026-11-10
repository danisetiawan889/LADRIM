import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to check if an email has purchased this product
async function checkVerifiedBuyer(productId: string, email: string): Promise<boolean> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !productId) return false;

  try {
    // 1. Find product to get its ID, name, slug, and variants
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productId }, { slug: productId }],
      },
      include: {
        variants: true,
      },
    });

    if (!product) return false;

    const variantIds = new Set(product.variants.map((v) => v.id));
    const productNameLower = product.name.toLowerCase().trim();

    // 2. Find any non-cancelled order belonging to this email
    const orders = await prisma.orders.findMany({
      where: {
        status: { not: 'cancelled' },
        OR: [
          { guest_email: { equals: cleanEmail, mode: 'insensitive' } },
          { users: { email: { equals: cleanEmail, mode: 'insensitive' } } },
        ],
      },
      include: {
        order_items: true,
      },
    });

    if (!orders || orders.length === 0) return false;

    // 3. Check if any order contains this product
    for (const order of orders) {
      // Check order_items table
      if (order.order_items && order.order_items.length > 0) {
        for (const item of order.order_items) {
          if (variantIds.has(item.variant_id)) {
            return true;
          }
        }
      }

      // Check shipping_address.items JSON
      const addr: any = order.shipping_address;
      if (addr && Array.isArray(addr.items)) {
        for (const item of addr.items) {
          if (item.id && variantIds.has(item.id)) {
            return true;
          }
          if (item.name && typeof item.name === 'string') {
            const itemLower = item.name.toLowerCase().trim();
            if (
              itemLower === productNameLower ||
              itemLower.includes(productNameLower) ||
              productNameLower.includes(itemLower)
            ) {
              return true;
            }
          }
        }
      }
    }

    return false;
  } catch (error) {
    console.error('[CHECK_VERIFIED_BUYER_ERROR]', error);
    return false;
  }
}

// GET: Fetch reviews for a product along with summary stats
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    // Resolve canonical product ID
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productId }, { slug: productId }],
      },
      select: { id: true },
    });

    const canonicalId = product ? product.id : productId;

    // Fetch reviews
    const rawReviews: any[] = await (prisma as any).product_reviews.findMany({
      where: {
        OR: [{ product_id: canonicalId }, { product_id: productId }],
      },
      orderBy: { created_at: 'desc' },
    });

    // Compute stats
    const totalReviews = rawReviews.length;
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let ratingSum = 0;

    for (const r of rawReviews) {
      const star = Math.max(1, Math.min(5, Number(r.rating) || 5));
      distribution[star] = (distribution[star] || 0) + 1;
      ratingSum += star;
    }

    const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 0;

    const reviews = rawReviews.map((r: any) => ({
      id: r.id,
      productId: r.product_id,
      userName: r.user_name,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      isVerifiedBuyer: r.is_verified_buyer,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : new Date(r.created_at).toISOString(),
    }));

    return NextResponse.json({
      reviews,
      stats: {
        totalReviews,
        averageRating,
        distribution,
      },
    });
  } catch (error: any) {
    console.error('[API_REVIEWS_GET_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST: Submit a new review without requiring authentication
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, email, name, rating, title, comment } = body;

    // Validate input
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const cleanName = (name || '').trim();
    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5 stars.' }, { status: 400 });
    }

    const cleanComment = (comment || '').trim();
    if (!cleanComment || cleanComment.length < 3) {
      return NextResponse.json({ error: 'Please provide your review thoughts.' }, { status: 400 });
    }

    // Resolve canonical product ID
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productId }, { slug: productId }],
      },
      select: { id: true },
    });

    const canonicalId = product ? product.id : productId;

    // Validate if the email is a verified buyer
    const isVerifiedBuyer = await checkVerifiedBuyer(canonicalId, cleanEmail);

    // Save review to database
    const created: any = await (prisma as any).product_reviews.create({
      data: {
        product_id: canonicalId,
        user_email: cleanEmail,
        user_name: cleanName,
        rating: numericRating,
        title: (title || '').trim() || null,
        comment: cleanComment,
        is_verified_buyer: isVerifiedBuyer,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your review has been successfully posted.',
        review: {
          id: created.id,
          productId: created.product_id,
          userName: created.user_name,
          rating: created.rating,
          title: created.title,
          comment: created.comment,
          isVerifiedBuyer: created.is_verified_buyer,
          createdAt:
            created.created_at instanceof Date
              ? created.created_at.toISOString()
              : new Date(created.created_at).toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API_REVIEWS_POST_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}
