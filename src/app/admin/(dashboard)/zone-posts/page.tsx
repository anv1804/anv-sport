import { Metadata } from 'next'
import { getZones } from '../zones/actions'
import { getCategories } from '../categories/actions'
import { ZonePostClient } from './ZonePostClient'

export const metadata: Metadata = {
  title: 'Sắp xếp tin bài | ANV Sport Admin',
}

export default async function ZonePostsPage() {
  const [zonesRes, categoriesRes] = await Promise.all([
    getZones(),
    getCategories()
  ]);

  const zones = zonesRes?.success && zonesRes?.data ? zonesRes.data.filter((z: any) => z.isActive) : []
  const categories = Array.isArray(categoriesRes) ? categoriesRes.filter((c: any) => c.isActive !== false) : []

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2 flex items-center">
          <span className="text-emerald-500 mr-3">📑</span> Sắp xếp tin bài
        </h1>
        <p className="text-slate-500 font-medium">Kéo thả để thay đổi vị trí bài viết hiển thị nổi bật trên trang chủ và các trang chuyên mục.</p>
      </div>

      <ZonePostClient zones={zones} categories={categories} />
    </div>
  )
}
