"use client";

import { useState, useEffect } from "react";
import { SiteHeaderSettings, SiteMenuSettings, SiteHamburgerSettings } from "@/types/settings";
import { HeaderTopBar } from "./HeaderTopBar";
import { HeaderMobileBar } from "./HeaderMobileBar";
import { HeaderNavBar } from "./HeaderNavBar";
import { HeaderMegaMenu } from "./HeaderMegaMenu";

type HeaderProps = {
  headerData?: SiteHeaderSettings;
  menuData?: SiteMenuSettings;
  enrichedMenuData?: SiteMenuSettings;
  hamburgerData?: SiteHamburgerSettings;
  allCategoriesTree?: any[];
};

export default function Header({ headerData, menuData, enrichedMenuData, hamburgerData, allCategoriesTree = [] }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState("Đang tải...");
  const [weatherTemp, setWeatherTemp] = useState<number | null>(null);

  useEffect(() => {
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const now = new Date();
    setCurrentDate(`${days[now.getDay()]}, ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`);

    const fetchWeather = async () => {
      try {
        const res = await fetch('https://wttr.in/Hanoi?format=j1');
        if (!res.ok) return;
        const data = await res.json();
        if (data?.current_condition?.[0]?.temp_C !== undefined) {
          setWeatherTemp(parseInt(data.current_condition[0].temp_C));
        }
      } catch (err) {
        // Ignore fetch errors (CORS, ad-blockers, wttr.in down) silently
      }
    };
    fetchWeather();
  }, []);

  const navLinks = menuData?.items || [];
  const siteName = headerData?.siteName || "ANV SPORT";
  const logoUrl = headerData?.logoUrl || "";
  const utilities = hamburgerData?.utilities || [];
  const apps = hamburgerData?.apps || [];

  const renderLogo = (isMobile = false) => {
    if (logoUrl) {
      return <img src={logoUrl} alt={siteName} className={`${isMobile ? 'h-6' : 'h-8'} object-contain`} />;
    }
    const textSizeClass = isMobile ? 'text-[22px]' : 'text-[26px]';
    return (
      <div className={`flex items-center ${textSizeClass} font-bold tracking-tighter leading-none`}>
        <span className="text-[#4f4f4f]">ANV</span>
        <span className="text-white bg-[var(--color-accent-main)] px-1 mx-[2px] rounded-sm inline-block leading-none pb-[1px] pt-[2px]">S</span>
        <span className="text-[#4f4f4f]">port</span>
      </div>
    );
  };

  return (
    <>
      <header className="w-full bg-white border-t-[3px] border-[var(--color-accent-main)] font-sans border-b border-[#e5e5e5] fixed top-0 z-50">

        <HeaderTopBar
          siteName={siteName}
          logoUrl={logoUrl}
          currentDate={currentDate}
          weatherTemp={weatherTemp}
          renderLogo={renderLogo}
        />

        <HeaderMobileBar
          isMenuOpen={isMenuOpen}
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
          weatherTemp={weatherTemp}
          renderLogo={renderLogo}
        />

        <HeaderNavBar
          navLinks={navLinks}
          isMenuOpen={isMenuOpen}
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        />

      </header>

      {isMenuOpen && (
        <HeaderMegaMenu
          onClose={() => setIsMenuOpen(false)}
          allCategoriesTree={allCategoriesTree}
          utilities={utilities}
          apps={apps}
        />
      )}
    </>
  );
}
