'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Save, Info, Wand2, ChevronDown, ArrowLeft } from 'lucide-react';
import { extractWikipediaClub, createClub, updateClub } from './actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

import { CustomSelect } from '@/components/admin/entity-form/CustomSelect';

export function ClubFormClient({ club, sports = [], countries = [], leagues = [] }: { club?: any, sports?: any[], countries?: any[], leagues?: any[] }) {
  const router = useRouter();
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [achievementSearchQuery, setAchievementSearchQuery] = useState('');
  const [isAchievementsExpanded, setIsAchievementsExpanded] = useState(true);
  
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const [formData, setFormData] = useState({
    name: club?.name || '',
    slug: club?.slug || '',
    logo: club?.logo || '',
    sportType: club?.sportType || 'FOOTBALL',
    countryId: club?.countryId || '',
    leagueId: club?.leagueId || '',
    wikiUrl: club?.wikiUrl || '',
  });

  const [basicInfo, setBasicInfo] = useState(() => {
    try {
      return club?.basicInfo ? JSON.parse(club.basicInfo) : {
        fullName: '',
        nickname: '',
        formedYear: '',
        stadium: '',
        stadiumCapacity: '',
        manager: '',
        website: '',
        description: ''
      };
    } catch {
      return { fullName: '', nickname: '', formedYear: '', stadium: '', stadiumCapacity: '', manager: '', website: '', description: '' };
    }
  });

  const [achievements, setAchievements] = useState<{league: string, rank: string, year: string}[]>(() => {
    try {
      return club?.achievements ? JSON.parse(club.achievements) : [];
    } catch {
      return [];
    }
  });

  const filteredAchievements = achievements.filter(ach => 
    ach.league.toLowerCase().includes(achievementSearchQuery.toLowerCase()) || 
    ach.year.toLowerCase().includes(achievementSearchQuery.toLowerCase()) ||
    ach.rank.toLowerCase().includes(achievementSearchQuery.toLowerCase())
  );

  const generateSlug = (str: string) => {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, name: val, slug: generateSlug(val) }));
  };

  const handleExtract = async () => {
    if (!formData.wikiUrl) {
      setError('Vui lòng nhập link Wikipedia hoặc tên đội bóng');
      return;
    }
    setIsExtracting(true);
    setError('');

    try {
      const result = await extractWikipediaClub(formData.wikiUrl);
      if (result.success && result.data) {
        let matchedCountryId = formData.countryId;
        let matchedLeagueId = formData.leagueId;

        if (!matchedCountryId) {
          if (result.data.country) {
            const c = countries.find(x => result.data.country.toLowerCase().includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(result.data.country.toLowerCase()));
            if (c) matchedCountryId = c.id;
          }
          if (!matchedCountryId && result.data.country) {
            const c = countries.find(x => x.slug.toLowerCase() === result.data.country.toLowerCase() || result.data.country.toLowerCase().includes(x.slug.toLowerCase()));
            if (c) matchedCountryId = c.id;
          }
        }
        
        if (result.data.league) {
          const leagueText = result.data.league.toLowerCase();
          const leagueAliases: {[key: string]: string} = {
            'ngoại hạng anh': 'premier league',
            'hạng nhất anh': 'efl championship',
            'hạng ba anh': 'efl league one',
            'vô địch quốc gia tây ban nha': 'la liga',
            'hạng nhất tây ban nha': 'la liga',
            'hạng hai tây ban nha': 'segunda división',
            'vô địch quốc gia ý': 'serie a',
            'vô địch quốc gia italia': 'serie a',
            'vô địch quốc gia đức': 'bundesliga',
            'hạng hai đức': '2. bundesliga',
            'vô địch quốc gia pháp': 'ligue 1',
            'hạng hai pháp': 'ligue 2',
            'v.league 1': 'v.league 1',
            'v.league 2': 'v.league 2',
            'v-league': 'v.league 1',
            'hạng nhất quốc gia': 'v.league 2'
          };
          
          let searchStr = leagueText;
          for (const [alias, realName] of Object.entries(leagueAliases)) {
            if (leagueText.includes(alias)) {
              searchStr = realName;
              break;
            }
          }

          const l = leagues.find(x => searchStr.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(searchStr) || x.slug.toLowerCase().includes(searchStr));
          if (l) matchedLeagueId = l.id;
          else {
            const lOrig = leagues.find(x => leagueText.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(leagueText) || leagueText.includes(x.slug.toLowerCase()));
            if (lOrig) matchedLeagueId = lOrig.id;
          }
        }

        // If country is missing but league is found, infer country from league
        if (!matchedCountryId && matchedLeagueId) {
          const l = leagues.find(x => x.id === matchedLeagueId);
          if (l && l.countryId) {
            matchedCountryId = l.countryId;
          }
        }
        
        if (!matchedLeagueId && matchedCountryId) {
           const l = leagues.find(x => x.countryId === matchedCountryId);
           if (l) matchedLeagueId = l.id;
        }

        if (result.data.achievements && result.data.achievements.length > 0) {
          setAchievements(result.data.achievements);
        }

        setFormData(prev => ({
          ...prev,
          name: result.data.name,
          slug: generateSlug(result.data.name),
          logo: result.data.logo || prev.logo,
          countryId: matchedCountryId || prev.countryId,
          leagueId: matchedLeagueId || prev.leagueId
        }));
        
        try {
          if (result.data.basicInfo) {
            const parsedBasicInfo = JSON.parse(result.data.basicInfo);
            setBasicInfo((prev: any) => ({ ...prev, ...parsedBasicInfo }));
          }
        } catch (e) {}

        setIsDirty(true);
        toast.success("Trích xuất thông tin thành công!");
      } else {
        toast.error(result.error || 'Có lỗi xảy ra khi lấy dữ liệu');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const fd = new FormData();
    fd.append('name', formData.name);
    fd.append('slug', formData.slug);
    fd.append('logo', formData.logo);
    fd.append('sportType', formData.sportType);
    fd.append('countryId', formData.countryId);
    fd.append('leagueId', formData.leagueId);
    fd.append('wikiUrl', formData.wikiUrl);
    fd.append('basicInfo', JSON.stringify(basicInfo));
    fd.append('achievements', JSON.stringify(achievements));

    try {
      if (club) {
        await updateClub(club.id, fd);
        toast.success("Cập nhật Câu lạc bộ thành công!");
      } else {
        await createClub(fd);
        toast.success("Thêm Câu lạc bộ thành công!");
      }
      setIsDirty(false); // Reset dirty state on successful save
      router.push('/admin/clubs');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      setShowUnsavedModal(true);
    } else {
      router.back();
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{club ? 'Sửa Câu Lạc Bộ' : 'Thêm Mới Câu Lạc Bộ'}</h1>
          <p className="text-slate-500 font-medium text-[13px] mt-1">
            {club ? 'Chỉnh sửa thông tin đội bóng hoặc cập nhật tự động từ Wikipedia' : 'Nhập thủ công hoặc tự động trích xuất thông tin từ Wikipedia'}
          </p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 max-w-[1400px] items-start">
        {/* MAIN FORM */}
        <div className="flex-1 w-full min-w-0">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative h-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 backdrop-blur-md sticky top-0 z-20">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Thông tin Câu lạc bộ
              </h2>
            </div>
        
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Tên Câu lạc bộ <span className="text-red-500">*</span></label>
              <Input 
                required 
                value={formData.name}
                onChange={handleNameChange}
                placeholder="Ví dụ: Liverpool" 
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Đường dẫn (Slug) <span className="text-red-500">*</span></label>
              <Input 
                required 
                value={formData.slug}
                onChange={e => { setFormData(prev => ({...prev, slug: e.target.value})); setIsDirty(true); }}
                className="h-11 bg-slate-50 font-mono text-[13px] text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Môn thể thao</label>
              <CustomSelect 
                value={formData.sportType}
                onChange={val => { setFormData(prev => ({...prev, sportType: val})); setIsDirty(true); }}
                options={sports.length > 0 
                  ? sports.map(s => ({ 
                      value: s.slug === 'bong-da' ? 'FOOTBALL' : s.slug === 'bida' ? 'BILLIARDS' : s.slug.toUpperCase().replace(/-/g, '_'), 
                      label: s.name 
                    }))
                  : [
                      { value: 'FOOTBALL', label: 'Bóng đá' },
                      { value: 'BILLIARDS', label: 'Billiards' }
                    ]
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Quốc gia</label>
              <CustomSelect 
                options={[{value: '', label: '-- Chọn Quốc gia --'}, ...countries.map(c => ({value: c.id, label: c.name, image: c.flag}))]}
                value={formData.countryId}
                onChange={val => { setFormData(prev => ({...prev, countryId: val, leagueId: ''})); setIsDirty(true); }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Giải đấu</label>
              <CustomSelect 
                options={[{value: '', label: '-- Chọn Giải đấu --'}, ...leagues.filter(l => !formData.countryId || l.countryId === formData.countryId).map(l => ({value: l.id, label: l.name, image: l.logo}))]}
                value={formData.leagueId}
                onChange={val => { setFormData(prev => ({...prev, leagueId: val})); setIsDirty(true); }}
              />
            </div>
          </div>

          {/* BASIC INFO FIELDS */}
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600" />
              Thông tin chi tiết
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Tên đầy đủ</label>
                <Input 
                  value={basicInfo.fullName || ''}
                  onChange={e => { setBasicInfo((prev: any) => ({...prev, fullName: e.target.value})); setIsDirty(true); }}
                  placeholder="Ví dụ: Liverpool Football Club" 
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Biệt danh</label>
                <Input 
                  value={basicInfo.nickname || ''}
                  onChange={e => { setBasicInfo((prev: any) => ({...prev, nickname: e.target.value})); setIsDirty(true); }}
                  placeholder="Ví dụ: The Reds" 
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Năm thành lập</label>
                <Input 
                  type="date"
                  value={basicInfo.formedYear}
                  onChange={e => { setBasicInfo((prev: any) => ({...prev, formedYear: e.target.value})); setIsDirty(true); }}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Sân vận động</label>
                <Input 
                  value={basicInfo.stadium || ''}
                  onChange={e => { setBasicInfo((prev: any) => ({...prev, stadium: e.target.value})); setIsDirty(true); }}
                  placeholder="Ví dụ: Anfield" 
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Sức chứa</label>
                <Input 
                  value={basicInfo.stadiumCapacity || ''}
                  onChange={e => { setBasicInfo((prev: any) => ({...prev, stadiumCapacity: e.target.value})); setIsDirty(true); }}
                  placeholder="Ví dụ: 61000" 
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">HLV Trưởng / Quản lý</label>
                <Input 
                  value={basicInfo.manager || ''}
                  onChange={e => { setBasicInfo((prev: any) => ({...prev, manager: e.target.value})); setIsDirty(true); }}
                  placeholder="Ví dụ: Arne Slot" 
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Website</label>
                <Input 
                  value={basicInfo.website || ''}
                  onChange={e => { setBasicInfo((prev: any) => ({...prev, website: e.target.value})); setIsDirty(true); }}
                  placeholder="Ví dụ: www.liverpoolfc.com" 
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Mô tả thêm</label>
              <textarea 
                value={basicInfo.description || ''}
                onChange={e => { setBasicInfo((prev: any) => ({...prev, description: e.target.value})); setIsDirty(true); }}
                className="w-full h-32 p-4 border border-slate-200 rounded-xl text-[13px] leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                placeholder="Thông tin giới thiệu về câu lạc bộ..."
                spellCheck={false}
              ></textarea>
            </div>
          </div>

          {/* ACHIEVEMENTS */}
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 
                className="text-[15px] font-bold text-slate-800 flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition-colors"
                onClick={() => setIsAchievementsExpanded(!isAchievementsExpanded)}
              >
                <Info className="w-5 h-5 text-emerald-500" />
                Hoạt động
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isAchievementsExpanded ? 'rotate-180' : ''}`} />
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={() => { setIsAchievementsExpanded(true); setAchievements(prev => [{ league: '', rank: '', year: '' }, ...prev]); setIsDirty(true); }} className="h-9">
                + Thêm hoạt động
              </Button>
            </div>
            
            {isAchievementsExpanded && (
              <>
                {achievements.length > 0 && (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <Input 
                      value={achievementSearchQuery}
                      onChange={(e) => setAchievementSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm theo giải đấu, năm, hạng..." 
                      className="pl-9 h-10 bg-slate-50/50"
                    />
                  </div>
                )}

                {achievements.length === 0 ? (
                  <div className="text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <p className="text-[13px] text-slate-500">Chưa có hoạt động nào được thêm.</p>
                  </div>
                ) : filteredAchievements.length === 0 ? (
                  <div className="text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <p className="text-[13px] text-slate-500">Không tìm thấy hoạt động phù hợp.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredAchievements.map((ach, filteredIdx) => {
                      const idx = achievements.indexOf(ach);
                      return (
                        <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="flex-1 space-y-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Giải đấu</label>
                            <Input 
                              value={ach.league}
                              onChange={e => { setAchievements(prev => { const arr = [...prev]; arr[idx].league = e.target.value; return arr; }); setIsDirty(true); }}
                              placeholder="VD: Premier League" 
                              className="h-9 bg-white"
                            />
                          </div>
                          <div className="w-[150px] space-y-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Hạng / Danh hiệu</label>
                            <Input 
                              value={ach.rank}
                              onChange={e => { setAchievements(prev => { const arr = [...prev]; arr[idx].rank = e.target.value; return arr; }); setIsDirty(true); }}
                              placeholder="VD: Vô địch" 
                              className="h-9 bg-white"
                            />
                          </div>
                          <div className="w-[100px] space-y-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Năm</label>
                            <Input 
                              value={ach.year}
                              onChange={e => { setAchievements(prev => { const arr = [...prev]; arr[idx].year = e.target.value; return arr; }); setIsDirty(true); }}
                              placeholder="VD: 2024" 
                              className="h-9 bg-white"
                            />
                          </div>
                          <div className="pt-6">
                            <button 
                              type="button"
                              onClick={() => { setAchievements(prev => prev.filter((_, i) => i !== idx)); setIsDirty(true); }}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50/90 backdrop-blur-md border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleBack}
            disabled={isSaving}
          >
            Hủy bỏ
          </Button>
          <Button type="submit" variant="success" disabled={isSaving} className="font-bold px-6">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? 'Đang lưu...' : (club ? 'Cập nhật CLB' : 'Tạo CLB mới')}
          </Button>
        </div>
      </form>
    </div>

    {/* SIDEBAR RIGHT */}
    <div className="w-full xl:w-[350px] shrink-0 space-y-6 sticky top-6">
      
      {/* LOGO UPLOAD / PREVIEW */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Ảnh đại diện (Logo)</h3>
        
        <div className="space-y-4">
          <div className="aspect-square w-full max-w-[200px] mx-auto bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center p-4 relative overflow-hidden">
            {formData.logo ? (
              <img src={formData.logo} alt="Preview" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center text-slate-400">
                <p className="text-sm font-medium">Chưa có ảnh</p>
                <p className="text-[11px] mt-1">Dán URL logo vào ô bên dưới</p>
              </div>
            )}
          </div>
          
          <Input 
            value={formData.logo}
            onChange={e => { setFormData(prev => ({...prev, logo: e.target.value})); setIsDirty(true); }}
            placeholder="https://... (URL Logo)" 
            className="w-full h-11 bg-slate-50 text-[13px]"
          />
        </div>
      </div>

      {/* Wikipedia / TheSportsDB Autofill Tool */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute -bottom-10 -right-10 p-4 opacity-5 pointer-events-none">
          <Wand2 className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h3 className="text-emerald-800 font-bold flex items-center gap-2 mb-2 text-base">
            <Wand2 className="w-5 h-5 text-emerald-600" /> 
            Tự động điền dữ liệu (TheSportsDB & Wikipedia)
          </h3>
          <p className="text-[13px] text-emerald-700/80 mb-5 leading-relaxed">
            Nhập <strong>Tên đội bóng bằng tiếng Anh</strong> (ví dụ: <em>Bayern Munich</em>) hoặc <strong>Link Wikipedia</strong>. Hệ thống sẽ tự động điền Tên, Logo, Sân vận động, Giải đấu, v.v.
          </p>
          <div className="flex flex-col gap-3">
            <Input 
              value={formData.wikiUrl}
              onChange={e => { setFormData(prev => ({...prev, wikiUrl: e.target.value})); setIsDirty(true); }}
              placeholder="Ví dụ: Bayern Munich hoặc https://vi.wikipedia.org/wiki/..." 
              className="w-full bg-white border-emerald-200 focus:border-emerald-500 shadow-sm text-[13px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleExtract();
                }
              }}
            />
            <Button 
              type="button"
              onClick={handleExtract}
              disabled={isExtracting}
              variant="success"
              className="w-full shadow-sm font-bold"
            >
              {isExtracting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              {isExtracting ? 'Đang truy vấn...' : 'Tìm kiếm & Trích xuất dữ liệu'}
            </Button>
          </div>
          {error && <div className="mt-3 text-[13px] font-medium text-red-600 bg-red-50 px-3 py-2 border border-red-100 rounded-lg block">{error}</div>}
        </div>
      </div>
    </div>
  </div>

  <Modal
    isOpen={showUnsavedModal}
    onClose={() => setShowUnsavedModal(false)}
    title="Cảnh báo chưa lưu"
    maxWidth="sm"
    footer={
      <>
        <Button variant="outline" onClick={() => setShowUnsavedModal(false)}>Hủy</Button>
        <Button onClick={() => router.push('/admin/clubs')} className="bg-red-600 hover:bg-red-700 text-white">
          Đồng ý thoát
        </Button>
      </>
    }
  >
    <p className="text-slate-600 text-[15px]">Bạn có những thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang này? Những thay đổi sẽ bị mất.</p>
  </Modal>
  </>
);
}
