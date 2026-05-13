import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Coffee, PackageCheck } from "lucide-react";
import { KopiKabinLogo } from "./KopiKabinLogo";
import { useMenu } from "../context/MenuContext";

const SLIDE_ACCENTS = ["#000EE9", "#FA0200", "#00095B", "#FD564B"];

export const MenuCarousel = () => {
  const { menuItems, loading } = useMenu();
  const [currentIndex, setCurrentIndex] = useState(0);
  const active = menuItems[currentIndex];

  const getImageSrc = (imageUrl: string | undefined) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('data:')) return imageUrl;
    if (imageUrl.startsWith('png;base64,') || imageUrl.startsWith('jpeg;base64,')) {
      const [format, base64] = imageUrl.split(';base64,');
      return `data:image/${format};base64,${base64}`;
    }
    return `data:image/png;base64,${imageUrl}`;
  };

  const visibleItems = useMemo(() => {
    if (!menuItems.length) return [];
    return [-1, 0, 1].map(offset => {
      const index = (currentIndex + offset + menuItems.length) % menuItems.length;
      return { item: menuItems[index], index, offset };
    });
  }, [currentIndex, menuItems]);

  const go = (direction: number) => {
    if (!menuItems.length) return;
    setCurrentIndex(prev => {
      const newIndex = (prev + direction + menuItems.length) % menuItems.length;
      return newIndex < menuItems.length ? newIndex : 0;
    });
  };

  React.useEffect(() => {
    if (currentIndex >= menuItems.length && menuItems.length > 0) {
      setCurrentIndex(menuItems.length - 1);
    }
  }, [menuItems.length]);

  const skeletonItems = loading && menuItems.length === 0;

  return (
    <section id="menu" className="py-16 md:py-24 bg-transparent overflow-hidden relative border-b-[6px] border-brand-blue">
      <div className="max-w-7xl mx-auto px-4 md:px-12 relative z-10">
        <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="font-mono text-brand-red text-sm font-bold tracking-widest border-[2px] border-brand-red inline-block px-3 py-1 mb-4 bg-white/90">
              SEC_01.5 // PRODUCT_DECK
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase text-brand-navy leading-none">
              MENU <span className="text-brand-blue font-mono">[DECK]</span>
            </h2>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => go(-1)}
              disabled={menuItems.length <= 1}
              aria-label="Previous item"
              className="w-12 h-12 border-[3px] border-brand-navy bg-white hover:bg-brand-navy hover:text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={22} strokeWidth={3} />
            </button>
            <span className="font-mono text-sm font-bold text-brand-navy w-16 text-center">
              {skeletonItems ? "- / -" : `${currentIndex + 1} / ${menuItems.length}`}
            </span>
            <button
              onClick={() => go(1)}
              disabled={menuItems.length <= 1}
              aria-label="Next item"
              className="w-12 h-12 border-[3px] border-brand-navy bg-white hover:bg-brand-navy hover:text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={22} strokeWidth={3} />
            </button>
          </div>
        </div>

        {skeletonItems ? (
          <div className="h-[520px] border-[4px] border-brand-blue bg-white/50 animate-pulse" />
        ) : active ? (
          <div className="relative">
            <div className="absolute inset-x-8 top-10 bottom-10 border-[3px] border-brand-blue/20 bg-white/20 backdrop-blur-[1px] pointer-events-none" />

            <div className="relative min-h-[560px] md:min-h-[520px] flex items-center justify-center">
              {visibleItems.map(({ item, index, offset }) => {
                const isActive = offset === 0;
                const accent = SLIDE_ACCENTS[index % SLIDE_ACCENTS.length];
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setCurrentIndex(index)}
                    className={`absolute w-[86vw] max-w-[360px] md:max-w-[420px] text-left transition-all duration-500 ${
                      isActive
                        ? "z-20 translate-x-0 scale-100 opacity-100"
                        : offset < 0
                          ? "z-10 -translate-x-[54%] md:-translate-x-[72%] scale-90 opacity-40"
                          : "z-10 translate-x-[54%] md:translate-x-[72%] scale-90 opacity-40"
                    }`}
                    aria-label={`Show ${item.name}`}
                  >
                    <article className="bg-white/95 border-[4px] border-brand-navy shadow-[10px_10px_0px_var(--slide-accent)] overflow-hidden" style={{ ['--slide-accent' as any]: accent }}>
                      <div className="relative h-64 md:h-72 border-b-[4px] border-brand-navy overflow-hidden bg-brand-yellow">
                        <div className="absolute inset-0 bg-tech-grid opacity-40" />
                        <div className="absolute top-3 left-3 z-10 bg-white border-[2px] border-brand-navy px-2 py-1 font-mono text-[10px] font-black uppercase text-brand-navy">
                          {item.cat || "KOPI"}
                        </div>
                        <div className="absolute top-3 right-3 z-10 bg-brand-navy text-brand-yellow border-[2px] border-white px-2 py-1 font-mono text-[10px] font-black uppercase">
                          Rp {Number(item.price).toLocaleString('id-ID')}
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center p-8">
                          <div className="w-44 h-44 md:w-52 md:h-52 bg-white border-[4px] border-brand-navy shadow-[8px_8px_0px_rgba(0,0,0,0.25)] flex items-center justify-center overflow-hidden">
                            {item.imageUrl ? (
                              <img src={getImageSrc(item.imageUrl)} alt={item.name} className="w-full h-full object-contain" />
                            ) : (
                              <KopiKabinLogo className="w-28 h-28 text-brand-blue" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-5 md:p-6">
                        <div className="flex items-start gap-3 mb-3">
                          <Coffee className="text-brand-red shrink-0 mt-1" size={22} />
                          <h3 className="font-black text-2xl md:text-3xl uppercase leading-none text-brand-navy break-words">
                            {item.name}
                          </h3>
                        </div>
                        <p className="text-sm md:text-base text-gray-700 font-medium leading-relaxed min-h-[72px]">
                          {item.desc}
                        </p>
                        <div className="mt-5 flex items-center justify-between gap-4 border-t-[2px] border-dashed border-gray-300 pt-4">
                          <div>
                            <p className="font-mono text-[10px] text-gray-500 font-bold uppercase">Power</p>
                            <p className="font-black text-brand-blue">{item.power || "READY"}</p>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-brand-navy">
                            <PackageCheck size={16} />
                            Stock {item.stockLevel ?? 0}
                          </div>
                        </div>
                      </div>
                    </article>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => go(-1)}
                aria-label="Previous"
                className="md:hidden w-11 h-11 border-[3px] border-brand-navy bg-white flex items-center justify-center transition-all hover:bg-brand-navy hover:text-white"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
              {menuItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  aria-label={`Go to item ${i + 1}`}
                  className={`h-3 border-[2px] border-brand-navy transition-all duration-300 ${
                    i === currentIndex ? 'w-9 bg-brand-blue' : 'w-3 bg-white hover:bg-brand-blue/40'
                  }`}
                />
              ))}
              <button
                onClick={() => go(1)}
                aria-label="Next"
                className="md:hidden w-11 h-11 border-[3px] border-brand-navy bg-white flex items-center justify-center transition-all hover:bg-brand-navy hover:text-white"
              >
                <ChevronRight size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/90 border-[4px] border-brand-blue p-8 text-center font-mono font-bold">
            No menu items yet.
          </div>
        )}
      </div>
    </section>
  );
};
