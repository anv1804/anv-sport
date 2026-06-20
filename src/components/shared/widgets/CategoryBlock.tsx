import React from "react";
import Link from "next/link";

interface CategoryBlockProps {
  title: string;
  subcategories?: { name: string; href: string }[];
  children: React.ReactNode;
}

export function CategoryBlock({ title, subcategories, children }: CategoryBlockProps) {
  return (
    <div className="mb-2 md:mb-4 border-b border-[#e5e5e5] pb-2 md:pb-4">
      {/* Header */}
      <div className="flex flex-wrap items-center border-b border-[#e5e5e5] mb-5">
        <h2 className="text-[18px] font-bold text-[#222222] border-b-[2px] border-[var(--color-accent-main)] pb-2 -mb-[1px] pr-4 mr-4 flex-shrink-0">
          {title}
        </h2>
        <div className="flex flex-wrap items-center flex-1 pb-2 -mb-[1px] gap-y-2">
          {subcategories && subcategories.map((sub, i) => (
            <Link key={i} href={sub.href} className="text-[14px] text-[#757575] hover:text-[var(--color-accent-main)] mr-4 whitespace-nowrap">
              {sub.name}
            </Link>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="bg-transparent">
        {children}
      </div>
    </div>
  );
}
