import { getZones } from './actions'
import { getPages } from '../pages/actions'
import { ZonesClient } from './ZonesClient'

export const dynamic = 'force-dynamic'

export default async function ZonesPage() {
  const result = await getZones()
  const pagesResult = await getPages()
  
  const zones = result.success ? result.data : []
  const pages = pagesResult.success ? pagesResult.data : []

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Khu Vực (Zones)</h1>
          <p className="text-slate-500 font-medium">
            Quản lý các khu vực hiển thị trên trang chủ và toàn bộ hệ thống
          </p>
        </div>
      </div>

      <ZonesClient initialZones={zones || []} pages={pages || []} />
    </div>
  )
}
