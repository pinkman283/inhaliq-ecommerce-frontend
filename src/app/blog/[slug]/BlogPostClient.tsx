"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { BlogPost } from "@/types";
import { formatDate } from "@/lib/utils";
import { 
  BookOpen, 
  Calendar, 
  User, 
  Eye, 
  ArrowLeft, 
  Loader2, 
  MessageSquare, 
  Send, 
  Tag, 
  CheckCircle2, 
  Share2 
} from "lucide-react";
import { toast } from "sonner";

interface BlogPostClientProps {
  slug: string;
}

export default function BlogPostClient({ slug }: BlogPostClientProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Comment Form State
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSubmitted, setCommentSubmitted] = useState(false);

  useEffect(() => {
    if (!slug) return;

    async function loadPost() {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await api.getBlogPost(slug);
        setPost(data);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [slug]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    setSubmittingComment(true);
    try {
      await api.submitBlogComment(post.id, {
        author_name: authorName.trim(),
        author_email: authorEmail.trim(),
        comment: commentText.trim(),
      });
      setCommentSubmitted(true);
      setAuthorName("");
      setAuthorEmail("");
      setCommentText("");
      toast.success("Your comment has been submitted for moderation.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit comment. Please try again.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Article link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-3 text-slate-500 min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#005826] dark:text-amber-400 animate-spin" />
        <span className="text-xs uppercase tracking-wider font-semibold">Loading article...</span>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Article Not Found</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          The requested article <span className="font-mono text-xs">"{slug}"</span> does not exist or has been unpublished.
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 font-semibold text-xs transition hover:bg-gray-800 dark:hover:bg-gray-100 shadow-xs mt-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Articles
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-[75vh]">
      {/* Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-4 text-xs">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Blog
        </Link>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Article</span>
        </button>
      </div>

      {/* Article Header */}
      <header className="space-y-4">
        {post.category && (
          <span className="inline-block px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold uppercase tracking-wider">
            {post.category.name}
          </span>
        )}

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
            {post.excerpt}
          </p>
        )}

        {/* Metadata Strip */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold">
            <User className="w-4 h-4 text-gray-400" />
            <span>{post.author?.name || "Editorial Staff"}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(post.published_at || post.created_at)}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>{post.views_count || 0} views</span>
          </div>
        </div>
      </header>

      {/* Featured Banner Image */}
      {post.featured_image && (
        <div className="rounded-2xl overflow-hidden aspect-video w-full bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 shadow-sm">
          <img
            src={post.featured_image}
            alt={post.featured_image_alt || post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content Body */}
      <div 
        className="prose prose-slate dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed text-gray-800 dark:text-slate-200 space-y-5"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-gray-200 dark:border-white/10">
          <Tag className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-slate-400 font-semibold mr-1">Tags:</span>
          {post.tags.map((tag) => (
            <span
              key={tag.id}
              className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-slate-300 text-xs font-medium"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Comments Section */}
      <section className="pt-10 border-t border-gray-200 dark:border-white/10 space-y-8">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#005826] dark:text-amber-400" />
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Discussion ({post.comments?.length || 0})
          </h2>
        </div>

        {/* Existing Approved Comments */}
        {post.comments && post.comments.length > 0 ? (
          <div className="space-y-4">
            {post.comments.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-900 dark:text-white">{c.author_name}</span>
                  <span className="text-gray-400 text-[11px] font-mono">{formatDate(c.created_at)}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                  {c.comment}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 dark:text-slate-400 italic">
            No public comments yet. Be the first to share your perspective below.
          </p>
        )}

        {/* Comment Submission Form */}
        <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#0e121e] border border-gray-200 dark:border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Leave a Response</h3>

          {commentSubmitted ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Thank you! Your comment has been received and will appear once approved by our moderation team.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitComment} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block">Your Name</label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-[#005826] dark:focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block">Email Address (Private)</label>
                  <input
                    type="email"
                    required
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-[#005826] dark:focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block">Comment</label>
                <textarea
                  required
                  rows={4}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts or technical question..."
                  className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#005826] dark:focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={submittingComment}
                className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 hover:bg-gray-800 dark:hover:bg-gray-100 font-semibold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingComment ? "Posting..." : "Post Comment"}</span>
              </button>
            </form>
          )}
        </div>
      </section>
    </article>
  );
}
