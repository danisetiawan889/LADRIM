export type ProductItem = {
  id: string;
  pillar: string; // 'men' | 'women' | 'accessories'
  category: string; // 'tops' | 'bags' | 'bottoms' | 'shoes'
  subCategory: string; // 'polos' | 'plain-tees' | 'backpacks' | etc.
  name: string;
  slug: string;
  price: number; // in USD ($)
  originalPrice?: number;
  tag?: string; // 'New In' | 'Iconic' | 'Best Seller' | 'Crafted'
  colors: { name: string; hex: string }[];
  sizes: string[];
  material: string;
  fit: string;
  description: string;
  image: string;
  gallery?: string[];
  colorImages?: Record<string, string[]>;
  images?: { url: string; colorTag?: string }[];
};

export function getColorHex(name: string): string {
  const n = (name || '').toLowerCase().trim();
  if (n.startsWith('#')) return n;
  if (n.includes('white') || n.includes('putih') || n.includes('chalk') || n.includes('snow') || n === 'wht') return '#FFFFFF';
  if (n.includes('black') || n.includes('hitam') || n.includes('onyx') || n.includes('charcoal') || n === 'blk') return '#18181b';
  if (n.includes('gray') || n.includes('grey') || n.includes('abu') || n.includes('silver')) return '#71717a';
  if (n.includes('navy') || n.includes('dark blue')) return '#1e293b';
  if (n.includes('blue') || n.includes('biru')) return '#2563eb';
  if (n.includes('green') || n.includes('hijau') || n.includes('olive') || n.includes('alpine') || n.includes('sage')) return '#166534';
  if (n.includes('red') || n.includes('merah') || n.includes('crimson') || n.includes('burgundy')) return '#b91c1c';
  if (n.includes('brown') || n.includes('coklat') || n.includes('tan') || n.includes('mocha') || n.includes('espresso')) return '#78350f';
  if (n.includes('beige') || n.includes('krem') || n.includes('cream') || n.includes('sand')) return '#f5f5dc';
  if (n.includes('khaki')) return '#a3a286';
  if (n.includes('yellow') || n.includes('kuning')) return '#eab308';
  if (n.includes('orange') || n.includes('oranye')) return '#ea580c';
  if (n.includes('pink') || n.includes('merah muda') || n.includes('rose')) return '#f43f5e';
  if (n.includes('purple') || n.includes('ungu') || n.includes('lavender')) return '#9333ea';
  return '#27272a';
}

/**
 * Mapper function to convert a Prisma database Product into a Storefront ProductItem
 */
export function mapDbProductToItem(p: any): ProductItem {
  const rawImages: { url: string; colorTag?: string }[] = Array.isArray(p.images)
    ? p.images.map((img: any) => ({
        url: img.url,
        colorTag: (img.colorTag || '').trim(),
      }))
    : [];

  const colorImages: Record<string, string[]> = {};
  rawImages.forEach((img) => {
    if (img.colorTag) {
      const key = img.colorTag.toLowerCase();
      if (!colorImages[key]) colorImages[key] = [];
      colorImages[key].push(img.url);
    }
  });

  const variantColors = Array.from(
    new Set(p.variants?.map((v: any) => v.color).filter(Boolean) || [])
  ) as string[];
  const colorTagNames = Array.from(
    new Set(rawImages.map((img: any) => img.colorTag).filter(Boolean) || [])
  ) as string[];
  const colorNames = Array.from(new Set([...variantColors, ...colorTagNames]));

  const sizeNames = Array.from(
    new Set(p.variants?.map((v: any) => v.size).filter(Boolean) || [])
  ) as string[];

  const firstImage =
    rawImages[0]?.url ||
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';
  const gallery = rawImages.length > 0 ? rawImages.map((img) => img.url) : [firstImage];

  return {
    id: p.id,
    pillar: (p.department || 'men').toLowerCase(),
    category: (p.subcategory || 'tops').toLowerCase(),
    subCategory: (p.itemType || 'polo').toLowerCase(),
    name: p.name,
    slug: p.slug,
    price: Number(p.basePrice || 0),
    tag: p.isTrending ? 'Best Seller' : p.isNewRelease ? 'New In' : undefined,
    colors:
      colorNames.length > 0
        ? colorNames.map((c) => ({
            name: c.charAt(0).toUpperCase() + c.slice(1),
            hex: getColorHex(c),
          }))
        : [{ name: 'Standard', hex: '#111111' }],
    sizes: sizeNames.length > 0 ? sizeNames : ['S', 'M', 'L', 'XL'],
    material: 'Premium Tailored Cotton & Denim',
    fit: 'Relaxed Tailored Silhouette',
    description: p.description || 'Curated luxury fashion and timeless design.',
    image: firstImage,
    gallery,
    colorImages,
    images: rawImages,
  };
}

