"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  FileText,
  FolderTree,
  Tag,
  MessageSquare,
  Eye,
  Plus,
  Search,
  Edit,
  Trash2,
  Check,
  X,
  Loader2,
  Calendar,
  User,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
  SlidersHorizontal,
  Mail,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Hash,
  Upload,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Link2,
  Code,
  List,
  Quote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { BlogPost, BlogCategory, BlogTag, BlogComment, BlogSummary } from "@/types";
import { blogService } from "@/services/blogService";
import { optimizeUploadFile } from "@/lib/imageOptimizer";
import {
  AdminPageHeader,
  AdminStatStrip,
  AdminStatusBadge,
  AdminEmptyState,
  AdminPagination,
} from "@/components/admin/ui";
import { SettingsNavTabs } from "@/components/admin/settings/SettingsNavTabs";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { toast } from "sonner";

type TabType = "posts" | "categories" | "tags" | "comments";

function AdminContentBlogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab State
  const tabParam = searchParams.get("tab") as TabType | null;
  const initialTab: TabType =
    tabParam && ["posts", "categories", "tags", "comments"].includes(tabParam)
      ? tabParam
      : "posts";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Bulk Selection States
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);
  const [isBulkDeletingPosts, setIsBulkDeletingPosts] = useState(false);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [isBulkDeletingCategories, setIsBulkDeletingCategories] = useState(false);

  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isBulkDeletingTags, setIsBulkDeletingTags] = useState(false);

  const [selectedCommentIds, setSelectedCommentIds] = useState<number[]>([]);
  const [isBulkDeletingComments, setIsBulkDeletingComments] = useState(false);
  const [isBulkApprovingComments, setIsBulkApprovingComments] = useState(false);

  // Sync tab with URL
  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    setSelectedPostIds([]);
    setSelectedCategoryIds([]);
    setSelectedTagIds([]);
    setSelectedCommentIds([]);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    params.delete("edit");
    params.delete("create");
    router.replace(`/admin/content/blog?${params.toString()}`);
  };

  // Summary Metrics
  const [summary, setSummary] = useState<BlogSummary | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Common Taxonomies (cached for selectors)
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);

  // ==========================================
  // TAB 1: ARTICLES (POSTS) STATE
  // ==========================================
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postSearch, setPostSearch] = useState("");
  const [postStatusFilter, setPostStatusFilter] = useState("all");
  const [postCategoryFilter, setPostCategoryFilter] = useState("all");
  const [postCurrentPage, setPostCurrentPage] = useState(1);
  const [postTotalPages, setPostTotalPages] = useState(1);
  const [postTotalItems, setPostTotalItems] = useState(0);

  // Article Modal State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postTitle, setPostTitle] = useState("");
  const [postSlug, setPostSlug] = useState("");
  const [postExcerpt, setPostExcerpt] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState("");
  const [postImageAlt, setPostImageAlt] = useState("");
  const [postCategoryId, setPostCategoryId] = useState<string>("");
  const [postSelectedTags, setPostSelectedTags] = useState<number[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [postStatus, setPostStatus] = useState<"published" | "draft" | "archived">("draft");
  const [postMetaTitle, setPostMetaTitle] = useState("");
  const [postMetaDescription, setPostMetaDescription] = useState("");
  const [postSaving, setPostSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [previewContentMode, setPreviewContentMode] = useState(false);
  const [showSeoSection, setShowSeoSection] = useState(false);

  // Article Delete State
  const [deletingPost, setDeletingPost] = useState<BlogPost | null>(null);
  const [postDeleting, setPostDeleting] = useState(false);

  // ==========================================
  // TAB 2: CATEGORIES STATE
  // ==========================================
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catMetaTitle, setCatMetaTitle] = useState("");
  const [catMetaDescription, setCatMetaDescription] = useState("");
  const [catSaving, setCatSaving] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<BlogCategory | null>(null);
  const [catDeleting, setCatDeleting] = useState(false);
  const [showCatSeo, setShowCatSeo] = useState(false);

  // ==========================================
  // TAB 3: TAGS STATE
  // ==========================================
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null);
  const [tagName, setTagName] = useState("");
  const [tagSlug, setTagSlug] = useState("");
  const [tagSaving, setTagSaving] = useState(false);
  const [deletingTag, setDeletingTag] = useState<BlogTag | null>(null);
  const [tagDeleting, setTagDeleting] = useState(false);

  // ==========================================
  // TAB 4: COMMENTS STATE
  // ==========================================
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSearch, setCommentSearch] = useState("");
  const [commentApprovalFilter, setCommentApprovalFilter] = useState("all");
  const [commentCurrentPage, setCommentCurrentPage] = useState(1);
  const [commentTotalPages, setCommentTotalPages] = useState(1);
  const [commentTotalItems, setCommentTotalItems] = useState(0);
  const [deletingComment, setDeletingComment] = useState<BlogComment | null>(null);
  const [commentDeleting, setCommentDeleting] = useState(false);

  // ==========================================
  // INITIAL DATA FETCHERS
  // ==========================================
  const fetchSummary = useCallback(async () => {
    try {
      const data = await blogService.getSummary();
      setSummary(data);
    } catch {
      // Non-blocking summary load
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const fetchTaxonomies = useCallback(async () => {
    try {
      const [cats, tgs] = await Promise.all([
        blogService.getCategories(),
        blogService.getTags(),
      ]);
      setCategories(cats || []);
      setTags(tgs || []);
    } catch {
      // Non-blocking
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const res = await blogService.getPosts({
        page: postCurrentPage,
        search: postSearch || undefined,
        status: postStatusFilter !== "all" ? postStatusFilter : undefined,
        category_id: postCategoryFilter !== "all" ? Number(postCategoryFilter) : undefined,
      });
      setPosts(res.data || []);
      setPostTotalPages(res.last_page || 1);
      setPostTotalItems(res.total || 0);
    } catch {
      toast.error("Failed to load blog articles.");
    } finally {
      setPostsLoading(false);
    }
  }, [postCurrentPage, postSearch, postStatusFilter, postCategoryFilter]);

  const fetchCategoriesList = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const data = await blogService.getCategories();
      setCategories(data || []);
    } catch {
      toast.error("Failed to load blog categories.");
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const fetchTagsList = useCallback(async () => {
    setTagsLoading(true);
    try {
      const data = await blogService.getTags();
      setTags(data || []);
    } catch {
      toast.error("Failed to load blog tags.");
    } finally {
      setTagsLoading(false);
    }
  }, []);

  const fetchComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const res = await blogService.getComments({
        page: commentCurrentPage,
        search: commentSearch || undefined,
        is_approved:
          commentApprovalFilter === "all"
            ? undefined
            : commentApprovalFilter === "approved",
      });
      setComments(res.data || []);
      setCommentTotalPages(res.last_page || 1);
      setCommentTotalItems(res.total || 0);
    } catch {
      toast.error("Failed to load reader comments.");
    } finally {
      setCommentsLoading(false);
    }
  }, [commentCurrentPage, commentSearch, commentApprovalFilter]);

  // Initial load
  useEffect(() => {
    fetchSummary();
    fetchTaxonomies();
  }, [fetchSummary, fetchTaxonomies]);

  // Tab-dependent load
  useEffect(() => {
    if (activeTab === "posts") {
      fetchPosts();
    } else if (activeTab === "categories") {
      fetchCategoriesList();
    } else if (activeTab === "tags") {
      fetchTagsList();
    } else if (activeTab === "comments") {
      fetchComments();
    }
  }, [activeTab, fetchPosts, fetchCategoriesList, fetchTagsList, fetchComments]);

  // Handle URL query parameters for deep linking (?edit=ID or ?create=true)
  useEffect(() => {
    const editId = searchParams.get("edit");
    const createParam = searchParams.get("create");

    if (editId) {
      const idNum = Number(editId);
      if (!isNaN(idNum) && idNum > 0) {
        blogService
          .getPost(idNum)
          .then((post) => {
            handleOpenEditPost(post);
          })
          .catch(() => {
            toast.error("Could not find article to edit.");
          });
      }
    } else if (createParam === "true") {
      if (activeTab === "categories") {
        handleOpenCreateCategory();
      } else if (activeTab === "tags") {
        handleOpenCreateTag();
      } else {
        handleOpenCreatePost();
      }
    }
  }, [searchParams]);

  // ==========================================
  // ARTICLE ACTIONS
  // ==========================================
  const handleOpenCreatePost = () => {
    setEditingPost(null);
    setPostTitle("");
    setPostSlug("");
    setPostExcerpt("");
    setPostContent("");
    setPostImage("");
    setPostImageAlt("");
    setPostCategoryId(categories[0]?.id ? String(categories[0].id) : "");
    setPostSelectedTags([]);
    setNewTagInput("");
    setPostStatus("draft");
    setPostMetaTitle("");
    setPostMetaDescription("");
    setPreviewContentMode(false);
    setShowSeoSection(false);
    setIsPostModalOpen(true);
  };

  const handleOpenEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setPostTitle(post.title);
    setPostSlug(post.slug);
    setPostExcerpt(post.excerpt || "");
    setPostContent(post.content);
    setPostImage(post.featured_image || "");
    setPostImageAlt(post.featured_image_alt || "");
    setPostCategoryId(post.category_id ? String(post.category_id) : "");
    setPostSelectedTags(post.tags?.map((t) => t.id) || []);
    setNewTagInput("");
    setPostStatus(post.status);
    setPostMetaTitle(post.meta_title || "");
    setPostMetaDescription(post.meta_description || "");
    setPreviewContentMode(false);
    setShowSeoSection(Boolean(post.meta_title || post.meta_description));
    setIsPostModalOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) {
      toast.error("Article title is required.");
      return;
    }
    if (!postContent.trim()) {
      toast.error("Article content is required.");
      return;
    }

    setPostSaving(true);
    try {
      const payload = {
        title: postTitle.trim(),
        slug: postSlug.trim() || undefined,
        excerpt: postExcerpt.trim() || null,
        content: postContent,
        featured_image: postImage.trim() || null,
        featured_image_alt: postImageAlt.trim() || null,
        category_id: postCategoryId ? Number(postCategoryId) : null,
        status: postStatus,
        tag_ids: postSelectedTags,
        meta_title: postMetaTitle.trim() || null,
        meta_description: postMetaDescription.trim() || null,
      };

      if (editingPost) {
        await blogService.updatePost(editingPost.id, payload);
        toast.success(`Article "${postTitle}" updated successfully.`);
      } else {
        await blogService.createPost(payload);
        toast.success(`Article "${postTitle}" published/saved.`);
      }
      setIsPostModalOpen(false);
      fetchPosts();
      fetchSummary();
      fetchTaxonomies();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save article.";
      toast.error(msg);
    } finally {
      setPostSaving(false);
    }
  };

  const handleTogglePostStatus = async (post: BlogPost) => {
    try {
      const res = await blogService.togglePostStatus(post.id);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: res.post.status } : p))
      );
      toast.success(res.message);
      fetchSummary();
    } catch {
      toast.error("Failed to toggle article status.");
    }
  };

  const handleDeletePost = async () => {
    if (!deletingPost) return;
    setPostDeleting(true);
    try {
      await blogService.deletePost(deletingPost.id);
      toast.success(`Article "${deletingPost.title}" deleted.`);
      setDeletingPost(null);
      fetchPosts();
      fetchSummary();
    } catch {
      toast.error("Failed to delete article.");
    } finally {
      setPostDeleting(false);
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image file size must be under 20MB.");
      return;
    }

    setImageUploading(true);
    try {
      const optimizedFile = await optimizeUploadFile(file, { profile: "banner", label: "Featured blog image" });
      const res = await blogService.uploadBlogImage(optimizedFile);
      setPostImage(res.image_url);
      toast.success("Featured image uploaded.", {
        description: optimizedFile.reductionText ? `Optimized: ${optimizedFile.reductionText}` : undefined,
      });
    } catch {
      toast.error("Failed to upload image. You can also paste an image URL directly.");
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  };

  const toggleTagSelection = (tagId: number) => {
    setPostSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateAndSelectTag = async (rawInput?: string) => {
    const raw = (rawInput ?? newTagInput).trim();
    if (!raw) return;

    // Strip leading hash symbols or commas
    const cleaned = raw.replace(/^[#,\s]+|[,\s]+$/g, "").trim();
    if (!cleaned) return;

    // Check if tag already exists in loaded tags (case-insensitive)
    const existing = tags.find(
      (t) => t.name.toLowerCase() === cleaned.toLowerCase()
    );

    if (existing) {
      if (!postSelectedTags.includes(existing.id)) {
        setPostSelectedTags((prev) => [...prev, existing.id]);
      }
      setNewTagInput("");
      return;
    }

    // Tag does not exist yet - create dynamically on server
    setCreatingTag(true);
    try {
      const res = await blogService.createTag({
        name: cleaned,
      });
      if (res && res.tag) {
        setTags((prev) => [...prev, res.tag]);
        setPostSelectedTags((prev) => [...prev, res.tag.id]);
        toast.success(`Tag "${res.tag.name}" created and added`);
      }
      setNewTagInput("");
    } catch (err: any) {
      const msg = err?.response?.data?.message || `Failed to create tag "${cleaned}".`;
      toast.error(msg);
    } finally {
      setCreatingTag(false);
    }
  };

  const insertMarkdownFormatting = (prefix: string, suffix = "") => {
    const textarea = document.getElementById("blog-content-textarea") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selected = current.substring(start, end);

    const replacement = `${prefix}${selected || "text"}${suffix}`;
    const nextVal = current.substring(0, start) + replacement + current.substring(end);
    setPostContent(nextVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected ? selected.length : 4)
      );
    }, 50);
  };

  // ==========================================
  // CATEGORY ACTIONS
  // ==========================================
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCatName("");
    setCatSlug("");
    setCatDescription("");
    setCatMetaTitle("");
    setCatMetaDescription("");
    setShowCatSeo(false);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: BlogCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDescription(cat.description || "");
    setCatMetaTitle(cat.meta_title || "");
    setCatMetaDescription(cat.meta_description || "");
    setShowCatSeo(Boolean(cat.meta_title || cat.meta_description));
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setCatSaving(true);
    try {
      const payload = {
        name: catName.trim(),
        slug: catSlug.trim() || undefined,
        description: catDescription.trim() || null,
        meta_title: catMetaTitle.trim() || null,
        meta_description: catMetaDescription.trim() || null,
      };

      if (editingCategory) {
        await blogService.updateCategory(editingCategory.id, payload);
        toast.success(`Category "${catName}" updated.`);
      } else {
        await blogService.createCategory(payload);
        toast.success(`Category "${catName}" created.`);
      }
      setIsCategoryModalOpen(false);
      fetchCategoriesList();
      fetchTaxonomies();
      fetchSummary();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save category.";
      toast.error(msg);
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setCatDeleting(true);
    try {
      await blogService.deleteCategory(deletingCategory.id);
      toast.success(`Category "${deletingCategory.name}" deleted.`);
      setDeletingCategory(null);
      fetchCategoriesList();
      fetchTaxonomies();
      fetchSummary();
    } catch {
      toast.error("Failed to delete category.");
    } finally {
      setCatDeleting(false);
    }
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
        c.slug.toLowerCase().includes(categorySearch.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(categorySearch.toLowerCase()))
    );
  }, [categories, categorySearch]);

  // ==========================================
  // TAG ACTIONS
  // ==========================================
  const handleOpenCreateTag = () => {
    setEditingTag(null);
    setTagName("");
    setTagSlug("");
    setIsTagModalOpen(true);
  };

  const handleOpenEditTag = (tag: BlogTag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagSlug(tag.slug);
    setIsTagModalOpen(true);
  };

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) {
      toast.error("Tag name is required.");
      return;
    }

    setTagSaving(true);
    try {
      const payload = {
        name: tagName.trim(),
        slug: tagSlug.trim() || undefined,
      };

      if (editingTag) {
        await blogService.updateTag(editingTag.id, payload);
        toast.success(`Tag "#${tagName}" updated.`);
      } else {
        await blogService.createTag(payload);
        toast.success(`Tag "#${tagName}" created.`);
      }
      setIsTagModalOpen(false);
      fetchTagsList();
      fetchTaxonomies();
      fetchSummary();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save tag.";
      toast.error(msg);
    } finally {
      setTagSaving(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTag) return;
    setTagDeleting(true);
    try {
      await blogService.deleteTag(deletingTag.id);
      toast.success(`Tag "#${deletingTag.name}" deleted.`);
      setDeletingTag(null);
      fetchTagsList();
      fetchTaxonomies();
      fetchSummary();
    } catch {
      toast.error("Failed to delete tag.");
    } finally {
      setTagDeleting(false);
    }
  };

  const filteredTags = useMemo(() => {
    return tags.filter(
      (t) =>
        t.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
        t.slug.toLowerCase().includes(tagSearch.toLowerCase())
    );
  }, [tags, tagSearch]);

  // ==========================================
  // COMMENT ACTIONS
  // ==========================================
  const handleToggleCommentApproval = async (comment: BlogComment) => {
    try {
      const res = await blogService.toggleCommentApproval(comment.id);
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id ? { ...c, is_approved: res.comment.is_approved } : c
        )
      );
      toast.success(res.message);
      fetchSummary();
    } catch {
      toast.error("Failed to update comment moderation.");
    }
  };

  const handleDeleteComment = async () => {
    if (!deletingComment) return;
    setCommentDeleting(true);
    try {
      await blogService.deleteComment(deletingComment.id);
      toast.success("Comment deleted.");
      setDeletingComment(null);
      fetchComments();
      fetchSummary();
    } catch {
      toast.error("Failed to delete comment.");
    } finally {
      setCommentDeleting(false);
    }
  };

  // Bulk Selection Handlers
  const handleSelectAllPosts = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPostIds(posts.map((p) => p.id));
    } else {
      setSelectedPostIds([]);
    }
  };

  const handleToggleSelectPost = (id: number) => {
    setSelectedPostIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeletePosts = async () => {
    if (selectedPostIds.length === 0) return;
    setIsBulkDeletingPosts(true);
    try {
      await blogService.bulkDeletePosts(selectedPostIds);
      toast.success(`Deleted ${selectedPostIds.length} article(s).`);
      setSelectedPostIds([]);
      fetchPosts();
      fetchSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete selected articles.");
    } finally {
      setIsBulkDeletingPosts(false);
    }
  };

  const handleSelectAllCategories = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCategoryIds(filteredCategories.map((c) => c.id));
    } else {
      setSelectedCategoryIds([]);
    }
  };

  const handleToggleSelectCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteCategories = async () => {
    if (selectedCategoryIds.length === 0) return;
    setIsBulkDeletingCategories(true);
    try {
      await blogService.bulkDeleteCategories(selectedCategoryIds);
      toast.success(`Deleted ${selectedCategoryIds.length} category/categories.`);
      setSelectedCategoryIds([]);
      fetchCategoriesList();
      fetchSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete selected categories.");
    } finally {
      setIsBulkDeletingCategories(false);
    }
  };

  const handleSelectAllTags = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTagIds(filteredTags.map((t) => t.id));
    } else {
      setSelectedTagIds([]);
    }
  };

  const handleToggleSelectTag = (id: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteTags = async () => {
    if (selectedTagIds.length === 0) return;
    setIsBulkDeletingTags(true);
    try {
      await blogService.bulkDeleteTags(selectedTagIds);
      toast.success(`Deleted ${selectedTagIds.length} tag(s).`);
      setSelectedTagIds([]);
      fetchTagsList();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete selected tags.");
    } finally {
      setIsBulkDeletingTags(false);
    }
  };

  const handleSelectAllComments = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCommentIds(comments.map((c) => c.id));
    } else {
      setSelectedCommentIds([]);
    }
  };

  const handleToggleSelectComment = (id: number) => {
    setSelectedCommentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteComments = async () => {
    if (selectedCommentIds.length === 0) return;
    setIsBulkDeletingComments(true);
    try {
      await blogService.bulkDeleteComments(selectedCommentIds);
      toast.success(`Deleted ${selectedCommentIds.length} comment(s).`);
      setSelectedCommentIds([]);
      fetchComments();
      fetchSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete selected comments.");
    } finally {
      setIsBulkDeletingComments(false);
    }
  };

  const handleBulkApproveComments = async () => {
    if (selectedCommentIds.length === 0) return;
    setIsBulkApprovingComments(true);
    try {
      await blogService.bulkApproveComments(selectedCommentIds);
      toast.success(`Approved ${selectedCommentIds.length} comment(s).`);
      setSelectedCommentIds([]);
      fetchComments();
      fetchSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve selected comments.");
    } finally {
      setIsBulkApprovingComments(false);
    }
  };

  const totalCatArticles = useMemo(
    () => categories.reduce((sum, c) => sum + (c.posts_count || 0), 0),
    [categories]
  );
  const totalTagLinks = useMemo(
    () => tags.reduce((sum, t) => sum + (t.posts_count || 0), 0),
    [tags]
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Unified Context Navigation across Content & Settings */}
      <SettingsNavTabs />

      {/* Header */}
      <AdminPageHeader
        title="Editorial & Blog Studio"
        description="Write long-form articles, organize topic categories, maintain keyword tags, and moderate reader comments."
        badge="Content CMS"
        badgeVariant="cyan"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Content / CMS", href: "/admin/content/theme" },
          { label: "Blog" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#161a26] hover:bg-white/[0.08] border border-white/[0.08] rounded-md transition-colors cursor-pointer"
              title="Open storefront blog"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Storefront Blog</span>
            </Link>

            {activeTab === "posts" && (
              <button
                onClick={handleOpenCreatePost}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#090B10] bg-[#A78BFA] hover:bg-[#B9A3FF] rounded-md transition-colors cursor-pointer shadow-sm font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Write Article</span>
              </button>
            )}

            {activeTab === "categories" && (
              <button
                onClick={handleOpenCreateCategory}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            )}

            {activeTab === "tags" && (
              <button
                onClick={handleOpenCreateTag}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Tag</span>
              </button>
            )}
          </div>
        }
      />

      {/* Primary Metrics Strip */}
      <AdminStatStrip
        columns={4}
        stats={[
          {
            label: "Total Articles",
            value: summary?.metrics.total_posts ?? 0,
            icon: FileText,
            variant: "cyan",
            helper: `${summary?.metrics.published_posts ?? 0} published, ${
              summary?.metrics.draft_posts ?? 0
            } drafts`,
          },
          {
            label: "Total Article Views",
            value: (summary?.metrics.total_views ?? 0).toLocaleString(),
            icon: Eye,
            variant: "emerald",
            helper: "Across all published stories",
          },
          {
            label: "Reader Comments",
            value: summary?.metrics.total_comments ?? 0,
            icon: MessageSquare,
            variant: (summary?.metrics.pending_comments ?? 0) > 0 ? "amber" : "purple",
            helper:
              (summary?.metrics.pending_comments ?? 0) > 0
                ? `${summary?.metrics.pending_comments} pending approval`
                : "All comments reviewed",
          },
          {
            label: "Taxonomy Index",
            value: `${summary?.metrics.total_categories ?? categories.length} / ${
              summary?.metrics.total_tags ?? tags.length
            }`,
            icon: FolderTree,
            variant: "amber",
            helper: "Categories / Active tags",
          },
        ]}
      />

      {/* Internal Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleTabChange("posts")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
            activeTab === "posts"
              ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Articles</span>
          {summary && (
            <span className="text-[10px] bg-white/[0.08] px-1.5 py-0.5 rounded text-slate-300 font-mono">
              {summary.metrics.total_posts}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange("categories")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
            activeTab === "categories"
              ? "bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Categories</span>
          <span className="text-[10px] bg-white/[0.08] px-1.5 py-0.5 rounded text-slate-300 font-mono">
            {categories.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange("tags")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
            activeTab === "tags"
              ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Keyword Tags</span>
          <span className="text-[10px] bg-white/[0.08] px-1.5 py-0.5 rounded text-slate-300 font-mono">
            {tags.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange("comments")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-md transition-all cursor-pointer relative ${
            activeTab === "comments"
              ? "bg-purple-400/15 text-purple-300 border border-purple-400/30 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Comments</span>
          {(summary?.metrics.pending_comments ?? 0) > 0 ? (
            <span className="text-[10px] bg-amber-500 text-black font-extrabold px-1.5 py-0.2 rounded animate-pulse">
              {summary?.metrics.pending_comments}
            </span>
          ) : (
            <span className="text-[10px] bg-white/[0.08] px-1.5 py-0.5 rounded text-slate-300 font-mono">
              {summary?.metrics.total_comments ?? 0}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ARTICLES (POSTS) */}
      {/* ========================================================================= */}
      {activeTab === "posts" && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-md bg-[#0f121b] border border-white/[0.08]">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles by title or summary..."
                value={postSearch}
                onChange={(e) => {
                  setPostSearch(e.target.value);
                  setPostCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#161a26] border border-white/[0.08] rounded-md text-white placeholder:text-slate-500 focus:outline-hidden focus:border-[#A78BFA]/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-[#161a26] border border-white/[0.08] px-2.5 py-1.5 rounded-md text-xs text-slate-300">
                <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
                <select
                  value={postCategoryFilter}
                  onChange={(e) => {
                    setPostCategoryFilter(e.target.value);
                    setPostCurrentPage(1);
                  }}
                  className="bg-transparent text-xs text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="all" className="bg-[#161a26] text-white">
                    All Categories
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#161a26] text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-[#161a26] border border-white/[0.08] px-2.5 py-1.5 rounded-md text-xs text-slate-300">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#A78BFA]" />
                <select
                  value={postStatusFilter}
                  onChange={(e) => {
                    setPostStatusFilter(e.target.value);
                    setPostCurrentPage(1);
                  }}
                  className="bg-transparent text-xs text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="all" className="bg-[#161a26] text-white">
                    All Statuses
                  </option>
                  <option value="published" className="bg-[#161a26] text-white">
                    Published
                  </option>
                  <option value="draft" className="bg-[#161a26] text-white">
                    Drafts
                  </option>
                  <option value="archived" className="bg-[#161a26] text-white">
                    Archived
                  </option>
                </select>
              </div>

              <button
                onClick={fetchPosts}
                disabled={postsLoading}
                className="p-2 text-slate-400 hover:text-white bg-[#161a26] hover:bg-white/[0.08] border border-white/[0.08] rounded-md transition-colors cursor-pointer"
                title="Refresh article list"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${postsLoading ? "animate-spin text-[#A78BFA]" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Posts Table */}
          <div className="rounded-md bg-[#0f121b] border border-white/[0.08] overflow-hidden">
            {postsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="w-7 h-7 text-[#A78BFA] animate-spin" />
                <span className="text-xs uppercase tracking-wider font-semibold">
                  Loading articles...
                </span>
              </div>
            ) : posts.length === 0 ? (
              <div className="p-8">
                <AdminEmptyState
                  title="No Articles Found"
                  description={
                    postSearch || postStatusFilter !== "all" || postCategoryFilter !== "all"
                      ? "No articles match the current search filters."
                      : "Start writing hardware stories, acoustic teardowns, and engineering logs."
                  }
                  action={
                    <button
                      onClick={handleOpenCreatePost}
                      className="px-4 py-2 text-xs font-semibold text-[#090B10] bg-[#A78BFA] hover:bg-[#B9A3FF] rounded-md transition-colors cursor-pointer font-bold"
                    >
                      + Write New Article
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 min-w-[1020px]">
                  <thead className="bg-[#161a26] text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/[0.08]">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">
                        <AdminCheckbox
                          checked={posts.length > 0 && selectedPostIds.length === posts.length}
                          indeterminate={selectedPostIds.length > 0 && selectedPostIds.length < posts.length}
                          onChange={handleSelectAllPosts}
                          title="Select all articles"
                        />
                      </th>
                      <th className="py-3 px-4 w-[340px]">Article</th>
                      <th className="py-3 px-4 w-[160px]">Category</th>
                      <th className="py-3 px-4 w-[160px]">Tags</th>
                      <th className="py-3 px-4 w-[120px]">Author</th>
                      <th className="py-3 px-4 w-[80px]">Views</th>
                      <th className="py-3 px-4 w-[90px]">Comments</th>
                      <th className="py-3 px-4 w-[110px]">Status</th>
                      <th className="py-3 px-4 text-right w-[100px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {posts.map((post) => (
                      <tr
                        key={post.id}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          selectedPostIds.includes(post.id) ? "bg-[#A78BFA]/[0.05]" : ""
                        }`}
                      >
                        <td className="py-3.5 px-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                          <AdminCheckbox
                            checked={selectedPostIds.includes(post.id)}
                            onChange={() => handleToggleSelectPost(post.id)}
                            title={`Select ${post.title}`}
                          />
                        </td>
                        {/* Article Info */}
                        <td className="py-3.5 px-4 w-[340px] max-w-[340px]">
                          <div className="flex items-center gap-3">
                            {post.featured_image ? (
                              <img
                                src={post.featured_image}
                                alt={post.featured_image_alt || post.title}
                                className="w-12 h-12 rounded-md object-cover border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-500 shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <button
                                onClick={() => handleOpenEditPost(post)}
                                className="font-bold text-white hover:text-[#A78BFA] transition-colors block truncate w-full text-left cursor-pointer"
                                title={post.title}
                              >
                                {post.title}
                              </button>
                              <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 truncate pt-0.5">
                                <span className="truncate">/{post.slug}</span>
                                {post.status === "published" && (
                                  <Link
                                    href={`/blog/${post.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-400 hover:underline inline-flex items-center gap-0.5 shrink-0"
                                    title="View live post"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {post.category ? (
                            <span className="text-[11px] font-medium text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                              {post.category.name}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Uncategorized</span>
                          )}
                        </td>

                        {/* Tags */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {post.tags && post.tags.length > 0 ? (
                              post.tags.slice(0, 3).map((t) => (
                                <span
                                  key={t.id}
                                  className="text-[10px] bg-white/[0.04] text-slate-400 px-1.5 py-0.5 rounded border border-white/[0.06]"
                                >
                                  #{t.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-600">—</span>
                            )}
                            {post.tags && post.tags.length > 3 && (
                              <span className="text-[10px] text-slate-500">
                                +{post.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Author */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>{post.author?.name || "Team Staff"}</span>
                          </div>
                        </td>

                        {/* Views */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-300">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span>{(post.views_count ?? 0).toLocaleString()}</span>
                          </div>
                        </td>

                        {/* Comments */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-300">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-slate-500" />
                            <span>{post.comments_count ?? 0}</span>
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            onClick={() => handleTogglePostStatus(post)}
                            className="cursor-pointer"
                            title="Click to toggle status (Published / Draft)"
                          >
                            <AdminStatusBadge
                              status={post.status}
                              label={post.status.toUpperCase()}
                              size="sm"
                            />
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditPost(post)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer"
                              title="Edit Article"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingPost(post)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                              title="Delete Article"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {postTotalPages > 1 && (
              <div className="p-3.5 border-t border-white/[0.08]">
                <AdminPagination
                  currentPage={postCurrentPage}
                  totalPages={postTotalPages}
                  onPageChange={setPostCurrentPage}
                  totalItems={postTotalItems}
                  itemsPerPage={15}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CATEGORIES */}
      {/* ========================================================================= */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-md bg-[#0f121b] border border-white/[0.08]">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#161a26] border border-white/[0.08] rounded-md text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchCategoriesList}
                disabled={categoriesLoading}
                className="p-2 text-slate-400 hover:text-white bg-[#161a26] hover:bg-white/[0.08] border border-white/[0.08] rounded-md transition-colors cursor-pointer"
                title="Refresh categories"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    categoriesLoading ? "animate-spin text-cyan-400" : ""
                  }`}
                />
              </button>

              <button
                onClick={handleOpenCreateCategory}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>
          </div>

          {/* Categories Table */}
          <div className="rounded-md bg-[#0f121b] border border-white/[0.08] overflow-hidden">
            {categoriesLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                <span className="text-xs uppercase tracking-wider font-semibold">
                  Loading categories...
                </span>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-8">
                <AdminEmptyState
                  title="No Categories Found"
                  description={
                    categorySearch
                      ? "No categories matched your search query."
                      : "Create your first blog category to organize editorial topics."
                  }
                  action={
                    <button
                      onClick={handleOpenCreateCategory}
                      className="px-4 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors cursor-pointer"
                    >
                      + Add Category
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#161a26] text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/[0.08]">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">
                        <AdminCheckbox
                          checked={filteredCategories.length > 0 && selectedCategoryIds.length === filteredCategories.length}
                          indeterminate={selectedCategoryIds.length > 0 && selectedCategoryIds.length < filteredCategories.length}
                          onChange={handleSelectAllCategories}
                          title="Select all categories"
                        />
                      </th>
                      <th className="py-3 px-4">Category Name</th>
                      <th className="py-3 px-4">Slug</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">SEO Metadata</th>
                      <th className="py-3 px-4">Articles Count</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredCategories.map((cat) => (
                      <tr
                        key={cat.id}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          selectedCategoryIds.includes(cat.id) ? "bg-[#A78BFA]/[0.05]" : ""
                        }`}
                      >
                        <td className="py-3.5 px-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                          <AdminCheckbox
                            checked={selectedCategoryIds.includes(cat.id)}
                            onChange={() => handleToggleSelectCategory(cat.id)}
                            title={`Select ${cat.name}`}
                          />
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                              <FolderTree className="w-3.5 h-3.5" />
                            </div>
                            <span>{cat.name}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          /{cat.slug}
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 max-w-sm">
                          <span className="line-clamp-1">{cat.description || "—"}</span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {cat.meta_title || cat.meta_description ? (
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              Custom SEO Active
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600">Standard Fallback</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                          <span className="bg-white/[0.05] text-slate-300 px-2 py-0.5 rounded border border-white/[0.08]">
                            {cat.posts_count ?? 0} articles
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditCategory(cat)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingCategory(cat)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TAGS */}
      {/* ========================================================================= */}
      {activeTab === "tags" && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-md bg-[#0f121b] border border-white/[0.08]">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tags..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#161a26] border border-white/[0.08] rounded-md text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-400/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchTagsList}
                disabled={tagsLoading}
                className="p-2 text-slate-400 hover:text-white bg-[#161a26] hover:bg-white/[0.08] border border-white/[0.08] rounded-md transition-colors cursor-pointer"
                title="Refresh tags"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${tagsLoading ? "animate-spin text-emerald-400" : ""}`}
                />
              </button>

              <button
                onClick={handleOpenCreateTag}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tag</span>
              </button>
            </div>
          </div>

          {/* Tags Table */}
          <div className="rounded-md bg-[#0f121b] border border-white/[0.08] overflow-hidden">
            {tagsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
                <span className="text-xs uppercase tracking-wider font-semibold">
                  Loading tags...
                </span>
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="p-8">
                <AdminEmptyState
                  title="No Tags Found"
                  description={
                    tagSearch
                      ? "No tags matched your search query."
                      : "Create keyword tags to link articles and guide reader discovery."
                  }
                  action={
                    <button
                      onClick={handleOpenCreateTag}
                      className="px-4 py-2 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors cursor-pointer"
                    >
                      + Add Tag
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#161a26] text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/[0.08]">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">
                        <AdminCheckbox
                          checked={filteredTags.length > 0 && selectedTagIds.length === filteredTags.length}
                          indeterminate={selectedTagIds.length > 0 && selectedTagIds.length < filteredTags.length}
                          onChange={handleSelectAllTags}
                          title="Select all tags"
                        />
                      </th>
                      <th className="py-3 px-4">Tag</th>
                      <th className="py-3 px-4">Slug</th>
                      <th className="py-3 px-4">Articles Linked</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredTags.map((t) => (
                      <tr
                        key={t.id}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          selectedTagIds.includes(t.id) ? "bg-[#A78BFA]/[0.05]" : ""
                        }`}
                      >
                        <td className="py-3.5 px-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                          <AdminCheckbox
                            checked={selectedTagIds.includes(t.id)}
                            onChange={() => handleToggleSelectTag(t.id)}
                            title={`Select #${t.name}`}
                          />
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                              <Tag className="w-3 h-3" />
                            </div>
                            <span className="font-mono text-emerald-400">#{t.name}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          /{t.slug}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                          <span className="bg-white/[0.05] text-slate-300 px-2 py-0.5 rounded border border-white/[0.08]">
                            {t.posts_count ?? 0} articles
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditTag(t)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer"
                              title="Edit Tag"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingTag(t)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                              title="Delete Tag"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COMMENTS / MODERATION */}
      {/* ========================================================================= */}
      {activeTab === "comments" && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-md bg-[#0f121b] border border-white/[0.08]">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search comment text, author, email..."
                value={commentSearch}
                onChange={(e) => {
                  setCommentSearch(e.target.value);
                  setCommentCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#161a26] border border-white/[0.08] rounded-md text-white placeholder:text-slate-500 focus:outline-hidden focus:border-purple-400/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 bg-[#161a26] border border-white/[0.08] px-2.5 py-1.5 rounded-md text-xs text-slate-300">
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                <select
                  value={commentApprovalFilter}
                  onChange={(e) => {
                    setCommentApprovalFilter(e.target.value);
                    setCommentCurrentPage(1);
                  }}
                  className="bg-transparent text-xs text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="all" className="bg-[#161a26] text-white">
                    All Moderation States
                  </option>
                  <option value="approved" className="bg-[#161a26] text-white">
                    Approved Only
                  </option>
                  <option value="pending" className="bg-[#161a26] text-white">
                    Pending Approval
                  </option>
                </select>
              </div>

              <button
                onClick={fetchComments}
                disabled={commentsLoading}
                className="p-2 text-slate-400 hover:text-white bg-[#161a26] hover:bg-white/[0.08] border border-white/[0.08] rounded-md transition-colors cursor-pointer"
                title="Refresh comments"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    commentsLoading ? "animate-spin text-purple-400" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Comments List */}
          <div className="rounded-md bg-[#0f121b] border border-white/[0.08] overflow-hidden">
            {commentsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
                <span className="text-xs uppercase tracking-wider font-semibold">
                  Loading comments...
                </span>
              </div>
            ) : comments.length === 0 ? (
              <div className="p-8">
                <AdminEmptyState
                  title="No Comments Found"
                  description="There are currently no reader comments matching your filters."
                />
              </div>
            ) : (
              <div>
                {/* Comments Header Bar with Select-All */}
                <div className="px-4 py-2.5 bg-[#161a26] border-b border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <AdminCheckbox
                      checked={comments.length > 0 && selectedCommentIds.length === comments.length}
                      indeterminate={selectedCommentIds.length > 0 && selectedCommentIds.length < comments.length}
                      onChange={handleSelectAllComments}
                      title="Select all comments"
                    />
                    <span className="font-semibold text-slate-300">Select All Comments</span>
                  </div>
                  {selectedCommentIds.length > 0 && (
                    <span className="text-slate-400 text-[11px] font-mono">
                      {selectedCommentIds.length} of {comments.length} selected
                    </span>
                  )}
                </div>

                <div className="divide-y divide-white/[0.06]">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-4 hover:bg-white/[0.015] transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                        selectedCommentIds.includes(comment.id) ? "bg-[#A78BFA]/[0.05]" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 max-w-3xl">
                        <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <AdminCheckbox
                            checked={selectedCommentIds.includes(comment.id)}
                            onChange={() => handleToggleSelectComment(comment.id)}
                            title={`Select comment from ${comment.author_name}`}
                          />
                        </div>
                        <div className="space-y-2 min-w-0 flex-1">
                          {/* Author metadata & Article link */}
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-white">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{comment.author_name}</span>
                            </div>

                            <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{comment.author_email}</span>
                            </div>

                            {comment.post && (
                              <span className="text-[11px] text-cyan-400 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                                <FileText className="w-3 h-3" />
                                <span className="truncate max-w-[220px]">{comment.post.title}</span>
                              </span>
                            )}

                            {comment.created_at && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-600" />
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* Comment text */}
                          <p className="text-xs text-slate-300 leading-relaxed bg-[#161a26] p-3 rounded-md border border-white/[0.06]">
                            {comment.comment}
                          </p>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                            comment.is_approved
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {comment.is_approved ? "Approved" : "Pending"}
                        </span>

                        <button
                          onClick={() => handleToggleCommentApproval(comment)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1 transition-colors cursor-pointer ${
                            comment.is_approved
                              ? "bg-[#161a26] border-white/[0.08] text-slate-300 hover:text-white"
                              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                          }`}
                        >
                          {comment.is_approved ? "Unapprove" : "Approve"}
                        </button>

                        <button
                          onClick={() => setDeletingComment(comment)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {commentTotalPages > 1 && (
              <div className="p-3.5 border-t border-white/[0.08]">
                <AdminPagination
                  currentPage={commentCurrentPage}
                  totalPages={commentTotalPages}
                  onPageChange={setCommentCurrentPage}
                  totalItems={commentTotalItems}
                  itemsPerPage={20}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ARTICLE CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0f121b] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] shrink-0 bg-[#0f121b]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-white tracking-tight">
                      {editingPost ? "Edit Article" : "Write New Article"}
                    </h2>
                    {editingPost && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08] capitalize">
                        {editingPost.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Draft, edit, and publish guides, product reviews, and store updates.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPostModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                
                {/* 1. Article Essentials */}
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-200">
                      Article Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. The Ultimate Beginner's Guide to Pod Systems & Coils"
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-[#161a26] border border-white/[0.08] rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-[#A78BFA]/60 focus:ring-1 focus:ring-[#A78BFA]/30 transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-200">Topic Category</label>
                      <select
                        value={postCategoryId}
                        onChange={(e) => setPostCategoryId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#161a26] border border-white/[0.08] rounded-lg text-white focus:outline-hidden focus:border-[#A78BFA]/60 cursor-pointer transition-all"
                      >
                        <option value="">Uncategorized</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-200">Publication Status</label>
                      <select
                        value={postStatus}
                        onChange={(e) => setPostStatus(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-[#161a26] border border-white/[0.08] rounded-lg text-white focus:outline-hidden focus:border-[#A78BFA]/60 cursor-pointer transition-all"
                      >
                        <option value="draft">Draft (Private)</option>
                        <option value="published">Published (Live on Storefront)</option>
                        <option value="archived">Archived (Delisted)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-200">URL Slug</label>
                        <span className="text-[10px] text-slate-500">Auto if blank</span>
                      </div>
                      <input
                        type="text"
                        placeholder="beginners-guide-to-pod-systems"
                        value={postSlug}
                        onChange={(e) => setPostSlug(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-[#161a26] border border-white/[0.08] rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-[#A78BFA]/60 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Featured Hero Image & Alt Text */}
                <div className="p-3.5 bg-[#161a26]/70 rounded-lg border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
                      <ImageIcon className="w-3.5 h-3.5 text-[#A78BFA]" />
                      <span>Featured Hero Image & SEO</span>
                    </div>
                    <label className="cursor-pointer text-xs font-semibold text-[#A78BFA] hover:text-[#B9A3FF] flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#211B32]/70 hover:bg-[#211B32] border border-[#A78BFA]/20 transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{imageUploading ? "Uploading..." : "Upload File"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        disabled={imageUploading}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="Image URL (e.g. https://images.unsplash.com/...)"
                        value={postImage}
                        onChange={(e) => setPostImage(e.target.value)}
                        className="w-full pl-3 pr-14 py-2 text-xs bg-[#0f121b] border border-white/[0.08] rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-[#A78BFA]/60 transition-all"
                      />
                      {postImage && (
                        <button
                          type="button"
                          onClick={() => setPostImage("")}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Image Alt Text (for Google Search & Screen Readers)"
                      value={postImageAlt}
                      onChange={(e) => setPostImageAlt(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#0f121b] border border-white/[0.08] rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-[#A78BFA]/60 transition-all"
                    />
                  </div>

                  {postImage && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10 bg-black/40 group">
                      <img
                        src={postImage}
                        alt={postImageAlt || "Featured preview"}
                        className="w-full h-full object-cover"
                        onError={() => toast.error("Could not load image from provided URL.")}
                      />
                      <button
                        type="button"
                        onClick={() => setPostImage("")}
                        className="absolute top-2 right-2 px-2 py-1 text-[11px] font-medium text-white bg-black/70 hover:bg-rose-600 rounded-md backdrop-blur-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Dynamic Tag Management System */}
                <div className="p-3.5 bg-[#161a26]/70 rounded-lg border border-white/[0.08] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#A78BFA]" />
                      <span>Article Tags</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {postSelectedTags.length} attached
                    </span>
                  </div>

                  {/* Input bar to type and create / select dynamic tags */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Hash className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Add a tag (type name and press Enter to create or attach)..."
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            handleCreateAndSelectTag();
                          }
                        }}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0f121b] border border-white/[0.08] rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-[#A78BFA]/60 transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCreateAndSelectTag()}
                      disabled={!newTagInput.trim() || creatingTag}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#A78BFA] hover:text-[#090B10] bg-[#211B32] hover:bg-[#A78BFA] disabled:opacity-40 disabled:hover:bg-[#211B32] disabled:hover:text-[#A78BFA] border border-[#A78BFA]/30 rounded-lg transition-all cursor-pointer"
                    >
                      {creatingTag ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Currently Selected Tags */}
                  {postSelectedTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {postSelectedTags.map((tagId) => {
                        const tagObj = tags.find((t) => t.id === tagId);
                        const label = tagObj ? tagObj.name : `Tag #${tagId}`;
                        return (
                          <span
                            key={tagId}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/40 shadow-xs font-medium"
                          >
                            <span>#{label}</span>
                            <button
                              type="button"
                              onClick={() => toggleTagSelection(tagId)}
                              className="text-[#A78BFA]/70 hover:text-white rounded-full p-0.5 transition-colors cursor-pointer"
                              title="Remove tag"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Quick-Pick Existing Business Tags */}
                  {tags.filter((t) => !postSelectedTags.includes(t.id)).length > 0 && (
                    <div className="pt-1.5 border-t border-white/[0.06] flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-medium mr-1">Suggestions:</span>
                      {tags
                        .filter((t) => !postSelectedTags.includes(t.id))
                        .slice(0, 10)
                        .map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleTagSelection(t.id)}
                            className="px-2 py-0.5 text-[11px] rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.06] hover:border-white/[0.14] transition-colors cursor-pointer"
                          >
                            +{t.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* 4. Excerpt / Summary */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-200">
                      Summary / Excerpt (Card Teaser)
                    </label>
                    <span className="text-[10px] text-slate-500">Displayed on catalog cards and search previews</span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Short summary displayed on catalog cards and search previews..."
                    value={postExcerpt}
                    onChange={(e) => setPostExcerpt(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[#161a26] border border-white/[0.08] rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-[#A78BFA]/60 leading-relaxed transition-all"
                  />
                </div>

                {/* 5. Article Content (Markdown Editor) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-200">
                      Article Body (Markdown Supported) <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#161a26] border border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() => setPreviewContentMode(false)}
                        className={`px-2.5 py-1 text-[11px] rounded-md cursor-pointer transition-colors ${
                          !previewContentMode
                            ? "bg-[#211B32] text-[#A78BFA] font-semibold border border-[#A78BFA]/30"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewContentMode(true)}
                        className={`px-2.5 py-1 text-[11px] rounded-md cursor-pointer transition-colors ${
                          previewContentMode
                            ? "bg-[#211B32] text-[#A78BFA] font-semibold border border-[#A78BFA]/30"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  {!previewContentMode ? (
                    <div className="space-y-0 rounded-lg overflow-hidden border border-white/[0.08] focus-within:border-[#A78BFA]/60 transition-all">
                      {/* Formatting Toolbar */}
                      <div className="flex flex-wrap items-center gap-1 bg-[#161a26] border-b border-white/[0.08] px-2.5 py-1.5 text-slate-300">
                        <button
                          type="button"
                          onClick={() => insertMarkdownFormatting("**", "**")}
                          className="p-1 hover:bg-white/[0.08] rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                          title="Bold"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdownFormatting("*", "*")}
                          className="p-1 hover:bg-white/[0.08] rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                          title="Italic"
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-px h-3.5 bg-white/10 mx-1" />
                        <button
                          type="button"
                          onClick={() => insertMarkdownFormatting("## ")}
                          className="p-1 hover:bg-white/[0.08] rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                          title="Heading 2"
                        >
                          <Heading2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdownFormatting("### ")}
                          className="p-1 hover:bg-white/[0.08] rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                          title="Heading 3"
                        >
                          <Heading3 className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-px h-3.5 bg-white/10 mx-1" />
                        <button
                          type="button"
                          onClick={() => insertMarkdownFormatting("- ")}
                          className="p-1 hover:bg-white/[0.08] rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                          title="Bullet List"
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdownFormatting("> ")}
                          className="p-1 hover:bg-white/[0.08] rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                          title="Quote"
                        >
                          <Quote className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdownFormatting("`", "`")}
                          className="p-1 hover:bg-white/[0.08] rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                          title="Inline Code"
                        >
                          <Code className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdownFormatting("[", "](url)")}
                          className="p-1 hover:bg-white/[0.08] rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
                          title="Hyperlink"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        id="blog-content-textarea"
                        rows={9}
                        placeholder="## Overview&#10;&#10;Write the narrative here. Markdown formatting is fully supported..."
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        className="w-full font-mono px-3.5 py-2.5 text-xs bg-[#161a26] border-0 text-white placeholder:text-slate-500 focus:outline-hidden leading-relaxed resize-y"
                        required
                      />
                    </div>
                  ) : (
                    <div className="w-full min-h-[220px] max-h-[320px] overflow-y-auto p-4 bg-[#161a26] border border-white/[0.08] rounded-lg text-slate-200 text-xs leading-relaxed space-y-3 prose prose-invert">
                      {postContent ? (
                        <div className="whitespace-pre-wrap">{postContent}</div>
                      ) : (
                        <span className="text-slate-500 italic">No content written yet.</span>
                      )}
                    </div>
                  )}
                </div>

                {/* 6. Collapsible SEO & Google Snippet Section */}
                <div className="border border-white/[0.08] rounded-lg overflow-hidden bg-[#161a26]/40">
                  <button
                    type="button"
                    onClick={() => setShowSeoSection(!showSeoSection)}
                    className="w-full flex items-center justify-between p-3.5 bg-[#161a26] text-xs font-semibold text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-[#A78BFA]" />
                      <span>Search Engine Optimization (SEO & SERP Preview)</span>
                    </div>
                    {showSeoSection ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showSeoSection && (
                    <div className="p-4 space-y-3.5 bg-[#0f121b] border-t border-white/[0.08]">
                      {/* Live SERP Mockup */}
                      <div className="p-3 bg-[#161a26] rounded-lg border border-white/[0.06] space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                          Google Search Result Preview
                        </span>
                        <div className="text-[11px] text-emerald-400 font-mono truncate">
                          https://inhaliq.com › blog › {postSlug || "sample-article-slug"}
                        </div>
                        <div className="text-sm font-medium text-[#A78BFA] hover:underline cursor-pointer truncate">
                          {postMetaTitle || postTitle || "Your Article Title Will Appear Here"}
                        </div>
                        <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {postMetaDescription || postExcerpt || "A concise, engaging meta description helps improve click-through rates from search engine result pages. Add one below or leave blank for auto fallback."}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-slate-300">
                              Custom Meta Title
                            </label>
                            <span className="text-[10px] text-slate-500">
                              {postMetaTitle.length}/60 recommended
                            </span>
                          </div>
                          <input
                            type="text"
                            value={postMetaTitle}
                            onChange={(e) => setPostMetaTitle(e.target.value)}
                            placeholder="Custom SEO title (defaults to article title if empty)..."
                            className="w-full px-3 py-2 text-xs bg-[#161a26] border border-white/[0.08] rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-[#A78BFA]/60"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-slate-300">
                              Custom Meta Description
                            </label>
                            <span className="text-[10px] text-slate-500">
                              {postMetaDescription.length}/160 recommended
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            value={postMetaDescription}
                            onChange={(e) => setPostMetaDescription(e.target.value)}
                            placeholder="Custom SEO snippet for search results (defaults to excerpt if empty)..."
                            className="w-full px-3 py-2 text-xs bg-[#161a26] border border-white/[0.08] rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-[#A78BFA]/60 leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/[0.08] shrink-0 bg-[#0f121b]">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#A78BFA]"></span>
                  <span>Status: <strong className="text-slate-200 capitalize">{postStatus}</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsPostModalOpen(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white bg-transparent hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={postSaving || imageUploading}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-[#090B10] bg-[#A78BFA] hover:bg-[#B9A3FF] disabled:opacity-50 rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    {postSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingPost ? "Save Changes" : "Publish Article"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#0f121b] border border-white/[0.12] rounded-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
                  <FolderTree className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">
                  {editingCategory ? "Edit Category" : "Add Category"}
                </h2>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Category Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ergonomics & Desk Tech"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#161a26] border border-white/[0.08] rounded-md text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">URL Slug</label>
                <input
                  type="text"
                  placeholder="ergonomics-desk-tech"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#161a26] border border-white/[0.08] rounded-md text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the topic area..."
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#161a26] border border-white/[0.08] rounded-md text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400/50"
                />
              </div>

              {/* Collapsible SEO */}
              <div className="border border-white/[0.08] rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowCatSeo(!showCatSeo)}
                  className="w-full flex items-center justify-between p-2.5 bg-[#161a26] text-xs font-bold text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-cyan-400" />
                    <span>SEO Meta Settings</span>
                  </div>
                  {showCatSeo ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showCatSeo && (
                  <div className="p-3 space-y-3 bg-[#0f121b] border-t border-white/[0.08]">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={catMetaTitle}
                        onChange={(e) => setCatMetaTitle(e.target.value)}
                        placeholder="Custom SEO title..."
                        className="w-full px-3 py-2 text-xs bg-[#161a26] border border-white/[0.08] rounded-md text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Meta Description
                      </label>
                      <textarea
                        rows={2}
                        value={catMetaDescription}
                        onChange={(e) => setCatMetaDescription(e.target.value)}
                        placeholder="Custom SEO description..."
                        className="w-full px-3 py-2 text-xs bg-[#161a26] border border-white/[0.08] rounded-md text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400/50"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white bg-transparent hover:bg-white/[0.06] rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSaving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-md transition-colors cursor-pointer shadow-sm"
                >
                  {catSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCategory ? "Update Category" : "Create Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAG CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      {isTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-[#0f121b] border border-white/[0.12] rounded-lg p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
                  <Tag className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">
                  {editingTag ? "Edit Tag" : "Add Tag"}
                </h2>
              </div>
              <button
                onClick={() => setIsTagModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTag} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Tag Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Audiophile, GasketMount"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#161a26] border border-white/[0.08] rounded-md text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-400/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Slug</label>
                <input
                  type="text"
                  placeholder="audiophile"
                  value={tagSlug}
                  onChange={(e) => setTagSlug(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#161a26] border border-white/[0.08] rounded-md text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-400/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsTagModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white bg-transparent hover:bg-white/[0.06] rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={tagSaving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-md transition-colors cursor-pointer shadow-sm"
                >
                  {tagSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingTag ? "Update Tag" : "Create Tag"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODALS */}
      {/* ========================================================================= */}
      {deletingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#0f121b] border border-white/[0.12] rounded-lg p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white">Delete Article</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to permanently delete{" "}
                <span className="text-white font-semibold">{deletingPost.title}</span>? All
                associated comments will also be permanently deleted.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingPost(null)}
                className="px-3.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                disabled={postDeleting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-colors cursor-pointer shadow-sm"
              >
                {postDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#0f121b] border border-white/[0.12] rounded-lg p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white">Delete Category</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to delete{" "}
                <span className="text-white font-semibold">{deletingCategory.name}</span>? Articles
                in this topic will remain active and become Uncategorized.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingCategory(null)}
                className="px-3.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={catDeleting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-colors cursor-pointer shadow-sm"
              >
                {catDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#0f121b] border border-white/[0.12] rounded-lg p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white">Delete Tag</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to delete{" "}
                <span className="text-white font-semibold">#{deletingTag.name}</span>? Articles with
                this tag will not be deleted.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingTag(null)}
                className="px-3.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTag}
                disabled={tagDeleting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-colors cursor-pointer shadow-sm"
              >
                {tagDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#0f121b] border border-white/[0.12] rounded-lg p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white">Delete Reader Comment</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to permanently delete this comment from{" "}
                <span className="text-white font-semibold">{deletingComment.author_name}</span>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingComment(null)}
                className="px-3.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteComment}
                disabled={commentDeleting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-colors cursor-pointer shadow-sm"
              >
                {commentDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bars for Selected Items */}
      {activeTab === "posts" && (
        <BulkActionBar
          selectedCount={selectedPostIds.length}
          totalCount={posts.length}
          itemName="article"
          isDeleting={isBulkDeletingPosts}
          onClearSelection={() => setSelectedPostIds([])}
          onSelectAll={() => setSelectedPostIds(posts.map((p) => p.id))}
          onConfirmDelete={handleBulkDeletePosts}
        />
      )}

      {activeTab === "categories" && (
        <BulkActionBar
          selectedCount={selectedCategoryIds.length}
          totalCount={filteredCategories.length}
          itemName="category"
          isDeleting={isBulkDeletingCategories}
          onClearSelection={() => setSelectedCategoryIds([])}
          onSelectAll={() => setSelectedCategoryIds(filteredCategories.map((c) => c.id))}
          onConfirmDelete={handleBulkDeleteCategories}
        />
      )}

      {activeTab === "tags" && (
        <BulkActionBar
          selectedCount={selectedTagIds.length}
          totalCount={filteredTags.length}
          itemName="tag"
          isDeleting={isBulkDeletingTags}
          onClearSelection={() => setSelectedTagIds([])}
          onSelectAll={() => setSelectedTagIds(filteredTags.map((t) => t.id))}
          onConfirmDelete={handleBulkDeleteTags}
        />
      )}

      {activeTab === "comments" && (
        <BulkActionBar
          selectedCount={selectedCommentIds.length}
          totalCount={comments.length}
          itemName="comment"
          isDeleting={isBulkDeletingComments}
          onClearSelection={() => setSelectedCommentIds([])}
          onSelectAll={() => setSelectedCommentIds(comments.map((c) => c.id))}
          onConfirmDelete={handleBulkDeleteComments}
          extraActions={[
            {
              label: isBulkApprovingComments ? "Approving..." : "Approve Selected",
              icon: CheckCircle2,
              variant: "emerald",
              disabled: isBulkApprovingComments,
              onClick: handleBulkApproveComments,
            },
          ]}
        />
      )}
    </div>
  );
}

export default function AdminContentBlogPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#A78BFA]" />
          <p className="text-xs">Loading editorial studio...</p>
        </div>
      }
    >
      <AdminContentBlogPageContent />
    </React.Suspense>
  );
}
