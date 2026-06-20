"use client";

import { useState } from "react";
import { Search, Calendar, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const FilterLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{children}</div>
);

export function PostFilters() {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 pb-2">
      {/* BỘ LỌC CƠ BẢN */}
      <div className="p-4 px-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-1">
            <FilterLabel>Từ khóa tìm kiếm</FilterLabel>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <Input type="text" placeholder="Nhập từ khóa hoặc ID..." className="pl-9 text-[13px] w-full" />
              </div>
              <Button variant="success" className="px-4 text-[13px] flex items-center justify-center shrink-0 h-[42px]">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <FilterLabel>Khoảng thời gian</FilterLabel>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <Input type="text" placeholder="01/06/2026 - 01/07/2026" className="pl-9 text-[13px] w-full" />
            </div>
          </div>
          <div>
            <FilterLabel>Danh mục</FilterLabel>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select className="text-[13px] w-full">
                  <option value="">Tất cả danh mục</option>
                  <option value="the-thao">Thể thao</option>
                  <option value="tin-tuc">Tin tức</option>
                </Select>
              </div>
              <Button
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                variant="outline"
                className={`px-3 text-[13px] flex items-center justify-center shrink-0 h-[42px] ${isAdvancedOpen ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50' : ''}`}
                title="Bộ lọc nâng cao"
              >
                <Filter className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Nâng cao</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* BỘ LỌC NÂNG CAO */}
      {isAdvancedOpen && (
        <div className="px-5 pb-6 pt-4 border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">

            {/* ROW 1 */}
            <div>
              <FilterLabel>Hình thức tin bài</FilterLabel>
              <Input type="text" placeholder="Hình thức tin bài" className="text-[13px]" />
            </div>
            <div>
              <FilterLabel>Nguồn tin</FilterLabel>
              <Input type="text" placeholder="Nguồn tin" className="text-[13px]" />
            </div>
            <div>
              <FilterLabel>Tác giả</FilterLabel>
              <Input type="text" placeholder="Tác giả" className="text-[13px]" />
            </div>

            {/* ROW 2 */}
            <div>
              <FilterLabel>Chủ đề / Sự kiện</FilterLabel>
              <Input type="text" placeholder="Chủ đề / Sự kiện" className="text-[13px]" />
            </div>
            <div>
              <FilterLabel>Tuyến bài</FilterLabel>
              <Input type="text" placeholder="Tuyến bài" className="text-[13px]" />
            </div>
            <div>
              <FilterLabel>Người tạo</FilterLabel>
              <Input type="text" placeholder="Người tạo" className="text-[13px]" />
            </div>

            {/* ROW 3 */}
            <div>
              <FilterLabel>Danh mục đồng xuất bản</FilterLabel>
              <Input type="text" placeholder="Danh mục đồng xuất bản" className="text-[13px]" />
            </div>
            <div>
              <FilterLabel>Biểu tượng (icons)</FilterLabel>
              <Input type="text" placeholder="Biểu tượng (icons)" className="text-[13px]" />
            </div>
            <div>
              <FilterLabel>Rich Media / News Options</FilterLabel>
              <Select className="text-[13px]">
                <option value="">Chọn bộ lọc</option>
              </Select>
            </div>

            {/* ROW 4 - Numeric Ranges */}
            <div>
              <FilterLabel>View hệ thống</FilterLabel>
              <div className="flex items-center gap-2">
                <Input type="number" placeholder="Nhỏ nhất" className="text-[13px]" />
                <span className="text-slate-400">-</span>
                <Input type="number" placeholder="Lớn nhất" className="text-[13px]" />
              </div>
            </div>
            <div>
              <FilterLabel>Điểm SEO</FilterLabel>
              <div className="flex items-center gap-2">
                <Input type="number" placeholder="Nhỏ nhất" className="text-[13px]" />
                <span className="text-slate-400">-</span>
                <Input type="number" placeholder="Lớn nhất" className="text-[13px]" />
              </div>
            </div>
            <div>
              <FilterLabel>Số từ</FilterLabel>
              <div className="flex items-center gap-2">
                <Input type="number" placeholder="Nhỏ nhất" className="text-[13px]" />
                <span className="text-slate-400">-</span>
                <Input type="number" placeholder="Lớn nhất" className="text-[13px]" />
              </div>
            </div>

          </div>

          {/* ADVANCED ACTIONS */}
          <div className="flex justify-center items-center gap-3 mt-8">
            <Button variant="success" className="px-6 text-[13px]">
              <Search className="w-3.5 h-3.5 mr-2" /> Tìm kiếm
            </Button>
            <Button
              onClick={() => setIsAdvancedOpen(false)}
              className="px-6 text-[13px] bg-red-500 hover:bg-red-600 text-white"
            >
              <X className="w-3.5 h-3.5 mr-2" /> Đóng lại
            </Button>
          </div>

        </div>
      )}

    </div>
  );
}
