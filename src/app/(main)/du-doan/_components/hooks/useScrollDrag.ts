"use client";

import { useRef, useState, useEffect } from 'react';

export function useScrollDrag(contentKey?: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'next' | 'prev'>('next');

  // Re-check scroll bounds when content changes (tabs added/removed) or element resizes
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScroll(scrollWidth > clientWidth);
      if (scrollLeft + clientWidth >= scrollWidth - 12) setScrollDirection('prev');
      else if (scrollLeft <= 12) setScrollDirection('next');
    };

    el.addEventListener('scroll', check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    const t = setTimeout(check, 100);
    return () => { el.removeEventListener('scroll', check); ro.disconnect(); clearTimeout(t); };
  // contentKey is an intentional dynamic dep for this generic hook
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey]);

  // Mouse drag-to-scroll
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onDown = (e: MouseEvent) => {
      isDown = true;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const onUp = () => {
      isDown = false;
      el.style.cursor = 'grab';
      el.style.removeProperty('user-select');
    };
    const onMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      el.scrollLeft = scrollLeft - (e.pageX - el.offsetLeft - startX) * 1.5;
    };

    el.style.cursor = 'grab';
    el.addEventListener('mousedown', onDown);
    el.addEventListener('mouseleave', onUp);
    el.addEventListener('mouseup', onUp);
    el.addEventListener('mousemove', onMove);
    return () => {
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mouseleave', onUp);
      el.removeEventListener('mouseup', onUp);
      el.removeEventListener('mousemove', onMove);
      el.style.removeProperty('cursor');
      el.style.removeProperty('user-select');
    };
  }, [canScroll]);

  const scrollBy = (amount: number) => ref.current?.scrollBy({ left: amount, behavior: 'smooth' });

  return { ref, canScroll, scrollDirection, scrollBy };
}
