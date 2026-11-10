'use client';

import { useState, useEffect } from 'react';
import { Star, ShieldCheck, Check, AlertCircle, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ReviewItem {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  title: string | null;
  comment: string;
  isVerifiedBuyer: boolean;
  createdAt: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  distribution: Record<number, number>;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  // Submit State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Fetch reviews on mount or productId change
  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setStats(
          data.stats || {
            totalReviews: 0,
            averageRating: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          }
        );
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!name.trim()) {
      setSubmitError('Please enter your name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setSubmitError('Please enter a valid email address.');
      return;
    }
    if (!comment.trim()) {
      setSubmitError('Please write your review comment.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          name: name.trim(),
          email: email.trim(),
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSubmitSuccess(
        data.review?.isVerifiedBuyer
          ? 'Thank you! Your verified review has been published.'
          : 'Thank you! Your review has been published.'
      );

      // Reset form
      setName('');
      setEmail('');
      setTitle('');
      setComment('');
      setRating(5);

      // Refresh reviews list
      await fetchReviews();

      // Close modal/form after a short moment
      setTimeout(() => {
        setIsFormOpen(false);
        setSubmitSuccess(null);
      }, 1600);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <section id="product-reviews" className="mt-20 border-t border-black/10 pt-16">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b border-black/10">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl sm:text-3xl text-ink font-normal tracking-tight">
              Customer Reviews
            </h2>
            {stats.totalReviews > 0 && (
              <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700 font-medium">
                {stats.totalReviews}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={
                    star <= Math.round(stats.averageRating)
                      ? 'fill-amber-500 text-amber-500'
                      : 'fill-neutral-200 text-neutral-300'
                  }
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-ink">
              {stats.totalReviews > 0 ? stats.averageRating.toFixed(1) : 'No reviews yet'}
            </span>
            {stats.totalReviews > 0 && (
              <span className="text-xs text-neutral-500">
                based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setSubmitError(null);
            setSubmitSuccess(null);
          }}
          className="inline-flex items-center justify-center self-start sm:self-auto px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-ink text-white hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          {isFormOpen ? 'Close Form' : 'Write a Review'}
        </button>
      </div>

      {/* Review Form Drawer / Collapsible */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-b border-black/10 bg-white/70"
          >
            <form onSubmit={handleSubmit} className="py-8 max-w-2xl">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-ink mb-6">
                Write a Review
              </h3>

              {submitError && (
                <div className="mb-5 flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="mb-5 flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200">
                  <Check size={15} className="shrink-0 text-emerald-600" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Rating Stars */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-2 font-medium">
                    Rating *
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = star <= (hoverRating || rating);
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                          aria-label={`Rate ${star} star`}
                        >
                          <Star
                            size={22}
                            className={active ? 'fill-amber-500 text-amber-500' : 'fill-neutral-200 text-neutral-300'}
                          />
                        </button>
                      );
                    })}
                    <span className="ml-2 text-xs font-medium text-neutral-600">
                      {hoverRating || rating} / 5
                    </span>
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1.5 font-medium">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dani Setiawan"
                      className="w-full border border-black/20 bg-white px-3.5 py-2.5 text-xs text-ink placeholder:text-neutral-400 focus:border-ink focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1.5 font-medium">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full border border-black/20 bg-white px-3.5 py-2.5 text-xs text-ink placeholder:text-neutral-400 focus:border-ink focus:outline-none transition-colors"
                    />
                    <p className="mt-1 text-[11px] text-neutral-500">
                      Used to verify your purchase. Will not be published.
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1.5 font-medium">
                    Review Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Perfect fit and drape"
                    className="w-full border border-black/20 bg-white px-3.5 py-2.5 text-xs text-ink placeholder:text-neutral-400 focus:border-ink focus:outline-none transition-colors"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1.5 font-medium">
                    Review *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write your thoughts on the quality, sizing, and material..."
                    className="w-full border border-black/20 bg-white px-3.5 py-2.5 text-xs text-ink placeholder:text-neutral-400 focus:border-ink focus:outline-none transition-colors resize-y"
                  />
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center px-6 py-2.5 text-xs font-semibold uppercase tracking-wider bg-ink text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin mr-2" />
                        Posting...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 text-xs text-neutral-600 hover:text-ink transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      <div className="pt-8">
        {loading ? (
          <div className="py-12 flex justify-center items-center text-neutral-400">
            <Loader2 size={20} className="animate-spin mr-2" />
            <span className="text-xs">Loading reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center text-neutral-500">
            <p className="text-xs">No reviews for this product yet.</p>
            <p className="mt-1 text-xs text-neutral-400">
              Be the first to share your thoughts on this piece.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/10">
            {reviews.map((rev) => (
              <article key={rev.id} className="py-6 first:pt-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {/* Stars & Verified Badge */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={
                              s <= rev.rating
                                ? 'fill-amber-500 text-amber-500'
                                : 'fill-neutral-200 text-neutral-300'
                            }
                          />
                        ))}
                      </div>

                      {rev.isVerifiedBuyer && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold tracking-wider uppercase">
                          <ShieldCheck size={12} className="text-emerald-600" />
                          Verified Buyer
                        </span>
                      )}
                    </div>

                    {/* Review Title */}
                    {rev.title && (
                      <h4 className="mt-2 text-sm font-semibold text-ink">
                        {rev.title}
                      </h4>
                    )}

                    {/* Review Body */}
                    <p className="mt-1.5 text-xs leading-relaxed text-neutral-700 whitespace-pre-line">
                      {rev.comment}
                    </p>

                    {/* Author & Date */}
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-neutral-500">
                      <span className="font-medium text-neutral-800">{rev.userName}</span>
                      <span>·</span>
                      <time dateTime={rev.createdAt}>{formatDate(rev.createdAt)}</time>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
