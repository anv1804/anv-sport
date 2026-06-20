/**
 * post.ts — Type definitions cho Post domain
 */
import { AuthorRef } from './common';

// ─── Enums / Literals ────────────────────────────────────────────────────────

export type PostStatus = 'DRAFT' | 'PENDING_EDITOR' | 'PENDING_CHIEF' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' | 'DELETED';
export type PostType = 'STANDARD' | 'VIDEO' | 'EMAGAZINE';

export const POST_STATUS_OPTIONS: { value: PostStatus; label: string }[] = [
  { value: 'DRAFT',          label: 'Nháp' },
  { value: 'PENDING_EDITOR', label: 'Chờ biên tập' },
  { value: 'PENDING_CHIEF',  label: 'Chờ tổng biên tập' },
  { value: 'PUBLISHED',      label: 'Xuất bản' },
  { value: 'ARCHIVED',       label: 'Lưu trữ' },
  { value: 'SCHEDULED',      label: 'Lên lịch' },
  { value: 'DELETED',        label: 'Đã xóa' },
];

// ─── Metadata (JSON stored in Post.metadata) ─────────────────────────────────

export type PostRevision = {
  id: number;
  time: string;
  date: string;
  author: string;
};

export type RelatedPost = {
  id: number;
  title: string;
  imageUrl?: string | null;
};

export type PostMetadata = {
  /** SEO title (nếu khác title chính) */
  seoTitle?: string;
  /** SEO meta description */
  seoDescription?: string;
  /** Tags bài viết */
  tags?: string[];
  /** Bài viết liên quan */
  relatedPosts?: RelatedPost[];
  /** Lịch sử revision (autosave) */
  revisions?: PostRevision[];
  /** AI generation info */
  aiTitle?: string;
  aiUrl?: string;
  isAiGenerated?: boolean;
  /** Social sharing */
  pushToFb?: boolean;
  /** Lịch xuất bản */
  scheduledAt?: string;
};

// ─── Post Models ──────────────────────────────────────────────────────────────

/** Post đầy đủ (từ Prisma) */
export type Post = {
  id: number;
  title: string;
  excerpt: string | null;
  content: string;
  imageUrl: string | null;
  author: string;
  status: PostStatus;
  type: PostType;
  isAiGenerated: boolean;
  metadata: string | null; // JSON string của PostMetadata
  createdAt: Date;
  updatedAt: Date;
};

/** Post card nhẹ — dùng cho danh sách, hero section, widgets */
export type PostCard = {
  id: number;
  title: string;
  excerpt?: string | null;
  imageUrl?: string | null;
};

/** Dữ liệu form khi tạo/sửa bài viết */
export type PostFormData = {
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  status: PostStatus;
};