/**
 * Real catalog product list (Default empty. Populated solely by user creations from database)
 */
export const catalogProducts: ProductItem[] = [];

/**
 * Global USD currency formatter
 */
export function formatUSD(amount: number): string {
  return `$${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Filter products by path and optional active subcategory
 */
export function getFilteredCatalog(
  pillarSlug: string,
  categorySlug?: string,
  subCategorySlug?: string
): ProductItem[] {
  let list = catalogProducts.filter((p) => p.pillar.toLowerCase() === pillarSlug.toLowerCase());

  if (categorySlug) {
    list = list.filter((p) => p.category.toLowerCase() === categorySlug.toLowerCase());
  }

  if (subCategorySlug && subCategorySlug !== 'view-all') {
    list = list.filter((p) => p.subCategory.toLowerCase() === subCategorySlug.toLowerCase());
  }

  return list;
}

/**
 * Hero editorial banner configuration for categories
 */
export type CategoryHeroInfo = {
  title: string;
  pillarName: string;
  subtitle: string;
  bannerImage: string;
};

export function getCategoryHero(pillarSlug: string, categorySlug?: string): CategoryHeroInfo {
  const p = pillarSlug.toLowerCase();
  const c = (categorySlug ?? '').toLowerCase();

  if (p === 'men' && c === 'tops') {
    return {
      pillarName: 'Men',
      title: 'Tops',
      subtitle: 'From technical aerotech polo shirts to sculptural heavyweight tees and seamless tanks.',
      bannerImage: '/images/men-tops-hero.jpg',
    };
  }

  if (p === 'men' && c === 'bags') {
    return {
      pillarName: 'Men',
      title: 'Bags',
      subtitle: 'Engineered gym duffels, utilitarian crossbody bags, and durable training backpacks.',
      bannerImage: '/images/men-bags-hero.jpg',
    };
  }

  if (p === 'men' && c === 'bottoms') {
    return {
      pillarName: 'Men',
      title: 'Bottoms',
      subtitle: 'Performance shorts, tapered training joggers, and compression tights.',
      bannerImage: '/images/men-tops-hero.jpg',
    };
  }

  if (p === 'women') {
    return {
      pillarName: 'Women',
      title: c ? c.charAt(0).toUpperCase() + c.slice(1) : 'Collection',
      subtitle: 'Seamless sculpting leggings, support sports bras, and elevated athleisure essentials.',
      bannerImage: '/images/auth-hero.jpg',
    };
  }

  if (p === 'accessories') {
    return {
      pillarName: 'Accessories',
      title: c ? c.charAt(0).toUpperCase() + c.slice(1) : 'Gear & Accessories',
      subtitle: 'Lifting belts, wrist wraps, shaker bottles, and gym essentials.',
      bannerImage: '/images/men-bags-hero.jpg',
    };
  }

  return {
    pillarName: p.charAt(0).toUpperCase() + p.slice(1),
    title: c ? c.charAt(0).toUpperCase() + c.slice(1) : 'All Essentials',
    subtitle: 'Timeless luxury silhouettes, tailored for modern living.',
    bannerImage: '/images/men-tops-hero.jpg',
  };
}

/**
 * Find single product by its unique slug
 */
export function getProductBySlug(slug: string): ProductItem | undefined {
  if (!slug) return undefined;
  const normalized = slug.toLowerCase().trim();
  return catalogProducts.find((p) => p.slug.toLowerCase() === normalized);
}

/**
 * Get related products from same category or pillar
 */
export function getRelatedProducts(product: ProductItem, limit: number = 4): ProductItem[] {
  return catalogProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || p.pillar === product.pillar))
    .slice(0, limit);
}
