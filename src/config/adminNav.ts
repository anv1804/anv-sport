import { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, FileText, FolderTree, MonitorPlay, Settings, Layers, LayoutTemplate, PenTool, LayoutList, Users, Shield
} from 'lucide-react';

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type NavGroup = {
  group: string;
  items: NavItem[];
};

export const ADMIN_NAV: NavGroup[] = [
  {
    group: 'Quản lý',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Soạn Bài Mới', href: '/admin/posts/new', icon: PenTool },
      { name: 'Bài Viết', href: '/admin/posts', icon: FileText },
      { name: 'Sắp xếp tin bài', href: '/admin/zone-posts', icon: LayoutList },
      { name: 'Danh Mục', href: '/admin/categories', icon: FolderTree },
      { name: 'Quảng Cáo', href: '/admin/ads', icon: MonitorPlay },
    ],
  },
  {
    group: 'Kho Dữ Liệu',
    items: [
      { name: 'Cầu Thủ / VĐV', href: '/admin/entities', icon: Users },
      { name: 'Câu Lạc Bộ', href: '/admin/clubs', icon: Shield },
    ],
  },
  {
    group: 'Giao diện',
    items: [
      { name: 'Trang', href: '/admin/pages', icon: LayoutTemplate },
      { name: 'Khu Vực', href: '/admin/zones', icon: Layers },
    ],
  },
  {
    group: 'Hệ thống',
    items: [
      { name: 'Cài Đặt', href: '/admin/settings', icon: Settings },
    ],
  },
];
