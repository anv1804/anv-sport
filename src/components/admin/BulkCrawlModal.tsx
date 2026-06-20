"use client";

import { useState, useRef } from "react";
import { X, Upload, Link as LinkIcon, ListPlus, Loader2, CheckCircle, AlertCircle, Play } from "lucide-react";
import { extractLinksFromCategory, bulkCrawlAndSavePost } from "@/app/admin/(dashboard)/posts/actions";
import { CustomSelect } from "@/components/admin/entity-form/CustomSelect";
import { useAlert } from "@/components/providers/ConfirmProvider";

export default function BulkCrawlModal({ isOpen, onClose, categories = [] }: { isOpen: boolean; onClose: () => void; categories?: { slug: string; name: string }[] }) {
  const alert = useAlert();
  const [activeTab, setActiveTab] = useState<"paste" | "upload" | "category">("paste");
  const [linksText, setLinksText] = useState("");
  const [categoryUrl, setCategoryUrl] = useState("");
  const [targetStatus, setTargetStatus] = useState("DRAFT");
  const [targetCategory, setTargetCategory] = useState("");
  const [isForeign, setIsForeign] = useState(false);
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [crawlQueue, setCrawlQueue] = useState<{ url: string; status: "pending" | "crawling" | "success" | "error"; message?: string }[]>([]);
  const [isCrawling, setIsCrawling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExtractCategory = async () => {
    if (!categoryUrl) return;
    setIsExtracting(true);
    const res = await extractLinksFromCategory(categoryUrl);
    setIsExtracting(false);
    if (res.success && res.links) {
      setLinksText(res.links.join("\n"));
      setActiveTab("paste");
    } else {
      await alert(res.error || "Lỗi trích xuất link");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setLinksText(text);
      setActiveTab("paste");
    };
    reader.readAsText(file);
  };

  const startCrawl = async () => {
    let urlsToCrawl: string[] = [];

    // Nếu đang ở tab Category mà chưa trích xuất, tự động trích xuất luôn
    if (activeTab === "category" && categoryUrl && !linksText) {
      setIsExtracting(true);
      const res = await extractLinksFromCategory(categoryUrl);
      setIsExtracting(false);
      if (res.success && res.links && res.links.length > 0) {
        urlsToCrawl = res.links;
        setLinksText(res.links.join("\n"));
        // Cố tình chuyển tab sang paste để user thấy tiến độ
        setActiveTab("paste");
      } else {
        await alert(res.error || "Không tìm thấy link bài viết nào trong chuyên mục này.");
        return;
      }
    } else {
      urlsToCrawl = linksText.split("\n").map(l => l.trim()).filter(l => l.startsWith("http"));
    }

    if (urlsToCrawl.length === 0) {
      await alert("Vui lòng nhập ít nhất 1 link hợp lệ hoặc trích xuất thành công từ chuyên mục.");
      return;
    }

    const queue = urlsToCrawl.map(url => ({ url, status: "pending" as const }));
    setCrawlQueue(queue);
    setIsCrawling(true);

    let currentIndex = 0;
    while (currentIndex < queue.length) {
      let success = false;
      let attempt = 1;
      let res: any;
      let movedToBack = false;

      while (!success) {
        // Update UI to crawling
        queue[currentIndex].status = "crawling";
        queue[currentIndex].message = attempt > 1 ? `Đang thử lại lần ${attempt}...` : undefined;
        setCrawlQueue([...queue]);
        
        res = await bulkCrawlAndSavePost(queue[currentIndex].url, targetStatus, targetCategory, isForeign);
        
        if (res.success) {
          success = true;
        } else {
          const isAiError = res.error?.includes("AI provider") || res.error?.includes("lỗi liên tục") || res.error?.includes("quota") || res.error?.includes("quá tải") || res.error?.includes("fetch");
          
          if (isAiError) {
            if (attempt >= 3) {
              // Di chuyển item hiện tại xuống cuối hàng đợi
              const itemToMove = queue.splice(currentIndex, 1)[0];
              itemToMove.status = "pending";
              itemToMove.message = undefined; // Clear message
              queue.push(itemToMove);
              
              // Cập nhật lại UI ngay lập tức
              setCrawlQueue([...queue]);
              movedToBack = true;
              break; // Thoát vòng lặp while(!success)
            } else {
              attempt++;
              queue[currentIndex].status = "error";
              queue[currentIndex].message = `Lỗi AI. Chờ 5s tự động thử lại lần ${attempt}...`;
              setCrawlQueue([...queue]);
              await new Promise(r => setTimeout(r, 5000));
            }
          } else {
            break; // Non-retryable error
          }
        }
      }
      
      if (!movedToBack) {
        // Nếu không bị đẩy xuống cuối, cập nhật kết quả và đi tiếp
        queue[currentIndex].status = res?.success ? "success" : "error";
        queue[currentIndex].message = res?.success ? res.post?.title : res?.error;
        setCrawlQueue([...queue]);
        
        currentIndex++; // Tiến tới item tiếp theo
        
        // Nhỏ giọt delay 2s giữa các bài để tránh bị block API/Rate limit
        await new Promise(r => setTimeout(r, 2000));
      } else {
        // Nếu đã bị đẩy xuống cuối, currentIndex giữ nguyên (vì phần tử tiếp theo đã trượt vào vị trí này)
        // Delay 1 chút trước khi chạy bài tiếp theo
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    
    setIsCrawling(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Crawl Dữ Liệu Hàng Loạt</h2>
            <p className="text-sm text-slate-500 mt-1">Tự động lấy bài viết và dùng AI sinh nội dung</p>
          </div>
          <button onClick={onClose} disabled={isCrawling} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          
          {/* Tabs */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 p-1 bg-slate-100 rounded-lg w-full sm:w-fit overflow-x-auto">
            <button onClick={() => setActiveTab("paste")} className={`flex-1 sm:flex-initial px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === "paste" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}>
              <ListPlus className="w-4 h-4" /> Dán Link
            </button>
            <button onClick={() => setActiveTab("upload")} className={`flex-1 sm:flex-initial px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === "upload" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}>
              <Upload className="w-4 h-4" /> Tải File
            </button>
            <button onClick={() => setActiveTab("category")} className={`flex-1 sm:flex-initial px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === "category" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}>
              <LinkIcon className="w-4 h-4" /> Quét Chuyên Mục
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex flex-col gap-4">
            {activeTab === "paste" && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Danh sách Link (mỗi dòng 1 link)</label>
                <textarea 
                  value={linksText}
                  onChange={(e) => setLinksText(e.target.value)}
                  placeholder="https://vnexpress.net/bai-viet-1.html&#10;https://vnexpress.net/bai-viet-2.html"
                  className="w-full h-40 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-sm"
                  disabled={isCrawling}
                />
              </div>
            )}

            {activeTab === "upload" && (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center bg-slate-50">
                <Upload className="w-10 h-10 text-slate-400 mb-4" />
                <h3 className="font-bold text-slate-700 mb-1">Tải lên file danh sách link</h3>
                <p className="text-sm text-slate-500 mb-4">Hỗ trợ file .txt, mỗi dòng chứa 1 link bài báo.</p>
                <input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                  Chọn File TXT
                </button>
              </div>
            )}

            {activeTab === "category" && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                <label className="block text-sm font-bold text-slate-700 mb-2">Link Trang Chuyên Mục (VnExpress)</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="url" 
                    value={categoryUrl}
                    onChange={(e) => setCategoryUrl(e.target.value)}
                    placeholder="VD: https://vnexpress.net/the-thao"
                    className="flex-1 px-4 py-2.5 border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-500 w-full"
                    disabled={isExtracting || isCrawling}
                  />
                  <button 
                    onClick={handleExtractCategory}
                    disabled={isExtracting || isCrawling || !categoryUrl}
                    className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto"
                  >
                    {isExtracting ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang quét...</> : "Trích xuất link"}
                  </button>
                </div>
                <p className="text-sm text-emerald-600 mt-3 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Hệ thống sẽ quét tối đa 50 bài viết gần nhất trong chuyên mục.
                </p>
              </div>
            )}
          </div>

          {/* Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex flex-col gap-1.5 z-20">
              <label className="text-sm font-bold text-slate-700">Trạng thái lưu bài:</label>
              <CustomSelect
                options={[
                  { value: 'DRAFT', label: 'Lưu Nháp (DRAFT)', icon: '📝' },
                  { value: 'PUBLISHED', label: 'Xuất bản luôn (PUBLISHED)', icon: '🚀' }
                ]}
                value={targetStatus}
                onChange={setTargetStatus}
                disabled={isCrawling}
                placeholder="Chọn trạng thái"
                menuPlacement="top"
              />
            </div>
            
            <div className="flex flex-col gap-1.5 z-10">
              <label className="text-sm font-bold text-slate-700">Chuyên mục mặc định:</label>
              <CustomSelect
                options={[
                  { value: '', label: '-- Chưa phân loại --' },
                  ...categories.map(c => ({ value: c.slug, label: c.name }))
                ]}
                value={targetCategory}
                onChange={setTargetCategory}
                disabled={isCrawling}
                placeholder="-- Chưa phân loại --"
                menuPlacement="top"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 px-1">
            <input 
              type="checkbox" 
              id="isForeign" 
              checked={isForeign} 
              onChange={(e) => setIsForeign(e.target.checked)}
              disabled={isCrawling}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="isForeign" className="text-sm font-medium text-slate-700 cursor-pointer">
              Đây là trang báo nước ngoài (Tự động dịch sang Tiếng Việt)
            </label>
          </div>

          {/* Progress Queue */}
          {crawlQueue.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-sm font-bold text-slate-700 flex justify-between">
                <span>Tiến trình Crawl</span>
                <span>{crawlQueue.filter(q => q.status === "success").length} / {crawlQueue.length} Hoàn thành</span>
              </div>
              <div className="max-h-60 overflow-y-auto p-4 flex flex-col gap-3">
                {crawlQueue.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    {item.status === "pending" && <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0 mt-0.5" />}
                    {item.status === "crawling" && <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0 mt-0.5" />}
                    {item.status === "success" && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
                    {item.status === "error" && <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-600 truncate" title={item.url}>{item.url}</p>
                      {item.message && (
                        <p className={`text-[12px] mt-0.5 ${item.status === "success" ? "text-emerald-600 font-medium" : "text-red-500"}`}>
                          {item.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
          <button 
            onClick={onClose} 
            disabled={isCrawling}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-white border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Đóng
          </button>
          <button 
            onClick={startCrawl}
            disabled={isCrawling || (!linksText && activeTab !== 'category')}
            className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCrawling ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang Crawl...</> : <><Play className="w-4 h-4" /> Bắt đầu Crawl</>}
          </button>
        </div>
      </div>
    </div>
  );
}
