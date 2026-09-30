"use client";

import { useState } from "react";
import { Star, ShieldCheck, Plus, CheckCircle2, X } from "lucide-react";
import { Review } from "@/types";
import { formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

interface ReviewSummaryProps {
  productId: number;
  ratingAverage: number;
  reviewCount: number;
  reviews?: Review[];
}

export function ReviewSummary({
  productId,
  ratingAverage,
  reviewCount,
  reviews = [],
}: ReviewSummaryProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating score between 1 and 5 stars.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitReview(productId, {
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
        user_name: userName.trim() || (user?.name || "Verified Studio Buyer"),
      });

      if (res.review) {
        setLocalReviews([res.review, ...localReviews]);
      }
      const successFeedback = comment.trim() 
        ? "Your review and rating have been published!" 
        : "Your rating has been successfully submitted!";
      toast.success(successFeedback);
      setSuccessMsg(successFeedback);
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg(null);
        setTitle("");
        setComment("");
      }, 1200);
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.message || "Failed to submit review. Please try again.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-10 border-t border-gray-200 dark:border-white/10 space-y-8">
      {/* Header and Rating Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span 
            className="text-xs font-black uppercase tracking-widest block mb-1"
            style={{ color: "var(--theme-view-all-color, var(--theme-tab-active-bg, var(--theme-primary, #006B45)))" }}
          >
            Customer Validation
          </span>
          <h3 
            className="text-xl sm:text-2xl font-black tracking-tight"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            Verified Studio Reviews ({reviewCount})
          </h3>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start md:self-auto px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/15 text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.01] cursor-pointer shadow-2xs"
          style={{
            backgroundColor: "var(--theme-card-bg, #ffffff)",
            color: "var(--theme-text-heading, #0f172a)"
          }}
        >
          <Plus 
            className="w-4 h-4" 
            style={{ color: "var(--theme-view-all-color, var(--theme-primary, #006B45))" }}
          /> 
          <span>Write a Review / Rate</span>
        </button>
      </div>

      {/* Breakdown Card */}
      <div 
        className="p-6 rounded-3xl border grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center shadow-2xs"
        style={{
          backgroundColor: "var(--theme-card-bg, #ffffff)",
          borderColor: "var(--theme-card-border, #e5e7eb)"
        }}
      >
        <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/10 pb-6 md:pb-0 md:pr-8">
          <span 
            className="text-5xl font-black block tracking-tight"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            {Number(ratingAverage || 0).toFixed(1)}
          </span>
          <div className="flex justify-center md:justify-start gap-1 text-amber-400 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${
                  s <= Math.round(ratingAverage) ? "fill-amber-400" : "text-slate-300 dark:text-slate-700"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Based on {reviewCount} customer ratings
          </span>
        </div>

        {/* Rating Bars */}
        <div className="md:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const percentage = stars === 5 ? 85 : stars === 4 ? 12 : 3;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-12 font-medium">{stars} Stars</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono font-medium">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3.5">
        {localReviews.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            No reviews yet. Be the first to share your rating!
          </p>
        ) : (
          localReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl border space-y-3 shadow-2xs"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e5e7eb)"
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.user_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                    alt={rev.user_name}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-white/10"
                  />
                  <div>
                    <h4 
                      className="text-xs font-bold flex items-center gap-1.5"
                      style={{ color: "var(--theme-text-heading, #0f172a)" }}
                    >
                      <span>{rev.user_name}</span>
                      {rev.is_verified_purchase && (
                        <span className="inline-flex items-center gap-0.5 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <ShieldCheck className="w-3 h-3" /> Verified Buyer
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-slate-400">{formatDate(rev.created_at)}</span>
                  </div>
                </div>

                <div className="flex gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= rev.rating ? "fill-amber-400" : "text-slate-200 dark:text-slate-800"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {rev.title && (
                <h5 
                  className="text-xs font-extrabold"
                  style={{ color: "var(--theme-text-heading, #0f172a)" }}
                >
                  {rev.title}
                </h5>
              )}
              {rev.comment ? (
                <p 
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--theme-text-body, #475569)" }}
                >
                  {rev.comment}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Rated {rev.rating} out of 5 stars
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Review Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div 
            className="relative w-full max-w-lg rounded-3xl border p-6 sm:p-8 z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            style={{
              backgroundColor: "var(--theme-card-bg, #ffffff)",
              borderColor: "var(--theme-card-border, #e5e7eb)"
            }}
          >
            {/* Close Button X */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 
              className="text-lg font-black mb-1 pr-8 tracking-tight"
              style={{ color: "var(--theme-text-heading, #0f172a)" }}
            >
              Submit Rating &amp; Review
            </h3>
            <p 
              className="text-xs mb-5"
              style={{ color: "var(--theme-text-body, #475569)" }}
            >
              Select your star rating. Written feedback and headline are optional.
            </p>

            {successMsg ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p 
                  className="text-sm font-bold"
                  style={{ color: "var(--theme-text-heading, #0f172a)" }}
                >
                  {successMsg}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Rating Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label 
                      className="text-xs font-bold"
                      style={{ color: "var(--theme-text-heading, #0f172a)" }}
                    >
                      Rating Score <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs font-bold text-amber-500">{rating} of 5 Stars</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          s <= rating
                            ? "bg-amber-500/15 border-amber-500/50 text-amber-500"
                            : "border-gray-200 dark:border-white/10 text-slate-300 dark:text-slate-700"
                        }`}
                      >
                        <Star className={`w-5 h-5 ${s <= rating ? "fill-amber-400 text-amber-400" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {!isAuthenticated && (
                  <div>
                    <label 
                      className="text-xs font-bold block mb-1"
                      style={{ color: "var(--theme-text-heading, #0f172a)" }}
                    >
                      Your Name <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Alex Vance"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                      style={{ color: "var(--theme-text-heading, #0f172a)" }}
                    />
                  </div>
                )}

                <div>
                  <label 
                    className="text-xs font-bold block mb-1"
                    style={{ color: "var(--theme-text-heading, #0f172a)" }}
                  >
                    Review Headline <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Pure studio bliss, worth every penny"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                    style={{ color: "var(--theme-text-heading, #0f172a)" }}
                  />
                </div>

                <div>
                  <label 
                    className="text-xs font-bold block mb-1"
                    style={{ color: "var(--theme-text-heading, #0f172a)" }}
                  >
                    Your Experience <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Optional: What did you think of the ergonomics, acoustic soundstage, and tactile keys?"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3.5 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
                    style={{ color: "var(--theme-text-heading, #0f172a)" }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl theme-btn-primary text-xs font-extrabold uppercase tracking-wide transition-all shadow-md cursor-pointer"
                  >
                    {loading ? "Submitting..." : comment.trim() ? "Publish Review" : "Submit Rating"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
