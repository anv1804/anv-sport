/**
 * common.ts — Shared generic types dùng chung toàn project
 */

/** Option cho các Select, Dropdown component */
export type SelectOption = {
  value: string;
  label: string;
  /** Icon emoji hoặc ký tự ngắn */
  icon?: string;
  /** Mã viết tắt (ví dụ: mã quốc gia) */
  abbr?: string;
  /** Color group name dùng để map màu Tailwind */
  color?: string;
  /** Disabled option */
  disabled?: boolean;
};

/** Tham chiếu tác giả hiển thị trên bài viết */
export type AuthorRef = {
  name: string;
  avatar?: string;
};

/** Props base chung cho các card bài viết */
export type BasePostCardProps = {
  href?: string;
  title?: string;
  excerpt?: string;
  imageUrl?: string;
  imageClass?: string;
  size?: 'sm' | 'md' | 'lg';
  isLive?: boolean;
  category?: string;
  author?: AuthorRef;
  className?: string;
  isLoading?: boolean;
  titleLines?: number;
  excerptLines?: number;
  hideExcerpt?: boolean;
};

/** Ref đội bóng gọn (dùng trong MatchHeader, prediction) */
export type TeamRef = {
  name: string;
  logo: string;
};

/** Xác suất trận đấu */
export type MatchProbabilities = {
  team1: number;
  draw: number;
  team2: number;
};

/** Kết quả phân trang chung */
export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};
