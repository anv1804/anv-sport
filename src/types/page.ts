/**
 * page.ts — Type definitions cho Page (trang động) domain
 */

export type PageType = 'SYSTEM' | 'CUSTOM';
export type PageStatus = 'PUBLISHED' | 'DRAFT';

/** Cấu hình một category block trong homepage */
export type CategoryBlockConfig = {
  id?: string;
  isSticky?: boolean;
  /** 0 = layout A, 1 = layout B, 2 = layout C */
  layout?: number;
};

/** Schema của JSON field `settings` trong Page */
export type PageSettings = {
  /** Zone ID cho khu vực tiêu điểm (top section) */
  top_section?: string;
  /** Zone ID cho luồng tin chính */
  news_feed?: string;
  /** Danh sách category blocks */
  category_blocks?: (CategoryBlockConfig | string)[];
  /** Ad slot IDs */
  ad_top_right?: string;
  ad_middle?: string;
  ad_bottom_right?: string;
};

export type Page = {
  id: string;
  title: string;
  slug: string;
  type: PageType;
  content: string | null;
  settings: string | null; // JSON of PageSettings
  status: PageStatus;
  isDeletable: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** Dữ liệu form khi tạo/sửa Page */
export type PageFormData = {
  title: string;
  slug: string;
  type: PageType;
  status: PageStatus;
};
