/**
 * entity.ts — Type definitions cho Entity (cầu thủ/vận động viên) domain
 */

// ─── Enums / Literals ────────────────────────────────────────────────────────

export type EntityType = 'FOOTBALL_PLAYER' | 'BILLIARDS_PLAYER' | 'TENNIS_PLAYER';

// ─── Stats (JSON stored in Entity.stats) ─────────────────────────────────────

/** Map chỉ số => giá trị (0–99) */
export type StatValues = {
  [key: string]: number;
};

/** Schema của JSON field `stats` trong DB */
export type EntityStats = {
  attributes?: StatValues;
  averageRating?: string;
  [key: string]: unknown;
};

/** Một chỉ số thể thao hiển thị */
export type StatField = {
  key: string;
  label: string;
  color: string;    // Tailwind bg class
  desc: string;
};

// ─── BasicInfo (JSON stored in Entity.basicInfo) ─────────────────────────────

export type EntityBasicInfo = {
  fullName?: string;
  birthDate?: string;
  /** Có thể là string đơn hoặc mảng (đa quốc tịch) */
  nationality?: string | string[];
  /** Có thể là string đơn hoặc mảng (đa vị trí) */
  position?: string | string[];
  height?: number;
  shirtNumber?: number;
  preferredFoot?: 'Left' | 'Right' | 'Both';
  playerValue?: string;
  contractUntil?: string;
};

// ─── Achievements (JSON stored in Entity.achievements) ───────────────────────

export type EntityAchievement = {
  id: string;
  title: string;
  year?: string;
  description?: string;
};

// ─── Entity Model ─────────────────────────────────────────────────────────────

export type Entity = {
  id: string;
  name: string;
  slug: string;
  type: EntityType;
  avatar: string | null;
  clubId: string | null;
  club?: { id: string; name: string; logo?: string | null } | null;
  basicInfo: string | null;    // JSON of EntityBasicInfo
  achievements: string | null; // JSON of EntityAchievement[]
  stats: string | null;        // JSON of EntityStats
  createdAt: Date;
  updatedAt: Date;
};

/** Dữ liệu form khi tạo/sửa Entity */
export type EntityFormData = {
  name: string;
  slug: string;
  type: EntityType;
  avatar: string;
  clubId: string;
};
