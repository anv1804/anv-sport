'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Play, RefreshCw, Calendar, CheckCircle2, AlertTriangle, BookOpen, Clock, Activity, ScrollText } from 'lucide-react';

interface Stats {
  status: string;
  lastTrainedAt: string | null;
  totalPredicted: number;
  totalKnowledgeCrawled: number;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export default function SupercomputerClient() {
  const [stats, setStats] = useState<Stats>({
    status: 'Loading...',
    lastTrainedAt: null,
    totalPredicted: 0,
    totalKnowledgeCrawled: 0
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeLeagues, setActiveLeagues] = useState<string[]>([]);
  const [upcomingMatchesCount, setUpcomingMatchesCount] = useState<number>(0);
  const [isLearning, setIsLearning] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/supercomputer/learn');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setLogs(data.logs);
          setActiveLeagues(data.activeLeagues);
          setUpcomingMatchesCount(data.upcomingMatchesCount);
          if (data.stats.status === 'Running') {
            setIsLearning(true);
          } else {
            setIsLearning(false);
          }
        }
      }
    } catch (err) {
      console.error("Lỗi khi fetch dữ liệu siêu máy tính:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleStartLearn = async () => {
    if (isLearning) return;
    setIsLearning(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/supercomputer/learn', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setLogs(data.logs);
        setMessage({ text: 'Đã hoàn tất tiến trình tự học hỏi & phân tích các trận đấu bóng đá!', type: 'success' });
      } else {
        setMessage({ text: `Lỗi: ${data.error || 'Có lỗi xảy ra'}`, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Lỗi kết nối máy chủ.', type: 'error' });
    } finally {
      setIsLearning(false);
      fetchData();
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Siêu Máy Tính Dự Đoán</h1>
            <p className="text-sm text-slate-500 font-medium">Bảng điều khiển hệ thống phân tích chiến thuật & tự động học hỏi bóng đá</p>
          </div>
        </div>
        <button
          onClick={handleStartLearn}
          disabled={isLearning}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all shadow-md ${
            isLearning
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isLearning ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Đang Tự Học...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Học Hỏi Ngay</span>
            </>
          )}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái AI</span>
            <span className={`text-lg font-black ${stats.status === 'Running' ? 'text-emerald-600 animate-pulse' : 'text-slate-700'}`}>
              {stats.status === 'Running' ? 'Đang tự học...' : 'Đang chờ (Idle)'}
            </span>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kiến thức tích lũy</span>
            <span className="text-lg font-black text-slate-700">{stats.totalKnowledgeCrawled.toLocaleString()} đơn vị</span>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-amber-50 text-amber-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã dự đoán (Milestone)</span>
            <span className="text-lg font-black text-slate-700">{stats.totalPredicted.toLocaleString()} trận</span>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 text-slate-600">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lần học gần nhất</span>
            <span className="text-sm font-black text-slate-700 block truncate">
              {stats.lastTrainedAt ? new Date(stats.lastTrainedAt).toLocaleString('vi-VN') : 'Chưa chạy lần nào'}
            </span>
          </div>
        </div>
      </div>

      {/* Detail Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Active Tournaments & Daemon Scheduler note */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-sm">
            <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <span>Giải Đấu Đang Diễn Ra</span>
            </h2>
            {activeLeagues.length === 0 ? (
              <p className="text-sm font-semibold text-slate-400 text-center py-6">Đang tải giải đấu...</p>
            ) : (
              <ul className="space-y-3">
                {Array.from(new Set(activeLeagues.map(l => {
                  if (l.includes("FIFA World Cup 2026")) return "FIFA World Cup 2026";
                  return l;
                }))).map((league, idx) => (
                  <li key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                    <span className="text-sm font-bold text-slate-700">{league}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
              <span>Trận đấu chờ dự đoán:</span>
              <span className="text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{upcomingMatchesCount} trận</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-purple-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
            {/* Background glowing circle */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-indigo-500/20 blur-2xl"></div>
            
            <h3 className="text-base font-black mb-2 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-300" />
              <span>Hệ thống Tự Học Ngầm</span>
            </h3>
            <p className="text-xs text-indigo-200 font-medium leading-relaxed mb-4">
              Hệ thống Siêu máy tính được cấu hình tác vụ nền tự chạy kiểm tra và tự học hỏi định kỳ <strong>mỗi 4 giờ</strong>. AI luôn học hỏi và dự đoán các trận đấu chuẩn bị diễn ra ngay cả khi bạn tắt máy tính hoặc rời khỏi quản trị CMS.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Daemon Active
            </div>
          </div>
        </div>

        {/* Right Side: Training & Analytics Logs */}
        <div className="lg:col-span-2">
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col h-[520px]">
            <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2 flex-shrink-0">
              <ScrollText className="w-5 h-5 text-indigo-500" />
              <span>Nhật Ký Tự Học Hỏi & Dự Đoán</span>
            </h2>
            <div className="flex-1 overflow-y-auto bg-slate-900 rounded-2xl p-4 font-mono text-xs text-slate-300 space-y-2 border border-slate-950 shadow-inner">
              {logs.length === 0 ? (
                <div className="text-slate-500 text-center py-20 font-sans font-medium">Chưa có nhật ký hoạt động. Nhấn nút "Học Hỏi Ngay" để khởi chạy.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-500 select-none flex-shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={
                      log.type === 'success' ? 'text-emerald-400' :
                      log.type === 'error' ? 'text-red-400 font-bold' :
                      'text-indigo-300'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
