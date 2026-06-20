import { getPages } from './actions'
// Trigger Turbopack recompile
import { PagesClient } from './PagesClient'

export const dynamic = 'force-dynamic'

export default async function PagesPage() {
  const result = await getPages()
  const pages = result.success ? result.data : []

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Trang (Pages)</h1>
          <p className="text-slate-500 font-medium">
            Quản lý các trang nội dung tĩnh như Giới thiệu, Liên hệ, Điều khoản...
          </p>
        </div>
      </div>

      <PagesClient initialPages={pages || []} />
    </div>
  )
}
