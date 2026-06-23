"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

let overlayEl: HTMLDivElement | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function getOrCreateOverlay(): HTMLDivElement {
  if (overlayEl) return overlayEl;

  const el = document.createElement("div");
  el.id = "nav-loading-overlay";
  el.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    z-index: 999999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 80ms ease;
    pointer-events: none;
  `;

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:20px">
      <div style="position:relative;display:flex;flex-direction:column;align-items:center">
        <svg
          style="width:64px;height:64px;color:#16A34A;animation:nav-spin 1s linear infinite;filter:drop-shadow(0 4px 12px rgba(22,163,74,0.4))"
          viewBox="0 0 512 512"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="currentColor"
            d="M255.03 33.813c-1.834-.007-3.664-.007-5.5.03-6.73.14-13.462.605-20.155 1.344.333.166.544.32.47.438L204.78 75.063l73.907 49.437-.125.188 70.625.28L371 79.282 342.844 52c-15.866-6.796-32.493-11.776-49.47-14.78-12.65-2.24-25.497-3.36-38.343-3.407zM190.907 88.25l-73.656 36.78-13.813 98.407 51.344 33.657 94.345-43.438 14.875-76.5-73.094-48.906zm196.344.344l-21.25 44.5 36.75 72.72 62.063 38.905 11.312-21.282c.225.143.45.403.656.75-.77-4.954-1.71-9.893-2.81-14.782-6.446-28.59-18.59-55.962-35.5-79.97-9.07-12.872-19.526-24.778-31.095-35.5l-20.125-5.342zm-302.656 23c-6.906 8.045-13.257 16.56-18.938 25.5-15.676 24.664-26.44 52.494-31.437 81.312C31.783 232.446 30.714 246.73 31 261l20.25 5.094 33.03-40.5L98.75 122.53l-14.156-10.936zm312.719 112.844l-55.813 44.75-3.47 101.093 39.626 21.126 77.188-49.594 4.406-78.75-.094.157-61.844-38.783zm-140.844 6.406l-94.033 43.312-1.218 76.625 89.155 57.376 68.938-36.437 3.437-101.75-66.28-39.126zm-224.22 49.75c.91 8.436 2.29 16.816 4.156 25.094 6.445 28.59 18.62 55.96 35.532 79.968 3.873 5.5 8.02 10.805 12.374 15.938l-9.374-48.156.124-.032-27.03-68.844-15.782-3.968zm117.188 84.844l-51.532 8.156 10.125 52.094c8.577 7.49 17.707 14.332 27.314 20.437 14.612 9.287 30.332 16.88 46.687 22.594l62.626-13.69-4.344-31.124-90.875-58.47zm302.437.5l-64.22 41.25-42 47.375 4.408 6.156c12.027-5.545 23.57-12.144 34.406-19.72 23.97-16.76 44.604-38.304 60.28-62.97 2.51-3.947 4.87-7.99 7.125-12.092zm-122.78 97.656l-79.94 9.625-25.968 5.655c26.993 4 54.717 3.044 81.313-2.813 9.412-2.072 18.684-4.79 27.75-8.062l-3.156-4.406z"
          />
        </svg>
        <div style="width:48px;height:6px;background:rgba(22,163,74,0.2);border-radius:9999px;margin-top:12px;filter:blur(2px);animation:nav-pulse 1s ease-in-out infinite"></div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:13px;font-weight:800;color:#e2e8f0;letter-spacing:0.1em;text-transform:uppercase">Đang tải</span>
        <span style="display:flex;gap:4px;align-items:center;padding-top:2px">
          <span style="width:6px;height:6px;background:#16A34A;border-radius:50%;animation:nav-bounce 0.6s infinite;animation-delay:-0.2s"></span>
          <span style="width:6px;height:6px;background:#16A34A;border-radius:50%;animation:nav-bounce 0.6s infinite;animation-delay:-0.1s"></span>
          <span style="width:6px;height:6px;background:#16A34A;border-radius:50%;animation:nav-bounce 0.6s infinite"></span>
        </span>
      </div>
    </div>
  `;

  // Inject keyframe animations once
  if (!document.getElementById("nav-loader-styles")) {
    const style = document.createElement("style");
    style.id = "nav-loader-styles";
    style.textContent = `
      @keyframes nav-spin { to { transform: rotate(360deg); } }
      @keyframes nav-bounce {
        0%, 100% { transform: translateY(0); animation-timing-function: cubic-bezier(0.8,0,1,1); }
        50% { transform: translateY(-6px); animation-timing-function: cubic-bezier(0,0,0.2,1); }
      }
      @keyframes nav-pulse {
        0%, 100% { opacity: 0.3; transform: scaleX(0.8); }
        50% { opacity: 0.7; transform: scaleX(1); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(el);
  overlayEl = el;
  return el;
}

export function showNavLoader() {
  if (typeof window === "undefined") return;
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  const el = getOrCreateOverlay();
  el.style.pointerEvents = "auto";
  // Force reflow then fade in
  el.getBoundingClientRect();
  el.style.opacity = "1";
}

export function hideNavLoader() {
  if (typeof window === "undefined") return;
  const el = overlayEl;
  if (!el) return;
  el.style.opacity = "0";
  el.style.pointerEvents = "none";
}

export default function NavigationLoader() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  // Hide loader when route actually changes (page is rendered)
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      // Small delay to let the new page paint first
      hideTimer = setTimeout(hideNavLoader, 80);
    }
  }, [pathname]);

  const handleMousedown = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href) return;

    // Skip: external links, hash-only, mailto, tel, download, same page
    if (
      href.startsWith("http") ||
      href.startsWith("//") ||
      href.startsWith("mailto") ||
      href.startsWith("tel") ||
      href === "#" ||
      href.startsWith("#") ||
      anchor.hasAttribute("download") ||
      anchor.target === "_blank"
    ) return;

    // Skip if same path (ignoring hash)
    const currentPath = window.location.pathname;
    const targetPath = href.split("#")[0].split("?")[0];
    if (targetPath && targetPath === currentPath) return;

    showNavLoader();
  }, []);

  useEffect(() => {
    // Use mousedown for fastest possible response (before click fires)
    document.addEventListener("mousedown", handleMousedown, { capture: true, passive: true });
    // Also handle touch for mobile
    document.addEventListener("touchstart", handleMousedown as any, { capture: true, passive: true });

    return () => {
      document.removeEventListener("mousedown", handleMousedown, { capture: true });
      document.removeEventListener("touchstart", handleMousedown as any, { capture: true });
    };
  }, [handleMousedown]);

  return null;
}
