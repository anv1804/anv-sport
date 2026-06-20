import { Bot } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export function PostAiAssistant({
  isOpen,
  onClose,
  aiTitle,
  setAiTitle,
  aiUrl,
  setAiUrl,
  aiError,
  isGenerating,
  aiProgress,
  aiMode,
  setAiMode,
  handleAiGenerate
}: {
  isOpen: boolean;
  onClose: () => void;
  aiTitle: string;
  setAiTitle: (val: string) => void;
  aiUrl: string;
  setAiUrl: (val: string) => void;
  aiError: string | null;
  isGenerating: boolean;
  aiProgress: number;
  aiMode: 'normal' | 'prediction';
  setAiMode: (val: 'normal' | 'prediction') => void;
  handleAiGenerate: () => void;
}) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={<><Bot className="w-6 h-6 mr-2 text-indigo-600" /> Trợ lý AI bóc tách bài viết</>}
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy bỏ</Button>
          <Button 
            variant="gradient" 
            onClick={handleAiGenerate} 
            disabled={isGenerating || !aiTitle}
            isLoading={isGenerating}
          >
            {!isGenerating && <Bot className="w-4 h-4 mr-2" />}
            {isGenerating ? "Đang xử lý..." : "Tiến hành xào nấu"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label required>Chế độ sinh nội dung</Label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input 
                type="radio" 
                name="aiMode" 
                value="normal" 
                checked={aiMode === 'normal'} 
                onChange={() => setAiMode('normal')} 
              />
              Tin tức thông thường
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input 
                type="radio" 
                name="aiMode" 
                value="prediction" 
                checked={aiMode === 'prediction'} 
                onChange={() => setAiMode('prediction')} 
              />
              Dự đoán trận đấu
            </label>
          </div>
        </div>

        <div>
          <Label required>Tiêu đề định hướng / Tên Trận đấu</Label>
          <Input 
            value={aiTitle}
            onChange={(e) => setAiTitle(e.target.value)}
            placeholder={aiMode === 'prediction' ? "VD: Tây Ban Nha vs Anh, Chung kết Euro" : "Ví dụ: Đội tuyển Tây Ban Nha thắng dễ dàng..."}
          />
        </div>
        
        <div>
          <Label>Link bài báo gốc (Tham khảo)</Label>
          <Input 
            type="url" 
            value={aiUrl}
            onChange={(e) => setAiUrl(e.target.value)}
            placeholder="https://vnexpress.net/..."
          />
          <p className="text-xs text-slate-500 mt-1.5">AI sẽ tự động đọc nội dung từ link này và xào nấu lại theo tiêu đề bạn cung cấp phía trên.</p>
        </div>

        {aiError && (
          <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 leading-relaxed mt-4">
            {aiError}
          </div>
        )}
        
        {isGenerating && (
          <div className="w-full mt-4">
            <div className="flex justify-between text-xs text-indigo-700 font-bold mb-1">
              <span>Đang xào nấu dữ liệu...</span>
              <span>{aiProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${aiProgress}%` }}></div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
