/**
 * club.ts — Type definitions cho Club (câu lạc bộ) domain
 */

export type SportType = 'FOOTBALL' | 'BILLIARDS' | 'TENNIS' | 'ESPORTS' | 'OTHER';

/** Schema của JSON field `basicInfo` trong Club */
export type ClubBasicInfo = {
  founded?: string;
  stadium?: string;
  capacity?: number;
  city?: string;
  country?: string;
  manager?: string;
  website?: string;
  colors?: string[];
};

export type Club = {
  id: string;
  name: string;
  slug: string;
  sportType: SportType;
  logo: string | null;
  basicInfo: string | null; // JSON of ClubBasicInfo
  createdAt: Date;
  updatedAt: Date;
  _count?: { entities: number };
};

/** Dữ liệu form khi tạo/sửa Club */
export type ClubFormData = {
  name: string;
  slug: string;
  sportType: SportType;
  logo: string;
};
