'use client';

import { useState } from 'react';
import { WikiCrawlerModal } from './WikiCrawlerModal';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function WikiCrawlerWrapper({ 
  clubs, 
  countries 
}: { 
  clubs: { id: string; name: string; countryId: string | null }[];
  countries: { id: string; name: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium flex items-center gap-2 transition-colors"
      >
        <Search size={18} />
        Crawl từ Wikipedia
      </button>

      <WikiCrawlerModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        onRefresh={() => router.refresh()}
        clubs={clubs}
        countries={countries}
      />
    </>
  );
}
