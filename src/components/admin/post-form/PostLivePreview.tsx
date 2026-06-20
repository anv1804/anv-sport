import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { X, Search, MessageCircle, Globe, ChevronDown, MoreHorizontal, ThumbsUp, MessageSquare, Share2, Smartphone } from 'lucide-react'

export function PostLivePreview({
  isOpen,
  onClose,
  formData,
  metadata
}: {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  metadata: any;
}) {
  const [activeTab, setActiveTab] = useState<'google' | 'facebook' | 'zalo'>('google');

  // Fallback data mapping
  const title = metadata?.seoTitle || formData?.title || 'Tiêu đề bài viết';
  const url = metadata?.seoUrl ? `https://anvsport.vn/${metadata.seoUrl}` : 'https://anvsport.vn/bai-viet-moi';
  const description = metadata?.seoDescription || formData?.excerpt || 'Mô tả ngắn của bài viết sẽ hiển thị ở đây. Hãy viết một đoạn mô tả hấp dẫn để thu hút độc giả click vào bài viết của bạn.';
  const fbTitle = metadata?.fbTitle || title;
  const fbImage = metadata?.fbImage || metadata?.abImageUrl || formData?.imageUrl || 'https://via.placeholder.com/1200x630.png?text=No+Image';
  const fbDescription = metadata?.fbDescription || description;

  const truncate = (str: string, max: number) => {
    if (!str) return '';
    return str.length > max ? str.substring(0, max) + '...' : str;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xem trước hiển thị (Live Preview)" maxWidth="2xl">
      <div className="flex flex-col h-[70vh] max-h-[800px]">
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 shrink-0 px-6 pt-4">
          <button
            onClick={() => setActiveTab('google')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'google' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Search className="w-4 h-4" /> Google
          </button>
          <button
            onClick={() => setActiveTab('facebook')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'facebook' ? 'border-[#1877f2] text-[#1877f2]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Facebook
          </button>
          <button
            onClick={() => setActiveTab('zalo')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'zalo' ? 'border-[#0068ff] text-[#0068ff]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageCircle className="w-4 h-4" /> Zalo
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex justify-center">
          
          {/* GOOGLE TAB */}
          {activeTab === 'google' && (
            <div className="w-full max-w-[600px] bg-white p-6 rounded-lg shadow-sm border border-gray-200 self-start">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                  <Globe className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <div className="text-[14px] text-[#202124] flex items-center gap-2">
                    ANV Sport <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-[12px] text-[#4d5156] truncate max-w-[400px]">
                    {url}
                  </div>
                </div>
              </div>
              <h3 className="text-[20px] text-[#1a0dab] hover:underline cursor-pointer font-medium leading-[1.3] mb-1">
                {title}
              </h3>
              <p className="text-[14px] text-[#4d5156] leading-[1.58] line-clamp-2">
                <span className="text-[#70757a] mr-1">{new Date().toLocaleDateString('vi-VN')} —</span>
                {description}
              </p>
              
              <div className="mt-6 pt-6 border-t border-dashed border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 mb-2">Gợi ý tối ưu SEO:</h4>
                <ul className="text-xs space-y-1.5 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${title.length >= 40 && title.length <= 60 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    Tiêu đề SEO ({title.length} ký tự): Khuyên dùng 40-60 ký tự.
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${description.length >= 120 && description.length <= 155 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    Mô tả SEO ({description.length} ký tự): Khuyên dùng 120-155 ký tự.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* FACEBOOK TAB */}
          {activeTab === 'facebook' && (
            <div className="w-full max-w-[500px] bg-white rounded-lg shadow-sm border border-gray-200 self-start overflow-hidden flex flex-col font-[system-ui]">
              {/* Fake FB Header */}
              <div className="p-3 flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                <div>
                  <div className="font-bold text-[15px] leading-tight">Fanpage Báo Thể Thao</div>
                  <div className="text-[13px] text-gray-500 flex items-center gap-1">Vừa xong · <Globe className="w-3 h-3" /></div>
                </div>
              </div>
              
              <div className="px-3 pb-3 text-[15px]">
                Theo dõi bài viết mới nhất trên ANV Sport nhé mọi người! 👇
              </div>

              {/* FB Card */}
              <div className="border-t border-b border-gray-200 cursor-pointer bg-[#f2f3f5] hover:bg-[#ebedf0] transition-colors">
                <div className="w-full aspect-[1.91/1] overflow-hidden bg-white border-b border-gray-200">
                  <img src={fbImage} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="p-3 pb-4">
                  <div className="text-[12px] text-[#65676B] uppercase uppercase mb-0.5 tracking-wide">ANVSPORT.VN</div>
                  <h3 className="font-bold text-[16px] text-[#050505] leading-snug line-clamp-2 mb-1">
                    {fbTitle}
                  </h3>
                  <p className="text-[14px] text-[#65676B] line-clamp-1">
                    {truncate(fbDescription, 80)}
                  </p>
                </div>
              </div>
              
              {/* Fake FB Footer */}
              <div className="px-4 py-2 border-b border-gray-200 text-[13px] text-gray-500 flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"><ThumbsUp className="w-2.5 h-2.5 text-white" /></div> 
                1.2K
              </div>
              <div className="flex px-2 py-1">
                <div className="flex-1 flex justify-center items-center gap-2 py-2 text-gray-500 font-medium text-[14px] hover:bg-gray-100 rounded-md cursor-pointer"><ThumbsUp className="w-5 h-5" /> Thích</div>
                <div className="flex-1 flex justify-center items-center gap-2 py-2 text-gray-500 font-medium text-[14px] hover:bg-gray-100 rounded-md cursor-pointer"><MessageSquare className="w-5 h-5" /> Bình luận</div>
                <div className="flex-1 flex justify-center items-center gap-2 py-2 text-gray-500 font-medium text-[14px] hover:bg-gray-100 rounded-md cursor-pointer"><Share2 className="w-5 h-5" /> Chia sẻ</div>
              </div>
            </div>
          )}

          {/* ZALO TAB */}
          {activeTab === 'zalo' && (
            <div className="w-full max-w-[400px] bg-[#e2e8f0] p-4 rounded-lg self-start flex flex-col gap-4 font-[system-ui]">
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-full bg-white shrink-0 shadow-sm"></div>
                <div className="bg-white rounded-xl rounded-tl-sm shadow-sm overflow-hidden w-full max-w-[280px]">
                  <div className="w-full aspect-[1.91/1] overflow-hidden border-b border-gray-100">
                    <img src={fbImage} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-[15px] text-gray-900 leading-snug line-clamp-2 mb-1.5">
                      {fbTitle}
                    </h3>
                    <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed">
                      {truncate(fbDescription, 100)}
                    </p>
                    <div className="mt-2 text-[11px] text-gray-400 font-medium border-t border-gray-100 pt-2 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> anvsport.vn
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </Modal>
  )
}
