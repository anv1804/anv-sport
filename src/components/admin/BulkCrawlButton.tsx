"use client";

import { useState } from "react";
import { DatabaseZap } from "lucide-react";
import BulkCrawlModal from "./BulkCrawlModal";

export default function BulkCrawlButton({ categories = [] }: { categories?: { slug: string; name: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center text-[13px]"
        title="Crawl Dữ Liệu"
      >
        <DatabaseZap className="w-4 h-4 sm:mr-1.5" />
        <span className="hidden sm:inline">Crawl Dữ Liệu</span>
      </button>
      
      <BulkCrawlModal isOpen={isOpen} onClose={() => setIsOpen(false)} categories={categories} />
    </>
  );
}
