"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  isPending?: boolean;
  hasSelectedItems?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  isPending = false,
  hasSelectedItems = false,
  className = ""
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={`px-6 py-4 border-t border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 transition-all duration-300 ${
        hasSelectedItems ? "pb-20 sm:pb-4" : ""
      } ${className}`}
    >
      <div className="text-sm text-slate-500 font-medium text-center sm:text-left">
        Hiển thị trang <span className="font-bold text-slate-800">{currentPage}</span> /{" "}
        <span className="font-bold text-slate-800">{totalPages}</span> (Tổng {totalCount} dòng)
      </div>

      <div className="flex items-center justify-center gap-1 w-full sm:w-auto">
        <button
          type="button"
          disabled={currentPage === 1 || isPending}
          onClick={() => onPageChange(currentPage - 1)}
          className="w-7 h-7 sm:w-8 sm:h-8 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all cursor-pointer bg-white text-slate-600 flex items-center justify-center shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }).map((_, idx) => {
          const pNum = idx + 1;
          // Only show pages around current page (1 page on each side)
          if (totalPages > 5 && Math.abs(pNum - currentPage) > 1 && pNum !== 1 && pNum !== totalPages) {
            if (pNum === 2 && currentPage > 3) {
              return (
                <span key="ellipsis-1" className="w-5 text-center text-slate-400 text-[11px] shrink-0">
                  ...
                </span>
              );
            }
            if (pNum === totalPages - 1 && currentPage < totalPages - 2) {
              return (
                <span key="ellipsis-2" className="w-5 text-center text-slate-400 text-[11px] shrink-0">
                  ...
                </span>
              );
            }
            return null;
          }
          return (
            <button
              key={pNum}
              type="button"
              disabled={isPending}
              onClick={() => onPageChange(pNum)}
              className={`w-7 h-7 sm:w-8 sm:h-8 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                currentPage === pNum
                  ? "bg-emerald-600 text-white shadow-md"
                  : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              {pNum}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage === totalPages || isPending}
          onClick={() => onPageChange(currentPage + 1)}
          className="w-7 h-7 sm:w-8 sm:h-8 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all cursor-pointer bg-white text-slate-600 flex items-center justify-center shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
