import { getAllSettings } from './actions'
import prisma from '@/lib/prisma'
import { SettingsContainer } from '@/components/domain/settings/SettingsContainer'
import { 
  DEFAULT_HEADER_SETTINGS, 
  DEFAULT_FOOTER_SETTINGS, 
  DEFAULT_MENU_SETTINGS,
  DEFAULT_HAMBURGER_SETTINGS
} from '@/types/settings'

export const metadata = {
  title: 'Cấu hình Website | CMS',
}

export default async function SettingsPage() {
  const [allSettings, categories] = await Promise.all([
    getAllSettings(),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true, parentId: true },
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
  ])

  const headerSetting = allSettings.find(s => s.key === 'SITE_HEADER')
  const footerSetting = allSettings.find(s => s.key === 'SITE_FOOTER')
  const menuSetting = allSettings.find(s => s.key === 'SITE_MENU')
  const hamburgerSetting = allSettings.find(s => s.key === 'SITE_HAMBURGER')

  const headerData = headerSetting ? JSON.parse(headerSetting.value) : DEFAULT_HEADER_SETTINGS
  const footerData = footerSetting ? JSON.parse(footerSetting.value) : DEFAULT_FOOTER_SETTINGS
  const menuData = menuSetting ? JSON.parse(menuSetting.value) : DEFAULT_MENU_SETTINGS
  const hamburgerData = hamburgerSetting ? JSON.parse(hamburgerSetting.value) : DEFAULT_HAMBURGER_SETTINGS

  const updatedAtMap = {
    SITE_HEADER: headerSetting?.updatedAt || null,
    SITE_FOOTER: footerSetting?.updatedAt || null,
    SITE_MENU: menuSetting?.updatedAt || null,
    SITE_HAMBURGER: hamburgerSetting?.updatedAt || null
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Cấu hình Website</h1>
          <p className="text-slate-500 font-medium">Quản lý giao diện chung và thông tin cơ bản của website.</p>
        </div>
      </div>

      <SettingsContainer 
        headerData={headerData} 
        footerData={footerData} 
        menuData={menuData} 
        hamburgerData={hamburgerData}
        updatedAtMap={updatedAtMap}
        categories={categories}
      />
    </div>
  )
}
