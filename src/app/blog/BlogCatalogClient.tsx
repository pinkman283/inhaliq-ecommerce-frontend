"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  X,
  Sparkles,
  Tag 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogCatalogClient() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  // Load categories once
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await api.getBlogCategories();
        if (Array.isArray(cats)) {
          const validCats = cats.filter(c => c.posts_count === undefined || c.posts_count > 0);
          setCategories(validCats);
        }
      } catch (err) {
        console.warn("Could not load categories:", err);
      }
    }
    loadCategories();
  }, []);

  // Load posts whenever page, selectedCategory, or submittedSearch changes
  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      try {
        const res = await api.getBlogPosts({
          page,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          ...(submittedSearch ? { search: submittedSearch } as any : {}),
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
  }, [page, selectedCategory, submittedSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSubmittedSearch(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSubmittedSearch("");
    setPage(1);
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setSubmittedSearch("");
    setPage(1);
  };

  // Helper for reading time calculation
  const getReadingTime = (content?: string, excerpt?: string) => {
    const text = (content || "") + " " + (excerpt || "");
    const wordCount = text.replace(/<[^>]*>?/gm, "").split(/\s+/).filter(Boolean).length;
    return `${Math.max(2, Math.ceil(wordCount / 180))} min read`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 min-h-[75vh]">
      
      {/* Blog Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold tracking-wide uppercase border border-gray-200 dark:border-white/10">
          <BookOpen className="w-3.5 h-3.5" />
          <span>INHALIQ Journal</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Stories, Guides & Updates
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          In-depth product teardowns, battery care guides, flavor insights, and official announcements.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-white/10">
        
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => handleCategorySelect("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === "all"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-950 shadow-xs"
                : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            All Articles
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.slug
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-950 shadow-xs"
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Minimal Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white/20 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

      </div>

      {/* Post Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0e121e] p-4 space-y-4 shadow-xs"
            >
              <Skeleton className="w-full aspect-[16/10] rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-5 w-4/5 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto text-gray-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">No articles found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {submittedSearch || selectedCategory !== "all"
                ? "No published articles matched your search or category filter."
                : "Check back soon for new guides, technical stories, and store updates."}
            </p>
          </div>
          {(submittedSearch || selectedCategory !== "all") && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col rounded-2xl bg-white dark:bg-[#0e121e] border border-gray-200 dark:border-white/10 overflow-hidden hover:border-gray-400 dark:hover:border-white/30 transition-all hover:shadow-md duration-200"
            >
              {/* Featured Image */}
              <Link
                href={`/blog/${post.slug}`}
                className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100 dark:bg-black/40 block"
              >
                {post.featured_image ? (
                  <img
                    src={post.featured_image}
                    alt={post.featured_image_alt || post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-400">
                    <BookOpen className="w-8 h-8 opacity-40" />
                  </div>
                )}
                {post.category && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[10px] font-semibold tracking-wide uppercase">
                    {post.category.name}
                  </span>
                )}
              </Link>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  
                  {/* Meta strip: Date & Reading Time */}
                  <div className="flex items-center gap-2.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {formatDate(post.published_at || post.created_at)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {getReadingTime(post.content, post.excerpt || "")}
                    </span>
                  </div>

                  {/* Title */}
                  <Link href={`/blog/${post.slug}`}>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h2>
                  </Link>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                </div>

                {/* Footer: Author & Read Link */}
                <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>{post.author?.name || "Editorial Staff"}</span>
                  </div>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
            className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 transition cursor-pointer"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 transition cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
}
