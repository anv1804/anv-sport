import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SidebarWidgetProps {
  title: string;
  children: React.ReactNode;
  footerLink?: string;
  footerText?: string;
}

export function SidebarWidget({ title, children, footerLink, footerText }: SidebarWidgetProps) {
  return (
    <div className="mb-4 md:mb-6">
      <div className="border-t border-[#e5e5e5] pt-3 pb-2 mb-3 flex items-center justify-between">
        <h3 className="font-bold text-[14px] uppercase text-[var(--color-accent-main)]">
          {title}
        </h3>
      </div>
      
      <div className="bg-transparent">
        {children}
      </div>

      {footerLink && footerText && (
        <div className="mt-3 text-right">
          <Link href={footerLink} className="text-[13px] text-[var(--color-accent-main)] hover:underline inline-flex items-center">
            {footerText}
          </Link>
        </div>
      )}
    </div>
  );
}
