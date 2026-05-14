import React, { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Coffee, PackageCheck } from "lucide-react";
import { KopiKabinLogo } from "./KopiKabinLogo";
import { useMenu } from "../context/MenuContext";
import { motion } from "motion/react";

const CARD_ACCENTS = ["#000EE9", "#FA0200", "#00095B", "#FDC500", "#FA5B00", "#000EE9"];

export const MenuCarousel = () => {
  const { menuItems, loading } = useMenu();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const getImageSrc = (imageUrl: string | undefined) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('data:')) return imageUrl;
    if (imageUrl.startsWith('png;base64,') || imageUrl.startsWith('jpeg;base64,')) {
      const [format, base64] = imageUrl.split(';base64,');
      return `data:image/${format};base64,${base64}`;
    }
    return `data:image/png;base64,${imageUrl}`;
  };

  const getCardWidth = () => {
    const container = scrollRef.current;
    if (!container) return 0;
    const child = container.firstElementChild as HTMLElement | null;
    return child ? child.offsetWidth + 16 : 0; // width + gap
  };

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container || !menuItems.length) return;
    const clampedIndex = Math.max(0, Math.min(index, menuItems.length - 1));
    const cardW = getCardWidth();
    container.scrollTo({ left: clampedIndex * cardW, behavior: 'smooth' });
    setActiveIndex(clampedIndex);
  }, [menuItems.length]);

  const go = (dir: number) => scrollToIndex(activeIndex + dir);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || !menuItems.length) return;
    const cardW = getCardWidth();
    if (cardW === 0) return;
    const idx = Math.round(container.scrollLeft / cardW);
    setActiveIndex(Math.min(idx, menuItems.length - 1));
  }, [menuItems.length]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Reset index when items load
  useEffect(() => {
    if (menuItems.length > 0) setActiveIndex(0);
  }, [menuItems.length]);

  return (
    <section
      id="menu"
      className="py-16 md:py-24 bg-brand-yellow bg-tech-grid border-b-[6px] border-brand-blue overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-12">

        {/* Section header */}
        <div className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="font-mono text-brand-red text-sm font-bold tracking-widest border-[2px] border-brand-red inline-block px-3 py-1 mb-4 bg-white/90">
              SEC_01.5 // PRODUCT_DECK
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase text-brand-navy leading-none">
              MENU <span className="text-brand-blue font-mono">[DECK]</span>
            </h2>
          </div>

          {/* Desktop counter */}
          {menuItems.length > 0 && (
            <span className="hidden md:block font-mono text-sm font-bold text-brand-navy/50 tabular-nums self-end pb-1">
              {String(activeIndex + 1).padStart(2, '0')} / {String(menuItems.length).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Skeleton */}
        {loading && menuItems.length === 0 && (
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[80vw] sm:w-[46vw] md:w-[calc(25%-12px)] bg-white/50 border-[4px] border-brand-navy/30 animate-pulse"
                style={{ height: 460 }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && menuItems.length === 0 && (
          <div className="bg-white/90 border-[4px] border-brand-blue p-8 text-center font-mono font-bold text-brand-navy">
            No menu items yet.
          </div>
        )}

        {/* Cards — horizontal scroll-snap container */}
        {menuItems.length > 0 && (
          <>
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-scroll pb-2"
              style={{
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {/* Hide scrollbar */}
              <style>{`.menu-scroll::-webkit-scrollbar{display:none}`}</style>

              {menuItems.map((item, i) => {
                const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
                const imgSrc = getImageSrc(item.imageUrl);
                const isActive = i === activeIndex;

                return (
                  <motion.article
                    key={item.id}
                    onClick={() => scrollToIndex(i)}
                    whileHover={{ y: -6 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="flex-shrink-0 cursor-pointer group"
                    style={{
                      scrollSnapAlign: 'start',
                      // Mobile: ~82vw so next peeks; tablet: ~46vw; desktop: ~25%
                      width: 'clamp(280px, 80vw, 320px)',
                    }}
                  >
                    {/* Floating image zone — overflows above the card */}
                    <div className="relative flex justify-center items-end h-52 mb-0 px-6 z-10">
                      {/* Accent shadow disc behind image */}
                      <div
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-8 rounded-full blur-xl opacity-30 transition-opacity duration-300 group-hover:opacity-50"
                        style={{ background: accent }}
                      />
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={item.name}
                          className="relative z-10 h-48 w-auto max-w-full object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.25)] transition-transform duration-500 group-hover:scale-105"
                          draggable={false}
                        />
                      ) : (
                        <div
                          className="relative z-10 w-36 h-36 flex items-center justify-center border-[4px] border-brand-navy bg-brand-yellow"
                          style={{ boxShadow: `6px 6px 0 ${accent}` }}
                        >
                          <KopiKabinLogo className="w-20 h-20 text-brand-blue" />
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div
                      className="bg-white border-[4px] border-brand-navy overflow-hidden transition-all duration-300"
                      style={{
                        boxShadow: isActive
                          ? `8px 8px 0 ${accent}`
                          : `4px 4px 0 ${accent}55`,
                      }}
                    >
                      {/* Category + price row */}
                      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b-[2px] border-dashed border-gray-200">
                        <span className="font-mono text-[10px] font-black uppercase tracking-widest text-brand-navy/60 border-[2px] border-brand-navy/30 px-2 py-0.5">
                          {item.cat || 'KOPI'}
                        </span>
                        <span
                          className="font-mono text-xs font-black uppercase px-3 py-1 text-white"
                          style={{ background: accent }}
                        >
                          Rp {Number(item.price).toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Name + desc */}
                      <div className="px-5 pt-4 pb-3">
                        <div className="flex items-start gap-2 mb-2">
                          <Coffee className="text-brand-red shrink-0 mt-1" size={16} />
                          <h3 className="font-black text-xl uppercase leading-tight text-brand-navy break-words">
                            {item.name}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-2 min-h-[40px]">
                          {item.desc || '—'}
                        </p>
                      </div>

                      {/* Footer: power + stock */}
                      <div className="flex items-center justify-between px-5 py-3 border-t-[2px] border-gray-100 bg-gray-50/60">
                        <div>
                          <p className="font-mono text-[9px] uppercase font-bold text-gray-400 tracking-widest">Power</p>
                          <p className="font-black text-sm text-brand-blue">{item.power || '—'}</p>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-brand-navy/60">
                          <PackageCheck size={13} />
                          Stock {item.stockLevel ?? 0}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}

              {/* Right padding sentinel so last card doesn't stick to edge */}
              <div className="flex-shrink-0 w-4 md:w-8" aria-hidden />
            </div>

            {/* Bottom nav: dots left, arrows right — like Jago */}
            <div className="flex items-center justify-between mt-8 px-0">
              {/* Dot indicators */}
              <div className="flex items-center gap-2">
                {menuItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToIndex(i)}
                    aria-label={`Go to item ${i + 1}`}
                    className="transition-all duration-300 border-[2px] border-brand-navy focus:outline-none"
                    style={{
                      width: i === activeIndex ? 28 : 10,
                      height: 10,
                      background: i === activeIndex ? '#000EE9' : 'white',
                    }}
                  />
                ))}
              </div>

              {/* Arrow controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => go(-1)}
                  disabled={menuItems.length <= 1 || activeIndex === 0}
                  aria-label="Previous"
                  className="w-11 h-11 border-[3px] border-brand-navy bg-white hover:bg-brand-navy hover:text-white flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} strokeWidth={3} />
                </button>
                <button
                  onClick={() => go(1)}
                  disabled={menuItems.length <= 1 || activeIndex === menuItems.length - 1}
                  aria-label="Next"
                  className="w-11 h-11 border-[3px] border-brand-navy bg-white hover:bg-brand-navy hover:text-white flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} strokeWidth={3} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
