"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Home, Menu, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { MenuItem } from "@/types/settings";

type HeaderNavBarProps = {
  navLinks: MenuItem[];
  isMenuOpen: boolean;
  onMenuToggle: () => void;
};

export function HeaderNavBar({ navLinks, isMenuOpen, onMenuToggle }: HeaderNavBarProps) {
  const scrollRef = useRef<HTMLElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [arrowDirection, setArrowDirection] = useState<'next' | 'prev' | 'none'>('none');
  const [activeMobileSubmenu, setActiveMobileSubmenu] = useState<string | null>(null);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    if (scrollWidth <= clientWidth) {
      setArrowDirection('none');
      return;
    }
    if (scrollLeft <= 0) {
      setArrowDirection('next');
    } else if (scrollLeft >= scrollWidth - clientWidth - 1) {
      setArrowDirection('prev');
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [navLinks]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const scrollByAmount = (amount: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const handleMobileSubmenuToggle = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMobileSubmenu(prev => prev === id ? null : id);
  };

  return (
    <div className={`w-full ${isMenuOpen ? 'bg-[#f7f7f7]' : 'bg-white'} border-b border-[#e5e5e5] transition-colors duration-200 relative z-20`}>
      <div className="max-w-[1160px] mx-auto px-4 md:px-6 h-[44px] flex items-center relative">
        {/* Left Static Area: Home Button */}
        <div className={`flex items-center h-full z-10 relative pr-1 ${isMenuOpen ? 'bg-[#f7f7f7]' : 'bg-white'}`}>
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0">
            <div className="w-7 h-7 bg-[var(--color-accent-main)] text-white rounded-full flex items-center justify-center">
              <Home className="w-[14px] h-[14px]" />
            </div>
          </Link>
        </div>

        <nav className="flex-1 h-full min-w-0">
          <div
            ref={scrollRef as any}
            className="w-full flex items-start h-[500px] pb-[456px] -mb-[456px] overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing pointer-events-none"
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onScroll={checkScroll}
          >
            <div className="flex items-center min-w-max h-[44px] pointer-events-auto">
              {navLinks.map((link) => {
                const hasChildren = link.children && link.children.length > 0;
                return (
                  <div key={link.id} className="relative group h-full flex items-center flex-shrink-0">
                    <Link
                      href={link.url}
                      target={link.target}
                      draggable={false}
                      className={`px-2 md:px-4 text-[14px] font-bold hover:text-[var(--color-accent-main)] transition-colors whitespace-nowrap flex items-center h-full ${isMenuOpen ? 'text-[#b5b5b5]' : 'text-[#222]'}`}
                    >
                      {link.label}
                      {hasChildren && <ChevronDown className="hidden md:block w-4 h-4 ml-0.5 mt-0.5 opacity-50" />}
                    </Link>
                    {hasChildren && (
                      <button
                        className="md:hidden flex items-center justify-center h-full pr-2 pl-1 -ml-2 text-[#222] hover:text-[var(--color-accent-main)]"
                        onClick={(e) => handleMobileSubmenuToggle(e, link.id)}
                      >
                        <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${activeMobileSubmenu === link.id ? 'rotate-180' : ''}`} />
                      </button>
                    )}

                    {/* Dropdown Menu */}
                    {hasChildren && !isMenuOpen && (
                      <div className={`absolute top-[44px] left-0 md:group-hover:flex flex-col bg-white shadow-xl border border-[#e5e5e5] border-t-[2px] border-t-[var(--color-accent-main)] py-2 min-w-[200px] animate-in fade-in slide-in-from-top-1 z-[60] pointer-events-auto ${activeMobileSubmenu === link.id ? 'flex' : 'hidden'}`}>
                        {link.children!.map(child => (
                          <Link
                            key={child.id}
                            href={child.url}
                            target={child.target}
                            className="px-5 py-2.5 text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)] hover:bg-slate-50 transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Right Static Area */}
        <div className={`flex items-center flex-shrink-0 h-full z-10 relative pl-1 ${isMenuOpen ? 'bg-[#f7f7f7]' : 'bg-white'}`}>
          {arrowDirection !== 'none' && (
            <div className="absolute left-[-2rem] top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          )}

          <div className="flex items-center space-x-1 pl-1">
            {arrowDirection === 'prev' && (
              <button
                onClick={() => scrollByAmount(-200)}
                className="flex items-center justify-end w-6 h-[44px] text-gray-500 hover:text-[var(--color-accent-main)]"
              >
                <div className="w-6 h-6 flex items-center justify-center bg-white border border-gray-100 rounded-full shadow-sm">
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </button>
            )}
            {arrowDirection === 'next' && (
              <button
                onClick={() => scrollByAmount(200)}
                className="flex items-center justify-end w-6 h-[44px] text-gray-500 hover:text-[var(--color-accent-main)]"
              >
                <div className="w-6 h-6 flex items-center justify-center bg-white border border-gray-100 rounded-full shadow-sm">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            )}
          </div>

          {/* Menu Button (Desktop Only) */}
          <button
            onClick={onMenuToggle}
            className={`hidden md:flex items-center h-[44px] hover:text-[var(--color-accent-main)] transition-colors ml-3 ${isMenuOpen ? 'text-[var(--color-accent-main)]' : 'text-gray-600'}`}
          >
            <Menu className="w-[20px] h-[20px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
