export type SiteHeaderSettings = {
  logoUrl: string
  siteName: string
  contactEmail: string
  contactPhone: string
}

export type SiteFooterSettings = {
  aboutText: string
  copyright: string
  facebookUrl: string
  youtubeUrl: string
}

export type MenuItem = {
  id: string
  label: string
  url: string
  type?: 'custom' | 'category'
  categoryId?: string
  target?: '_blank' | '_self'
  children?: MenuItem[]
}

export type SiteMenuSettings = {
  items: MenuItem[]
}

export type HamburgerLink = {
  id: string
  label: string
  url: string
}

export type SiteHamburgerSettings = {
  utilities: HamburgerLink[]
  apps: HamburgerLink[]
}

// Default values
export const DEFAULT_HEADER_SETTINGS: SiteHeaderSettings = {
  logoUrl: '/logos/anv-sport-logo.png',
  siteName: 'ANV Sport',
  contactEmail: '',
  contactPhone: ''
}

export const DEFAULT_FOOTER_SETTINGS: SiteFooterSettings = {
  aboutText: 'ANV Sport - Nơi chia sẻ tin tức và kiến thức thể thao hàng đầu.',
  copyright: '© 2026 ANV Sport. All rights reserved.',
  facebookUrl: '',
  youtubeUrl: ''
}

export const DEFAULT_MENU_SETTINGS: SiteMenuSettings = {
  items: [
    { id: '1', label: 'Trang chủ', url: '/' },
    { id: '2', label: 'Bóng đá', url: '/bong-da' }
  ]
}

export const DEFAULT_HAMBURGER_SETTINGS: SiteHamburgerSettings = {
  utilities: [
    { id: '1', label: 'Spotlight', url: '#' },
    { id: '2', label: 'Ảnh', url: '#' },
    { id: '3', label: 'Infographics', url: '#' },
    { id: '4', label: 'Mới nhất', url: '#' },
    { id: '5', label: 'Xem nhiều', url: '#' },
    { id: '6', label: 'Tin nóng', url: '#' },
    { id: '7', label: 'Lịch vạn niên', url: '#' }
  ],
  apps: [
    { id: '1', label: 'ANV Sport', url: '#' },
    { id: '2', label: 'International', url: '#' }
  ]
}
