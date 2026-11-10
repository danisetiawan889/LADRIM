// Comprehensive fashion taxonomy matching luxury e-commerce standards (like Louis Vuitton / The Row)
export type Node = {
  slug: string;
  name: string;
  description?: string;
  children?: Node[];
};

import rawTaxonomy from './taxonomy.json';

export const taxonomy: Node[] = rawTaxonomy as Node[];

/**
 * Traverse the taxonomy tree given an array of slugs (e.g. ['men', 'tops', 'polos'])
 */
export function resolveTaxonomy(slugs: string[]): {
  pillar?: Node;
  category?: Node;
  subCategory?: Node;
  trail: Node[];
} {
  const trail: Node[] = [];
  if (!slugs.length) return { trail };

  const pillar = taxonomy.find((n) => n.slug === slugs[0]);
  if (pillar) trail.push(pillar);

  let category: Node | undefined;
  if (pillar && slugs.length > 1) {
    category = pillar.children?.find((n) => n.slug === slugs[1]);
    if (category) trail.push(category);
  }

  let subCategory: Node | undefined;
  if (category && slugs.length > 2) {
    subCategory = category.children?.find((n) => n.slug === slugs[2]);
    if (subCategory) trail.push(subCategory);
  }

  return { pillar, category, subCategory, trail };
}
