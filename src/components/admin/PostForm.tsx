"use client";

import { useState, useEffect } from "react";
import { createPost, updatePost, generateArticleWithAI, searchPosts } from "@/app/admin/(dashboard)/posts/actions";
import { Save, ArrowLeft, Copy, Image as ImageIcon, ChevronDown, CheckCircle2, Bot, X, Search, Plus, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { TiptapEditor } from "@/components/admin/TiptapEditor";
import { evaluateSeo, SeoResult } from "@/lib/seo/evaluator";
import { PostCategoryFields } from "./post-form/PostCategoryFields";
import { PostSeoFields } from "./post-form/PostSeoFields";
import { PostAiAssistant } from "./post-form/PostAiAssistant";
import { PostLivePreview } from "./post-form/PostLivePreview";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

export function PostForm({ initialData, categories = [] }: { initialData?: any, categories?: any[] }) {
  const parsedMeta = initialData?.metadata ? JSON.parse(initialData.metadata) : {};
  const [metadata, setMetadata] = useState<any>(parsedMeta);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Xây dựng danh sách danh mục theo cấu trúc cha-con
  const buildCategoryOptions = (cats: any[], parentId: number | null = null, depth = 0): any[] => {
    let result: any[] = [];
    const children = cats.filter(c => c.parentId === parentId);
    for (const child of children) {
      result.push({ ...child, depth });
      result = result.concat(buildCategoryOptions(cats, child.id, depth + 1));
    }
    return result;
  };


  const categoryOptions = buildCategoryOptions(categories);
  
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    imageUrl: initialData?.imageUrl || "",
    status: initialData?.status || "DRAFT"
  });

  // Giả lập Autosave
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
        
        // Thêm vào history
        const newRevision = {
          id: Date.now(),
          time: new Date().toLocaleTimeString('vi-VN'),
          date: new Date().toLocaleDateString('vi-VN'),
          author: 'Hệ thống (Autosave)'
        };
        const revs = metadata.revisions || [];
        // Only trigger update if there is content to save
        if (formData.title) {
          setMetadata(prev => ({ ...prev, revisions: [newRevision, ...revs].slice(0, 5) }));
        }
      }, 500);
    }, 45000); // Autosave every 45s of inactivity

    return () => clearTimeout(timer);
  }, [formData, metadata]);

  // AI Assistant State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState(parsedMeta.aiTitle || initialData?.title || "");
  const [aiUrl, setAiUrl] = useState(parsedMeta.aiUrl || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingAiContent, setPendingAiContent] = useState<string | null>(null);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<'normal' | 'prediction'>('normal');
  const [tagInput, setTagInput] = useState("");

  // Related Posts States
  const [relatedQuery, setRelatedQuery] = useState('');
  const [relatedResults, setRelatedResults] = useState<any[]>([]);
  const [isSearchingRelated, setIsSearchingRelated] = useState(false);

  // Focus and handle related posts search
  useEffect(() => {
    if (!relatedQuery.trim()) {
      setRelatedResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingRelated(true);
      const results = await searchPosts(relatedQuery);
      // Lọc bỏ bài viết hiện tại (nếu đang ở trang Edit)
      const filtered = results.filter((p: any) => p.id !== initialData?.id);
      setRelatedResults(filtered);
      setIsSearchingRelated(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [relatedQuery]);

  const handleAddRelatedPost = (post: any) => {
    const currentRelated = metadata.relatedPosts || [];
    if (!currentRelated.find((p: any) => p.id === post.id)) {
      setMetadata({ ...metadata, relatedPosts: [...currentRelated, { id: post.id, title: post.title }] });
    }
    setRelatedQuery('');
    setRelatedResults([]);
  };

  const handleRemoveRelatedPost = (id: number) => {
    const currentRelated = metadata.relatedPosts || [];
    setMetadata({ ...metadata, relatedPosts: currentRelated.filter((p: any) => p.id !== id) });
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTags = [...(metadata.tags || []), tagInput.trim()];
      setMetadata({ ...metadata, tags: newTags });
      setTagInput("");
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // SEO State
  const [seoResult, setSeoResult] = useState<SeoResult>({ score: 0, checks: [] });

  useEffect(() => {
    const result = evaluateSeo({
      title: formData.title,
      excerpt: formData.excerpt,
      content: formData.content,
      keywords: metadata.seoKeywords || "",
      seoTitle: metadata.seoTitle,
      seoDescription: metadata.seoDescription,
      seoUrl: metadata.seoUrl,
      imageUrl: formData.imageUrl,
      fbImageUrl: metadata.fbImageUrl
    });
    setSeoResult(result);
  }, [formData, metadata]);

  // Synchronize AI Generation loading close after editor updates
  useEffect(() => {
    if (isGenerating && pendingAiContent && formData.content === pendingAiContent) {
      const timer = setTimeout(() => {
        setIsGenerating(false);
        setIsAiModalOpen(false);
        setPendingAiContent(null);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [formData.content, isGenerating, pendingAiContent]);

  const handleAiGenerate = async () => {
    if (!aiTitle) { setAiError("Vui lòng nhập tiêu đề định hướng!"); return; }
    
    setAiError(null);
    setIsGenerating(true);
    setAiProgress(0);
    
    let currentProgressInterval = setInterval(() => {
      setAiProgress(prev => (prev >= 90 ? prev : prev + Math.floor(Math.random() * 10) + 5));
    }, 600);

    const maxRetries = 4; // 1 lần chạy thật + 3 lần retry
    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success) {
      try {
        if (attempt > 0) {
          setAiError(`⚠️ Các AI Provider đang nghẽn. Đang tự động thử lại lần ${attempt}/${maxRetries - 1}...`);
          setAiProgress(0);
          clearInterval(currentProgressInterval);
          currentProgressInterval = setInterval(() => {
            setAiProgress(prev => (prev >= 90 ? prev : prev + Math.floor(Math.random() * 10) + 5));
          }, 600);
          // Nghỉ 2 giây trước khi retry để tránh Rate Limit
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        let res: any;
        if (aiMode === 'prediction') {
          const fetchRes = await fetch('/api/generate-prediction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: aiTitle })
          });
          const predData = await fetchRes.json();
          if (fetchRes.ok && predData.predictionData) {
            res = {
              success: true,
              data: {
                title: aiTitle,
                excerpt: `Phân tích chuyên sâu và nhận định bóng đá trận đấu: ${aiTitle}`,
                content: predData.predictionData.analysisHtml || "",
                imageUrl: "",
                predictionData: predData.predictionData,
                isPrediction: true,
              }
            };
          } else {
            res = { success: false, error: predData.error || 'Lỗi server' };
          }
        } else {
          res = await generateArticleWithAI(aiTitle, aiUrl, false, metadata.mainCategory);
        }
        
        if (res.success && res.data) {
          success = true;
          clearInterval(currentProgressInterval);
          setAiProgress(100);
          
          setPendingAiContent(res.data.content);
          
          setFormData(prev => ({
            ...prev,
            title: res.data.title,
            excerpt: res.data.excerpt,
            content: res.data.content,
            imageUrl: res.data.imageUrl || prev.imageUrl,
          }));
          
          setMetadata((prev: any) => ({
            ...prev,
            aiTitle,
            aiUrl,
            tags: res.data.tags && res.data.tags.length > 0 ? res.data.tags : prev.tags,
            seoTitle: res.data.seoTitle || prev.seoTitle,
            seoDescription: res.data.seoDescription || prev.seoDescription,
            seoKeywords: res.data.seoKeywords || (res.data.tags ? res.data.tags.join(', ') : prev.seoKeywords),
            seoUrl: res.data.seoUrl || prev.seoUrl,
            isPrediction: res.data.isPrediction || false,
            predictionData: res.data.predictionData || null
          }));
          setAiError(null);
          break; 
        } else {
          attempt++;
          if (attempt >= maxRetries) {
            clearInterval(currentProgressInterval);
            setIsGenerating(false);
            const errMsg = res.error || "Lỗi tạo bài viết";
            setAiError(`🚨 Đã thử lại ${maxRetries - 1} lần nhưng vẫn thất bại: ${errMsg}`);
          }
        }
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          clearInterval(currentProgressInterval);
          setIsGenerating(false);
          setAiError(`🚨 Lỗi hệ thống sau ${maxRetries - 1} lần thử: Kiểm tra lại API KEY`);
        }
      }
    }
  };

  const handleMetadataChange = (key: string, value: any) => {
    setMetadata({ ...metadata, [key]: value });
  };

  const actionFn = initialData ? updatePost.bind(null, initialData.id) : createPost;

  return (
    <div className="w-full">
      <form action={actionFn} className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        <input type="hidden" name="type" value="STANDARD" />
        <input type="hidden" name="metadata" value={JSON.stringify(metadata)} />
        <input type="hidden" name="content" value={formData.content} />
        <input type="hidden" name="status" value={formData.status} />

        {/* HEADER */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="shrink-0 flex items-center gap-4">
            <Link href="/admin/posts" className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl xl:text-3xl font-black text-slate-800 tracking-tight mb-1 flex items-center whitespace-nowrap">
                <span className="text-emerald-500 mr-3">✏️</span> {initialData ? "Chỉnh sửa Bài" : "Thêm Bài thường"}
              </h1>
              <p className="text-slate-500 font-medium whitespace-nowrap text-sm">Soạn thảo và xuất bản nội dung</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center xl:justify-end gap-3 w-full">
            <Select className="w-auto font-bold text-slate-600 bg-white shadow-sm border-slate-200">
              <option>Bài thường</option>
              <option>Bài Video</option>
              <option>eMagazine</option>
            </Select>
            
            <div className="h-6 w-px bg-slate-200 hidden xl:block mx-1"></div>

            <Button 
              type="button" 
              variant="secondary"
              onClick={() => setIsHistoryOpen(true)}
            >
              Lịch sử bản nháp
            </Button>
            <Button 
              type="button" 
              variant="blue"
              onClick={() => setIsPreviewOpen(true)}
            >
              <Eye className="w-4 h-4 mr-1.5" /> Xem trước
            </Button>
            
            <div className="h-6 w-px bg-slate-200 hidden xl:block mx-1"></div>

            {(isSaving || lastSaved) && (
              <div className="text-[13px] font-medium text-slate-500 flex items-center gap-1.5 px-2">
                {isSaving ? (
                  <><div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div> Đang lưu...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Đã lưu {lastSaved!.toLocaleTimeString()}</>
                )}
              </div>
            )}
            
            <Select 
              value={formData.status} 
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-auto font-bold text-slate-700 bg-white shadow-sm border-slate-200"
            >
                <option value="DRAFT">Nháp</option>
                <option value="PENDING_EDITOR">Chờ biên tập</option>
                <option value="PENDING_PUBLISH">Chờ xuất bản</option>
                <option value="PENDING_TKTS">Chờ xuất bản TKTS</option>
                <option value="PUBLISHED">Xuất bản</option>
                <option value="ARCHIVED">Hạ xuất bản</option>
                <option value="TEMPLATE">Bài mẫu nội dung</option>
                <option value="SCHEDULED">Bài hẹn giờ xuất bản</option>
                <option value="REJECTED">Bài trả lại</option>
              </Select>
              <Button 
                type="submit" 
                variant="success"
              >
                <Save className="w-4 h-4 mr-1.5" /> Lưu bài viết
              </Button>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* ======================= CỘT TRÁI (Main) ======================= */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* 1. THÔNG TIN CHUNG */}
            <PostCategoryFields 
              metadata={metadata} 
              handleMetadataChange={handleMetadataChange} 
              categoryOptions={categoryOptions} 
            />

            {/* 2. TEXT FIELDS */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <Label required className="mb-0">Tiêu đề bài viết</Label>
                    <Checkbox id="limitTitle" label={<span className="text-xs text-slate-600">Bỏ giới hạn ký tự</span>} />
                  </div>
                  <div className="flex">
                    <Input 
                      type="text" 
                      name="title"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Tiêu đề chính"
                      className="rounded-r-none border-r-0 focus:z-10 h-[42px]"
                    />
                    <Button type="button" variant="success" className="rounded-l-none h-[42px]">Kiểm tra trùng lặp</Button>
                  </div>
                  <span className="text-xs text-emerald-500 mt-1.5 block font-medium">Độ dài: {formData.title.length}/80.</span>
                  
                  {/* A/B Testing Title */}
                  <div className="mt-5 pt-5 border-t border-slate-100 border-opacity-80">
                    <div className="flex items-center justify-between mb-3">
                      <Checkbox 
                        checked={metadata.enableAbTitle || false}
                        onChange={(e) => handleMetadataChange('enableAbTitle', e.target.checked)}
                        label={<span className="font-bold text-indigo-700">Bật A/B Testing Tiêu đề</span>}
                      />
                      {metadata.enableAbTitle && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">Bản B</span>}
                    </div>
                    
                    {metadata.enableAbTitle && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                        <Label className="text-indigo-900">Tiêu đề Bản B (Dùng để test CTR)</Label>
                        <Input 
                          type="text" 
                          value={metadata.abTitle || ''}
                          onChange={(e) => handleMetadataChange('abTitle', e.target.value)}
                          placeholder="Nhập tiêu đề thay thế..."
                        />
                        <span className="text-xs text-indigo-500 mt-1.5 block font-medium">Hệ thống sẽ hiển thị ngẫu nhiên Bản A hoặc Bản B để đo lường.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Tiêu đề phụ</Label>
                  <Input 
                    type="text" 
                    onChange={(e) => handleMetadataChange('subTitle', e.target.value)}
                    placeholder="Tiêu đề phụ"
                  />
                </div>

                <div>
                  <Label required>Mô tả ngắn</Label>
                  <textarea
                    name="excerpt"
                    required
                    rows={4}
                    value={formData.excerpt}
                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                    placeholder="Mô tả"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-colors"
                  />
                  <span className="text-xs text-emerald-500 mt-1.5 block font-medium">Độ dài: {formData.excerpt.length}/250.</span>
                </div>
              </CardContent>
            </Card>

            {/* 3. EDITOR */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-[72px] z-20 bg-white/95 backdrop-blur-sm rounded-t-2xl">
                <Label required className="mb-0 text-lg">Nội dung</Label>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="gradient"
                    onClick={() => setIsAiModalOpen(true)}
                  >
                    <Bot className="w-4 h-4 mr-1.5" /> Trợ lý AI
                  </Button>
                  <Button type="button" variant="outline">
                    <Copy className="w-4 h-4 mr-1.5" /> Copy
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <TiptapEditor
                  value={formData.content}
                  onChange={(html) => setFormData({...formData, content: html})}
                />
              </div>
            </div>

            {/* 4. TAGS & EVENTS */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
              <div>
                <Label required>Chủ đề</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="chọn tag"
                    className="flex-1 h-[42px]"
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag} className="h-[42px] whitespace-nowrap border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700"># Thêm nhóm chủ đề</Button>
                </div>
                {metadata.tags && metadata.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {metadata.tags.map((tag: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-bold flex items-center shadow-sm">
                        # {tag}
                        <button type="button" className="ml-1.5 text-emerald-400 hover:text-red-500 transition-colors" onClick={() => setMetadata({...metadata, tags: metadata.tags.filter((_: any, index: number) => index !== i)})}>&times;</button>
                      </span>
                    ))}
                  </div>
                )}
                <span className="text-xs text-[#ffb74d] mt-1 block">Yêu cầu nhập liệu</span>
              </div>

              <div className="bg-[#e3f2fd] text-[#1976d2] p-4 rounded-lg text-sm flex items-start">
                <div className="w-5 h-5 bg-[#1976d2] text-white rounded-full flex items-center justify-center font-bold text-xs mr-2 mt-0.5">!</div>
                <p>Ưu tiên hiển thị tại vị trí đặc biệt: Chủ đề hiển thị vị trí đặc biệt {'>'} Sự kiện {'>'} Tuyến bài</p>
              </div>

              <div className="space-y-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <div>
                  <Label>Chủ đề hiển thị vị trí đặc biệt</Label>
                  <Select><option>Chủ đề hiển thị vị trí đặc biệt</option></Select>
                </div>
                <div>
                  <Label>Sự kiện</Label>
                  <Select><option>Chọn sự kiện</option></Select>
                </div>
                <div>
                  <Label>Tuyến bài</Label>
                  <Select><option>Chọn tuyến bài</option></Select>
                </div>
              </div>
            </div>

            {/* 5. PUBLISH SETTINGS */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 uppercase flex items-center mb-1">
                  BÀI VIẾT LIÊN QUAN <span className="text-red-500 ml-1">*</span> <span className="ml-2 text-emerald-500 text-sm">⊕</span>
                </h3>
                <span className="text-xs text-[#ffb74d] block mb-4">Tìm kiếm và chọn các bài viết liên quan</span>

                <div className="space-y-4">
                  {/* Selected Related Posts */}
                  <div className="space-y-2">
                    {(metadata.relatedPosts || []).map((post: any) => (
                      <div key={post.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg group hover:border-emerald-200 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 line-clamp-1">{post.title}</span>
                          <span className="text-xs text-slate-500 font-mono">ID: {post.id}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveRelatedPost(post.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="w-4 h-4 text-slate-400" />
                    </div>
                    <Input
                      type="text"
                      value={relatedQuery}
                      onChange={(e) => setRelatedQuery(e.target.value)}
                      placeholder="Tìm theo ID, tiêu đề hoặc chuyên mục..."
                      className="pl-10"
                    />
                    {isSearchingRelated && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}

                    {/* Search Results Dropdown */}
                    {relatedResults.length > 0 && relatedQuery && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                        {relatedResults
                          .filter(post => !(metadata.relatedPosts || []).some((p: any) => p.id === post.id))
                          .map(post => (
                          <div 
                            key={post.id} 
                            onClick={() => handleAddRelatedPost(post)}
                            className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 flex items-center justify-between group"
                          >
                            <div className="flex flex-col pr-4">
                              <span className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">{post.title}</span>
                              <span className="text-xs text-slate-500 font-mono">ID: {post.id} • {post.status}</span>
                            </div>
                            <Plus className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                <h3 className="text-base font-bold text-slate-800">Bật để không xuất bản trên website</h3>
                <div className="w-12 h-6 bg-slate-300 rounded-full relative cursor-pointer"><div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <Label className="text-right pr-4 mb-0">Xuất bản</Label>
                <Input type="datetime-local" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <Label className="text-right pr-4 mb-0 flex justify-end items-center">Chọn vùng hiển thị trên trang <span className="ml-2 text-emerald-500">⊕</span></Label>
                <div></div>
              </div>
            </div>
          </div>


          {/* ======================= CỘT PHẢI (Sidebar) ======================= */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* 1. MEDIA */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">Ảnh đại diện <span className="text-red-500">*</span></h3>
                <Select className="w-auto px-2 py-1 text-xs"><option>Chọn Icon ảnh đại diện</option></Select>
              </div>
              <div className="p-4 bg-[#f4f8fb] m-4 rounded-xl border border-blue-50">
                <p className="text-xs text-slate-600 mb-2 font-medium">Ảnh đại diện 4:3 (660x440)</p>

                {formData.imageUrl ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200">
                    <img src={formData.imageUrl} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setFormData({...formData, imageUrl: ''})} className="absolute top-2 right-2 bg-white/80 p-1 rounded">X</button>
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-[#e0e0e0] border-2 border-dashed border-[#bdbdbd] rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-white" />
                  </div>
                )}
                
                <Input
                  type="text"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  className="mt-3"
                  placeholder="URL Hình ảnh (tạm thời thay cho Upload)"
                />
                <p className="text-xs text-slate-500 mt-2">Dung lượng Ảnh tối đa là 1Mb</p>
                <p className="text-xs text-[#ffb74d] mt-1 font-medium">Thông tin bắt buộc</p>

                {/* A/B Testing Image */}
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <Checkbox 
                      checked={metadata.enableAbImage || false}
                      onChange={(e) => handleMetadataChange('enableAbImage', e.target.checked)}
                      label={<span className="font-bold text-indigo-700">Bật A/B Testing Ảnh</span>}
                    />
                    {metadata.enableAbImage && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">Bản B</span>}
                  </div>
                  
                  {metadata.enableAbImage && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      {metadata.abImageUrl ? (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-indigo-300 shadow-sm">
                          <img src={metadata.abImageUrl} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => handleMetadataChange('abImageUrl', '')} className="absolute top-2 right-2 bg-white/80 p-1 rounded hover:bg-white text-indigo-700 font-bold text-xs">X</button>
                        </div>
                      ) : (
                        <div className="w-full aspect-video bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-indigo-300" />
                        </div>
                      )}
                      
                      <input 
                        type="text"
                        value={metadata.abImageUrl || ''}
                        onChange={(e) => handleMetadataChange('abImageUrl', e.target.value)}
                        className="w-full mt-3 px-3 py-2 text-sm border border-indigo-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="URL Ảnh Bản B (Dùng test CTR)"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg flex items-center">Ảnh Facebook <span className="ml-2 text-red-500 cursor-pointer">⟳</span></h3>
              </div>
              <div className="p-4 bg-[#f4f8fb] m-4 rounded-xl border border-emerald-50">
                <p className="text-xs text-slate-600 mb-2 font-medium">Ảnh chia sẻ facebook 1.91:1 (400x209)</p>
                <div className="w-full aspect-[1.91/1] bg-[#e0e0e0] border-2 border-dashed border-[#bdbdbd] rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-white" />
                </div>
                <Input type="text" onChange={(e) => handleMetadataChange('fbImageUrl', e.target.value)} className="mt-3" placeholder="URL Hình ảnh Facebook" />
              </div>
              <div className="p-4 pt-0">
                <Label>Facebook Tiêu đề</Label>
                <Input type="text" onChange={(e) => handleMetadataChange('fbTitle', e.target.value)} placeholder="Tiêu đề" />
              </div>
            </div>

            {/* 2. SEO */}
            <PostSeoFields 
              metadata={metadata} 
              handleMetadataChange={handleMetadataChange} 
              seoResult={seoResult} 
            />

            {/* 3. AUTHOR & SETTINGS */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center mb-3">Tác giả & Bản quyền</h3>
                <Label>Nhóm tác giả (Cách nhau bằng dấu phẩy)</Label>
                <Input
                  type="text"
                  value={metadata.authors || ''}
                  onChange={(e) => handleMetadataChange('authors', e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A, Trần Thị B"
                  className="mb-3"
                />

                <Label>Nguồn bài / Bản quyền ảnh</Label>
                <Input
                  type="text"
                  value={metadata.copyright || ''}
                  onChange={(e) => handleMetadataChange('copyright', e.target.value)}
                  placeholder="Ví dụ: Getty Images, Reuters..."
                />
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-base mb-2">Thảo luận & Ghi chú nội bộ</h3>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-2">
                  <div className="text-xs text-yellow-800 mb-1 font-bold">Hệ thống (Tự động)</div>
                  <div className="text-sm text-yellow-900">Bài viết mới được khởi tạo. Các bình luận trao đổi nội bộ sẽ hiển thị tại đây.</div>
                </div>
                <textarea
                  value={metadata.newComment || ''}
                  onChange={(e) => handleMetadataChange('newComment', e.target.value)}
                  placeholder="Thêm ghi chú trao đổi..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                ></textarea>
                <Button type="button" variant="secondary" size="sm" onClick={() => handleMetadataChange('newComment', '')} className="mt-2">Gửi ghi chú</Button>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-base mb-3">Phân phối Mạng xã hội</h3>
                <div className="space-y-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                  <Checkbox 
                    checked={metadata.pushToFb || false} 
                    onChange={(e) => handleMetadataChange('pushToFb', e.target.checked)}
                    label="Tự động đẩy lên Fanpage Facebook"
                  />
                  <Checkbox 
                    checked={metadata.pushToZalo || false} 
                    onChange={(e) => handleMetadataChange('pushToZalo', e.target.checked)}
                    label="Tự động gửi Broadcast Zalo"
                  />
                  <Checkbox 
                    checked={metadata.pushToTele || false} 
                    onChange={(e) => handleMetadataChange('pushToTele', e.target.checked)}
                    label="Bắn tin vào Channel Telegram"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-base mb-3">Cài đặt khác</h3>

                <div className="bg-[#e8f5e9] px-4 py-2 rounded-lg flex items-center mb-2 border border-green-100">
                  <div className="w-10 h-5 bg-slate-400 rounded-full relative cursor-pointer mr-3"><div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5"></div></div>
                  <span className="text-sm font-medium text-slate-700">Bài PR</span>
                </div>

                <div className="border border-slate-200 px-4 py-2 rounded-lg flex items-center mb-4">
                  <div className="w-10 h-5 bg-slate-400 rounded-full relative cursor-pointer mr-3"><div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5"></div></div>
                  <span className="text-sm font-medium text-slate-700">Bài đặc cách lượt view</span>
                </div>

                <div className="bg-[#e3f2fd] p-4 rounded-lg space-y-4 border border-blue-100">
                  <Checkbox label="Bài Premium" />
                  <Checkbox label="Audio" />
                  <Checkbox label="Ẩn quảng cáo" />
                  <Checkbox label="Ẩn trên trang" />
                  <Checkbox label="Ẩn box bình chọn" />
                  <Checkbox label="Social Mark" />
                  <Checkbox label="Định danh quảng cáo" />
                  <Checkbox label="Multimedia" />
                  <Checkbox label="Live" />
                </div>
              </div>

            </div>

          </div>
        </div>

      </form>

      {/* AI ASSISTANT MODAL */}
      <PostAiAssistant 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)}
        aiTitle={aiTitle}
        setAiTitle={setAiTitle}
        aiUrl={aiUrl}
        setAiUrl={setAiUrl}
        aiError={aiError}
        isGenerating={isGenerating}
        aiProgress={aiProgress}
        aiMode={aiMode}
        setAiMode={setAiMode}
        handleAiGenerate={handleAiGenerate}
      />

      <PostLivePreview 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        formData={formData} 
        metadata={metadata} 
      />

      {/* MODAL LỊCH SỬ BẢN NHÁP */}
      <Modal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        title="Lịch sử bản nháp (Autosave)"
        maxWidth="lg"
      >
        <div className="h-[400px] bg-slate-50 -mx-6 -my-6 p-6 overflow-y-auto">
          <div className="space-y-4">
            {(metadata.revisions || []).length > 0 ? (
              (metadata.revisions || []).map((rev: any, index: number) => (
                <div key={rev.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm hover:border-emerald-300 transition-colors">
                  <div>
                    <div className="font-bold text-[15px] text-slate-800 flex items-center gap-2">
                      Bản nháp lúc {rev.time} 
                      {index === 0 && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Mới nhất</span>}
                    </div>
                    <div className="text-[13px] text-slate-500 mt-1">Ngày: {rev.date} · Tác giả: {rev.author}</div>
                  </div>
                  <Button variant="blue" size="sm" className="h-[34px]">
                    Khôi phục
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-10">Chưa có bản nháp nào được lưu. Hệ thống sẽ tự động lưu mỗi 45 giây.</div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
