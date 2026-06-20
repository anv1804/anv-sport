import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getSetting } from "@/app/admin/(dashboard)/settings/actions";
import { DEFAULT_HEADER_SETTINGS, DEFAULT_MENU_SETTINGS, DEFAULT_FOOTER_SETTINGS, DEFAULT_HAMBURGER_SETTINGS } from "@/types/settings";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerRaw = await getSetting('SITE_HEADER');
  const menuRaw = await getSetting('SITE_MENU');
  const footerRaw = await getSetting('SITE_FOOTER');
  const hamburgerRaw = await getSetting('SITE_HAMBURGER');

  const headerData = headerRaw ? JSON.parse(headerRaw) : DEFAULT_HEADER_SETTINGS;
  const menuData = menuRaw ? JSON.parse(menuRaw) : DEFAULT_MENU_SETTINGS;
  const footerData = footerRaw ? JSON.parse(footerRaw) : DEFAULT_FOOTER_SETTINGS;
  const hamburgerData = hamburgerRaw ? JSON.parse(hamburgerRaw) : DEFAULT_HAMBURGER_SETTINGS;

  // Auto-enrich menu items with subcategories from the database if they don't have children
  const prisma = (await import("@/lib/prisma")).default;
  const allCategories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, parentId: true },
    orderBy: { createdAt: 'asc' }
  });

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
    <div className="min-h-screen flex flex-col pt-[112px] font-client-ui">
      <Header 
        headerData={headerData} 
        menuData={menuData} 
        enrichedMenuData={enrichedMenuData}
        hamburgerData={hamburgerData}
        allCategoriesTree={allCategoriesTree}
      />
      <div className="flex-grow flex flex-col">{children}</div>
      <Footer footerData={footerData} />
    </div>
  );
}
