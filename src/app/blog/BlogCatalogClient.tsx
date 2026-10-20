"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { BlogPost, BlogCategory } from "@/types";
import { formatDate } from "@/lib/utils";
import { 
  BookOpen, 
  Calendar, 
  User, 
  Eye, 
  Clock, 
  ArrowRight, 
  Search, 
  Loader2, 
  Sparkles,
  Tag 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogCatalogClient() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      try {
        const res = await api.getBlogPosts({
          page,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
        });
        setPosts(res.data || []);
        setTotalPages(res.last_page || 1);
      } catch (err) {
        console.error("Failed to load blog posts:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, [page, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-[75vh]">
      {/* Blog Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#005826]/10 dark:bg-amber-500/15 border border-[#005826]/20 dark:border-amber-500/30 text-[#005826] dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Editorial & Newsroom</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
          Hardware Stories & Guides
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">
          In-depth technical reviews, acoustic engineering, setup walkthroughs, and studio announcements.
        </p>
      </div>

      {/* Post Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#0f131f] p-4 space-y-3 shadow-2xs"
            >
              <Skeleton className="w-full aspect-video rounded-xl" />
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-5 w-4/5 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto text-gray-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No articles published yet</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
            Check back soon for new hardware reviews, design stories, and audio engineering guides.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col rounded-2xl bg-white dark:bg-[#0e121e] border border-gray-200 dark:border-white/10 overflow-hidden hover:border-[#005826]/40 dark:hover:border-amber-400/40 transition-all hover:shadow-lg duration-200"
            >
              {/* Featured Image */}
              <Link href={`/blog/${post.slug}`} className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-black/40">
                {post.featured_image ? (
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#005826]/10 to-teal-500/10 text-[#005826] dark:text-amber-400">
                    <BookOpen className="w-10 h-10 opacity-30" />
                  </div>
                )}
                {post.category && (
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                    {post.category.name}
                  </span>
                )}
              </Link>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.published_at || post.created_at)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {post.views_count || 0} views
                    </span>
                  </div>

                  <Link href={`/blog/${post.slug}`}>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-[#005826] dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                  </Link>

                  {post.excerpt && (
                    <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                </div>

                {/* Footer: Author & Read Link */}
                <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300 font-medium">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>{post.author?.name || "Editorial Staff"}</span>
                  </div>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex items-center gap-1 font-bold text-[#005826] dark:text-amber-400 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-slate-300 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500 dark:text-slate-400 font-medium px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-slate-300 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
