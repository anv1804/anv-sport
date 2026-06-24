import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/layout/BackToTop";
import MobileQuickMenu from "@/components/layout/MobileQuickMenu";
import NavigationLoader from "@/components/layout/NavigationLoader";
import { getSetting } from "@/app/admin/(dashboard)/settings/actions";
import { DEFAULT_HEADER_SETTINGS, DEFAULT_MENU_SETTINGS, DEFAULT_FOOTER_SETTINGS, DEFAULT_HAMBURGER_SETTINGS } from "@/types/settings";
import { unstable_cache } from "next/cache";

const getCachedSettings = unstable_cache(
  async () => {
    const prisma = (await import("@/lib/prisma")).default;
    return prisma.setting.findMany({
      where: {
        key: { in: ['SITE_HEADER', 'SITE_MENU', 'SITE_FOOTER', 'SITE_HAMBURGER'] }
      }
    });
  },
  ['layout-settings'],
  { revalidate: 60, tags: ['settings'] }
);

const getCachedCategories = unstable_cache(
  async () => {
    const prisma = (await import("@/lib/prisma")).default;
    return prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, parentId: true },
      orderBy: { createdAt: 'asc' }
    });
  },
  ['layout-categories'],
  { revalidate: 60, tags: ['categories'] }
);

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, allCategories] = await Promise.all([
    getCachedSettings(),
    getCachedCategories()
  ]);

  const settingsMap = new Map(settings.map(s => [s.key, s.value]));
  const headerRaw = settingsMap.get('SITE_HEADER');
  const menuRaw = settingsMap.get('SITE_MENU');
  const footerRaw = settingsMap.get('SITE_FOOTER');
  const hamburgerRaw = settingsMap.get('SITE_HAMBURGER');

  const headerData = headerRaw ? JSON.parse(headerRaw) : DEFAULT_HEADER_SETTINGS;
  const menuData = menuRaw ? JSON.parse(menuRaw) : DEFAULT_MENU_SETTINGS;
  const footerData = footerRaw ? JSON.parse(footerRaw) : DEFAULT_FOOTER_SETTINGS;
  const hamburgerData = hamburgerRaw ? JSON.parse(hamburgerRaw) : DEFAULT_HAMBURGER_SETTINGS;

  const enrichItems = (items: any[]): any[] => {
    return items.map(item => {
      let enrichedItem = { ...item };
      
      // Recursively enrich existing configured children
      if (enrichedItem.children && enrichedItem.children.length > 0) {
        enrichedItem.children = enrichItems(enrichedItem.children);
      } 
      // If it's a category and has no children configured, auto-fetch from DB
      else if (enrichedItem.type === 'category' && enrichedItem.categoryId) {
        const subCats = allCategories.filter(c => c.parentId === enrichedItem.categoryId);
        if (subCats.length > 0) {
          enrichedItem.children = subCats.map(sub => ({
            id: sub.id,
            label: sub.name,
            url: `/${sub.slug}`,
            type: 'category',
            categoryId: sub.id
          }));
        }
      }
      return enrichedItem;
    });
  };

  const enrichedMenuData = menuData ? { ...menuData, items: enrichItems(menuData.items || []) } : undefined;
  
  if (enrichedMenuData && enrichedMenuData.items) {
    // Thêm link Dự Đoán AI vào cuối menu
    enrichedMenuData.items.push({
      id: 'du-doan-ai',
      label: 'DỰ ĐOÁN AI',
      url: '/du-doan',
      type: 'custom'
    });
  }

  const rootCategories = allCategories.filter(c => c.parentId === null);
  const allCategoriesTree = [
    { id: 'home', label: 'TRANG CHỦ', url: '/' },
    ...rootCategories.map(root => ({
      id: root.id,
      label: root.name,
      url: `/${root.slug}`,
      children: allCategories
        .filter(c => c.parentId === root.id)
        .map(sub => ({
          id: sub.id,
          label: sub.name,
          url: `/${sub.slug}`
        }))
    }))
  ];

  return (
    <div className="min-h-screen flex flex-col pt-[130px] md:pt-[92px] lg:pt-[112px] font-client-ui">
      <NavigationLoader />
      <Header 
        headerData={headerData} 
        menuData={menuData} 
        enrichedMenuData={enrichedMenuData}
        hamburgerData={hamburgerData}
        allCategoriesTree={allCategoriesTree}
      />
      <div className="flex-grow flex flex-col">{children}</div>
      <Footer footerData={footerData} menuItems={enrichedMenuData?.items || []} />
      <BackToTop />
      <MobileQuickMenu />
    </div>
  );
}
