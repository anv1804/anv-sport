import { createEntity } from '../actions';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { FormSection } from '@/components/admin/entity-form/FormSection';
import { FOOT_OPTIONS, SPORT_OPTIONS } from '@/components/admin/entity-form/constants';
import { MultiNationalityPicker } from '@/components/admin/entity-form/MultiNationalityPicker';
import { MultiPositionSelect } from '@/components/admin/entity-form/MultiPositionSelect';
import { CustomSelect } from '@/components/admin/entity-form/CustomSelect';
import { StatsEditor } from '@/components/admin/entity-form/StatsEditor';
import { AchievementsEditor } from '@/components/admin/entity-form/AchievementsEditor';
import {
  ArrowLeft, Save, User, UserCircle, BarChart3, Trophy,
  Image as ImageIcon, Layers, Database,
} from 'lucide-react';

export const metadata = {
  title: 'Thêm Mới Cầu Thủ / VĐV | CMS',
};

export default async function NewEntityPage() {
  const clubs = await prisma.club.findMany({ orderBy: { name: 'asc' } });

  const CLUB_OPTIONS = [
    { value: '', label: '— Cầu thủ tự do / Không CLB —' },
    ...clubs.map(c => ({ value: c.id, label: `${c.name} (${c.sportType})` })),
  ];

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <form action={createEntity}>

        {/* PAGE HEADER */}
        <div className="relative mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 p-6 shadow-lg shadow-emerald-200">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          />
          <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/entities"
                className="p-2.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🏟️</span>
                  <h1 className="text-2xl xl:text-3xl font-black text-white tracking-tight">
                    Thêm Mới Cầu Thủ / VĐV
                  </h1>
                </div>
                <p className="text-emerald-100 font-medium text-sm pl-9">
                  Kho dữ liệu trung tâm — Tạo mới hồ sơ nhân vật
                </p>
              </div>
            </div>
            <Button
              type="submit"
              className="h-10 bg-white text-emerald-700 hover:bg-emerald-50 font-bold shadow-sm border border-white/60 px-5 xl:shrink-0"
            >
              <Save className="w-4 h-4 mr-1.5" /> Lưu Hồ Sơ VĐV
            </Button>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN */}
          <div className="xl:col-span-8 space-y-5">

            {/* 1. DANH TÍNH */}
            <FormSection
              icon={<User className="w-4 h-4" />}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-100"
              title="Thông tin danh tính"
              description="Tên hiển thị, đường dẫn và hình ảnh đại diện"
            >
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="name" required>Tên Cầu Thủ</Label>
                    <Input id="name" type="text" name="name" required placeholder="VD: Bukayo Saka" />
                  </div>
                  <div>
                    <Label htmlFor="slug" required>Slug (Đường dẫn)</Label>
                    <Input id="slug" type="text" name="slug" required placeholder="VD: bukayo-saka" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="avatar" className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> Avatar URL
                  </Label>
                  <Input id="avatar" type="url" name="avatar" placeholder="https://..." />
                </div>
              </div>
            </FormSection>

            {/* 2. THÔNG TIN CÁ NHÂN */}
            <FormSection
              icon={<UserCircle className="w-4 h-4" />}
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
              title="Thông tin cá nhân"
              description="Họ tên đầy đủ và ngày sinh"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="basicInfo_fullName">Họ và Tên đầy đủ</Label>
                  <Input
                    id="basicInfo_fullName"
                    name="basicInfo_fullName"
                    placeholder="VD: Bukayo Ayoyinka Saka"
                  />
                </div>
                <div>
                  <Label htmlFor="basicInfo_birthDate">Ngày sinh</Label>
                  <Input id="basicInfo_birthDate" type="date" name="basicInfo_birthDate" />
                </div>
              </div>
            </FormSection>

            {/* 3. DỮ LIỆU CẦU THỦ */}
            <FormSection
              icon={<Database className="w-4 h-4" />}
              iconColor="text-orange-600"
              iconBg="bg-orange-100"
              title="Dữ liệu cầu thủ"
              description="Quốc tịch, vị trí và các chỉ số thể chất"
            >
              <div className="space-y-5">
                <div>
                  <Label>
                    Quốc tịch{' '}
                    <span className="text-xs font-normal text-slate-400">
                      (chọn nhiều · đầu tiên là quốc tịch chính ⭐)
                    </span>
                  </Label>
                  <MultiNationalityPicker name="basicInfo_nationality" />
                </div>

                <div>
                  <Label>
                    Vị trí (Position){' '}
                    <span className="text-xs font-normal text-slate-400">
                      (chọn nhiều · đầu tiên là vị trí chính ⭐)
                    </span>
                  </Label>
                  <MultiPositionSelect name="basicInfo_position" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 border-t border-slate-100">
                  <div>
                    <Label htmlFor="basicInfo_height">Chiều cao (cm)</Label>
                    <Input id="basicInfo_height" type="number" name="basicInfo_height" placeholder="VD: 178" />
                  </div>
                  <div>
                    <Label htmlFor="basicInfo_shirtNumber">Số áo</Label>
                    <Input id="basicInfo_shirtNumber" type="number" name="basicInfo_shirtNumber" placeholder="VD: 7" />
                  </div>
                  <div>
                    <Label htmlFor="basicInfo_preferredFoot">Chân thuận</Label>
                    <CustomSelect
                      name="basicInfo_preferredFoot"
                      options={FOOT_OPTIONS}
                      placeholder="-- Chọn --"
                    />
                  </div>
                  <div>
                    <Label htmlFor="basicInfo_playerValue">Giá trị chuyển nhượng (€)</Label>
                    <Input id="basicInfo_playerValue" name="basicInfo_playerValue" placeholder="VD: 147M" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="basicInfo_contractUntil">Hạn hợp đồng</Label>
                    <Input id="basicInfo_contractUntil" type="date" name="basicInfo_contractUntil" />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* 4. STATS */}
            <FormSection
              icon={<BarChart3 className="w-4 h-4" />}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
              title="Stats & Radar"
              description="Chỉ số kỹ thuật — kéo thanh trượt để chỉnh"
            >
              <StatsEditor name="stats" />
            </FormSection>

            {/* 5. THÀNH TÍCH */}
            <FormSection
              icon={<Trophy className="w-4 h-4" />}
              iconColor="text-amber-600"
              iconBg="bg-amber-100"
              title="Thành tích"
              description="Danh hiệu và giải thưởng — thêm từng dòng"
            >
              <AchievementsEditor name="achievements" />
            </FormSection>

          </div>

          {/* RIGHT COLUMN */}
          <div className="xl:col-span-4 space-y-5 xl:sticky xl:top-6">

            {/* TỔ CHỨC & PHÂN LOẠI */}
            <FormSection
              icon={<Layers className="w-4 h-4" />}
              iconColor="text-slate-600"
              iconBg="bg-slate-100"
              title="Tổ chức & Phân loại"
              bodyClassName="p-5 space-y-4"
            >
              <div>
                <Label>Môn thể thao</Label>
                <CustomSelect
                  name="type"
                  options={SPORT_OPTIONS}
                  defaultValue="FOOTBALL_PLAYER"
                />
              </div>
              <div>
                <Label>Câu Lạc Bộ trực thuộc</Label>
                <CustomSelect
                  name="clubId"
                  options={CLUB_OPTIONS}
                  placeholder="— Cầu thủ tự do —"
                />
              </div>
            </FormSection>

            {/* SAVE */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-500 rounded-2xl p-5 shadow-lg shadow-emerald-200">
              <Button
                type="submit"
                className="w-full h-12 bg-white text-emerald-700 hover:bg-emerald-50 font-bold text-base shadow-sm border-0"
              >
                <Save className="w-5 h-5 mr-2" /> Lưu Hồ Sơ VĐV
              </Button>
              <p className="text-xs text-center text-emerald-100 mt-3 leading-relaxed">
                Nếu sử dụng công cụ Crawl Wikipedia,<br />các trường sẽ được AI điền tự động.
              </p>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
