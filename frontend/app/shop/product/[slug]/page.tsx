import { redirect } from 'next/navigation';

export default function ShopProductRedirect({ params }: { params: { slug: string } }) {
  redirect(`/product/${params.slug}`);
}
