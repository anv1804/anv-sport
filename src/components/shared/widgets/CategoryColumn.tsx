import Link from "next/link";
import React from "react";
import { VerticalPost } from "@/components/domain/article/VerticalPost";

interface CategoryColumnProps {
  title: string;
  href: string;
  heroArticle: {
    title: string;
    excerpt: string;
    href: string;
  };
  listArticles: { title: string; href: string }[];
}

export function CategoryColumn({ title, href, heroArticle, listArticles }: CategoryColumnProps) {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-[#e5e5e5] mb-4">
        <h2 className="text-[18px] font-bold text-[#222222] border-b-[2px] border-[var(--color-accent-main)] inline-block pb-2 -mb-[1px]">
          {title}
        </h2>
      </div>

      {/* Hero Article */}
      <VerticalPost 
        href={heroArticle.href}
        title={heroArticle.title}
        excerpt={heroArticle.excerpt}
        size="md"
        titlePosition="bottom"
        imageClass="w-full"
        className="mb-4 border-b border-[#e5e5e5] pb-4"
      />

      {/* List Articles */}
      <ul className="space-y-3">
        {listArticles.map((article, i) => (
          <li key={i} className="flex items-start">
            <span className="text-[var(--color-accent-main)] mr-2 font-bold">•</span>
            <Link href={article.href} className="text-[14px] font-bold text-[#222222] hover:text-[var(--color-accent-main)] transition-colors leading-[1.4]">
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
