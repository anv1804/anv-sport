/**
 * zone.ts — Type definitions cho Zone domain
 */
import { PostCard } from './post';

// ─── Zone ─────────────────────────────────────────────────────────────────────

export type Zone = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  pageId?: string | null;
  page?: { id: string; title: string } | null;
  _count?: { zonePosts: number };
};

// ─── ZonePost (join table) ────────────────────────────────────────────────────

export type ZonePost = {
  id: string;
  zoneId: string;
  postId: number;
  position: number;
  isPrinted: boolean;
  printStartTime: Date | null;
  printEndTime: Date | null;
  createdAt: Date;
  post: PostCard;
};

/** Zone kèm danh sách bài viết — dùng cho homepage sections */
export type ZoneWithPosts = Zone & {
  zonePosts: ZonePost[];
};

/** Dữ liệu form khi tạo/sửa Zone */
export type ZoneFormData = {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  pageId: string;
};
