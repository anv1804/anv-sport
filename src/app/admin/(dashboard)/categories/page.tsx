import { getCategories } from './actions'
import { CategoryContainer } from '@/components/domain/category/CategoryContainer'

export const metadata = {
  title: 'Quản lý danh mục | CMS',
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Danh mục</h1>
          <p className="text-slate-500 font-medium">Tổ chức và phân loại các bài viết của bạn</p>
        </div>
      </div>

      <CategoryContainer initialCategories={categories} />
    </div>
  )
}
