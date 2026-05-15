import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { KopiKabinLogo } from "./components/KopiKabinLogo";
import { MenuCarousel } from "./components/MenuCarousel";
import { ArrowRight, Instagram, MapPin, Coffee, Users, Sparkles, MessageCircle, Terminal, Menu, X } from "lucide-react";

export default function App() {
  const { scrollY, scrollYProgress } = useScroll();
  const yMarquee = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const unsub = scrollY.on('change', v => setIsScrolled(v > 60));
    return unsub;
  }, [scrollY]);

  return (
    <div className="min-h-screen bg-brand-yellow bg-tech-grid text-brand-blue selection:bg-brand-blue selection:text-brand-yellow font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 md:p-6 transition-all duration-300 ${isScrolled ? 'bg-brand-yellow/95 backdrop-blur-md border-b-[4px] border-brand-blue shadow-[0_4px_0px_#000EE9]' : 'bg-transparent border-b-[4px] border-transparent'}`}>
        <div className="flex items-center gap-3 group cursor-pointer glitch-hover">
          <KopiKabinLogo className="w-10 h-12 md:w-12 md:h-14 transition-transform group-hover:scale-110" />
          <div className="font-extrabold text-2xl md:text-3xl tracking-tight leading-none h-full flex flex-col justify-center mt-1">
            KOPI <br className="hidden md:block" /> KABIN
          </div>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-bold uppercase tracking-wider text-sm">
          <a href="#about" className="hover:text-brand-red glitch-hover transition-colors">Tentang Kami</a>
          <a href="#visi" className="hover:text-brand-red glitch-hover transition-colors">Visi & Misi</a>
          <a href="#komunitas" className="hover:text-brand-orange glitch-hover transition-colors">Komunitas</a>
          <a href="https://instagram.com/kopikabin.id" target="_blank" rel="noreferrer" className="flex items-center gap-2 border-[4px] border-brand-blue bg-white rounded-none px-5 py-2 font-bold uppercase brutal-shadow transition-all duration-300">
            <Instagram size={18} strokeWidth={2.5} />
            <span className="font-mono text-xs mt-0.5 tracking-widest">CONNECT_</span>
          </a>
        </div>

        {/* Mobile menu toggle */}
        <button 
          className="md:hidden p-2 border-[2px] border-brand-blue bg-white brutal-shadow text-brand-blue"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ top: '80px' }}
            className="fixed left-0 right-0 z-40 bg-brand-yellow border-b-[4px] border-brand-blue p-6 flex flex-col gap-6 md:hidden brutal-shadow shadow-[0_12px_0px_#000EE9]"
          >
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="font-black text-2xl uppercase border-b-[2px] border-brand-blue/20 pb-2">Tentang Kami</a>
            <a href="#visi" onClick={() => setIsMobileMenuOpen(false)} className="font-black text-2xl uppercase border-b-[2px] border-brand-blue/20 pb-2">Visi & Misi</a>
            <a href="#komunitas" onClick={() => setIsMobileMenuOpen(false)} className="font-black text-2xl uppercase border-b-[2px] border-brand-blue/20 pb-2">Komunitas</a>
            <a href="https://instagram.com/kopikabin.id" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 border-[4px] border-brand-blue bg-white rounded-none px-5 py-4 font-bold uppercase brutal-shadow mt-4">
              <Instagram size={24} strokeWidth={2.5} />
              <span className="font-mono text-lg mt-0.5 tracking-widest">CONNECT_</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <header className="relative pt-32 pb-16 md:pt-48 md:pb-32 px-4 md:px-12 flex flex-col items-center justify-center min-h-[90vh]">
        
        {/* Futuristic Background Accents */}
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-brand-red/20 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-brand-blue/20 blur-[100px] rounded-full pointer-events-none"></div>

        <motion.div 
          style={{ y: yHero }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center w-full max-w-6xl mx-auto relative z-10"
        >
          <div className="inline-flex items-center gap-2 mb-6 border-[2px] border-brand-blue bg-white px-4 py-1 font-mono text-xs uppercase tracking-widest font-bold">
            <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></span>
            System Online / Kopi Keliling
          </div>
          
          <h1 className="text-[12vw] sm:text-[10vw] md:text-[8vw] leading-[0.85] font-black uppercase tracking-tighter mb-8 md:mb-12 relative break-words px-2">
            Cerita di Jalan, <br/>
            <span className="text-transparent text-stroke-blue bg-clip-text bg-gradient-to-r from-brand-blue via-brand-navy to-brand-blue">
              Cerita Jadi Jalan.
            </span>
            <div className="absolute -top-10 -right-10 hidden md:block opacity-30 pointer-events-none">
               <svg width="100" height="100" viewBox="0 0 100 100" className="animate-spin-slow" style={{animationDuration: '20s'}}>
                  <path d="M50 0 L55 45 L100 50 L55 55 L50 100 L45 55 L0 50 L45 45 Z" fill="#000EE9"/>
               </svg>
            </div>
          </h1>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-12 w-full px-4">
            <a href="#lokasi" className="w-full md:w-auto text-center group flex items-center justify-center gap-4 bg-brand-blue text-brand-yellow border-[4px] border-brand-navy rounded-none px-8 py-4 font-bold uppercase text-lg brutal-shadow transition-all relative overflow-hidden">
               <span className="relative z-10 font-mono tracking-wider">START_JOURNEY</span>
               <Terminal className="relative z-10 group-hover:translate-x-1 transition-transform hidden sm:block" />
               <div className="absolute inset-0 bg-brand-navy translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
            </a>
            
            <div className="w-full md:w-auto flex flex-col text-left border-l-[4px] border-brand-blue pl-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-brand-navy">
              <div>TARGET: JALANAN</div>
              <div>COORDS: METROPOLIS_SQ</div>
              <div className="text-brand-red">STATUS: READY</div>
            </div>
          </div>
        </motion.div>
        
        <div className="absolute right-4 bottom-48 hidden xl:flex flex-col gap-4 text-brand-blue opacity-50">
          <div className="[writing-mode:vertical-rl] font-mono text-xs uppercase tracking-[0.3em]">
            // V.1.0_KOPIKABIN_CORE
          </div>
        </div>
      </header>

      {/* Sci-Fi Marquee */}
      <div className="relative h-40 md:h-48 overflow-hidden bg-brand-yellow flex items-center justify-center border-y-[6px] border-brand-blue">
         {/* Background Grid inside marquee */}
         <div className="absolute inset-0 bg-tech-grid opacity-50"></div>
         
         <motion.div 
           className="absolute flex whitespace-nowrap bg-brand-blue text-brand-yellow py-4 w-[110%] transform -rotate-3 border-y-[4px] border-brand-navy shadow-[0_0_30px_rgba(0,14,233,0.3)] z-10"
           animate={{ x: ["0%", "-50%"] }} 
           transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
         >
            <div className="flex font-black text-3xl uppercase tracking-wider items-center">
              {[...Array(8)].map((_, i) => (
                <React.Fragment key={i}>
                  <span className="mx-6">KOPI KELILING</span>
                  <span className="mx-6 text-brand-yellow font-mono text-xl">{`<//>`}</span>
                  <span className="mx-6">RUANG KOMUNITAS</span>
                  <span className="mx-6 text-brand-yellow font-mono text-xl">{`<//>`}</span>
                </React.Fragment>
              ))}
            </div>
         </motion.div>

         <motion.div 
           className="absolute flex whitespace-nowrap bg-brand-red text-white py-4 w-[110%] transform rotate-2 border-y-[4px] border-brand-navy opacity-90 z-0"
           animate={{ x: ["-50%", "0%"] }} 
           transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
         >
            <div className="flex font-black text-3xl uppercase tracking-wider items-center">
              {[...Array(8)].map((_, i) => (
                <React.Fragment key={i}>
                   <span className="mx-6">MAJU BERSAMA</span>
                   <span className="mx-6 text-brand-navy font-mono text-xl">+++</span>
                   <span className="mx-6">CERITA DI JALAN</span>
                   <span className="mx-6 text-brand-navy font-mono text-xl">+++</span>
                </React.Fragment>
              ))}
            </div>
         </motion.div>
      </div>

      {/* About Section - Cyber / Brutalist */}
      <section id="about" className="grid grid-cols-1 md:grid-cols-2 border-b-[6px] border-brand-blue relative">
        <div className="p-8 md:p-16 md:p-24 border-b-[6px] md:border-b-0 md:border-r-[6px] border-brand-blue bg-white flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-tech-grid opacity-30 transform rotate-45 scale-150"></div>
          
          <div className="font-mono text-brand-red text-sm font-bold tracking-widest border-[2px] border-brand-red inline-block px-3 py-1 mb-8 self-start bg-brand-red/10">
            SEC_01 // ABOUT_SYS
          </div>
          
          <h2 className="text-5xl md:text-7xl font-black uppercase leading-none mb-8 relative z-10 transition-transform duration-500 group-hover:translate-x-2">
            Tentang <br/> Usaha
          </h2>
          
          <p className="text-xl md:text-2xl font-medium leading-relaxed max-w-lg relative z-10">
            <strong>Kopi Kabin</strong> merupakan kopi keliling yang tidak hanya menjadi sarana masyarakat untuk membeli kopi namun juga menjadi <span className="bg-brand-blue text-white px-2 py-0.5 font-bold inline-block transform -rotate-1">ruang komunikasi</span>, <span className="bg-brand-red text-white px-2 py-0.5 font-bold inline-block transform rotate-1">cerita</span>, dan <span className="border-b-[4px] border-brand-orange text-brand-navy font-black">maju bersama</span>.
          </p>
        </div>

        <div className="bg-brand-navy bg-tech-grid-light p-8 md:p-16 flex items-center justify-center min-h-[60vh] relative overflow-hidden">
           {/* Radar scanline effect */}
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-blue/20 to-transparent w-full h-[5%] animate-scanline"></div>

           <motion.div 
             whileHover={{ scale: 1.05, rotate: 5 }}
             className="relative w-full max-w-sm aspect-square bg-brand-yellow border-[8px] border-brand-blue flex items-center justify-center p-12 brutal-shadow"
           >
             {/* Techy corner brackets */}
             <div className="absolute -top-4 -left-4 w-8 h-8 border-t-[8px] border-l-[8px] border-brand-red"></div>
             <div className="absolute -top-4 -right-4 w-8 h-8 border-t-[8px] border-r-[8px] border-brand-red"></div>
             <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-[8px] border-l-[8px] border-brand-red"></div>
             <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-[8px] border-r-[8px] border-brand-red"></div>

             <div className="absolute inset-0 border-[4px] border-brand-blue border-dashed rounded-full m-8 animate-spin-slow opacity-50"></div>
             
             <KopiKabinLogo className="w-full h-full text-brand-blue relative z-10 filter drop-shadow-[4px_4px_0px_#FA0200]" />
           </motion.div>
        </div>
      </section>

      <MenuCarousel />

      {/* Visi & Misi Section */}
      <section id="visi" className="py-20 md:py-32 px-4 md:px-12 bg-white bg-tech-grid border-b-[6px] border-brand-blue">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b-[6px] border-brand-navy pb-8 mb-16">
             <div className="font-mono text-brand-blue text-sm font-bold tracking-widest inline-block px-3 py-1 bg-brand-blue/10 mb-4 md:mb-0">
               SEC_02 // OBJECTIVES
             </div>
             <h2 className="text-6xl md:text-8xl font-black uppercase text-brand-navy">
               VISI <span className="text-brand-orange">+</span> MISI
             </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            {/* Visi */}
            <div className="md:col-span-5 flex flex-col justify-start">
               <div className="bg-brand-yellow border-[4px] border-brand-navy p-8 brutal-shadow relative">
                 <div className="absolute top-0 right-0 bg-brand-navy text-brand-yellow font-mono text-xs px-2 py-1 font-bold">TARGET_01</div>
                 <h3 className="text-4xl font-black uppercase mb-6 flex items-center gap-4 text-brand-navy border-b-[4px] border-brand-navy pb-4">
                   Visi
                 </h3>
                 <div className="text-2xl md:text-3xl font-bold leading-tight uppercase font-sans">
                   Menjadi ruang komunitas jalanan bagi peminat kopi.
                 </div>
               </div>
            </div>

            {/* Misi */}
            <div className="md:col-span-7 flex flex-col gap-6">
                 {[
                   { title: "Menyediakan ruang komunitas", label: "MISSION_ALPHA", color: "brand-blue" },
                   { title: "Memberikan qualitas terbaik", label: "MISSION_BETA", color: "brand-red" },
                   { title: "Memberikan kesempatan perubahan pada masyarakat", label: "MISSION_GAMMA", color: "brand-orange" }
                 ].map((misi, i) => (
                   <motion.div 
                     key={i}
                     whileHover={{ x: 10 }}
                     className="grid grid-cols-[auto_1fr] bg-brand-navy text-white border-[4px] border-brand-blue brutal-shadow group"
                   >
                     <div className={`flex flex-col justify-between items-center p-6 border-r-[4px] border-brand-blue bg-white text-brand-navy`}>
                        <span className="font-black text-4xl">0{i+1}</span>
                        {i === 0 && <MessageCircle size={28} className="text-brand-blue" />}
                        {i === 1 && <Coffee size={28} className="text-brand-red" />}
                        {i === 2 && <Users size={28} className="text-brand-orange" />}
                     </div>
                     <div className="p-6 md:p-8 flex items-center relative overflow-hidden">
                        <div className="absolute top-2 right-2 font-mono text-[10px] text-white/40 tracking-widest">{misi.label}</div>
                        <h3 className="text-xl md:text-3xl font-bold uppercase z-10 group-hover:text-brand-yellow transition-colors">{misi.title}</h3>
                     </div>
                   </motion.div>
                 ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cyber Social Community */}
      <section id="komunitas" className="bg-brand-blue text-white py-24 px-4 md:px-12 border-b-[6px] border-brand-navy overflow-hidden bg-tech-grid-light">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 relative">
          
          <div className="w-full md:w-1/2 relative md:order-2">
            <div className="font-mono text-brand-yellow text-sm font-bold tracking-widest inline-block px-3 py-1 bg-brand-yellow/10 mb-8 border-[2px] border-brand-yellow">
              SEC_03 // NETWORK
            </div>
            
            <h2 className="text-6xl md:text-8xl font-black uppercase mb-6 leading-none text-brand-yellow drop-shadow-[4px_4px_0px_#FA0200]">
              Maju <br/> Bersama
            </h2>
            <p className="text-xl font-medium mb-10 max-w-lg font-mono leading-relaxed bg-brand-navy/50 p-6 border-l-[4px] border-brand-yellow">
              {`>>`} Follow kami di Instagram untuk mengetahui jadwal rute Kopi Kabin.<br/><br/>
              {`>>`} Akses update menu terbaru, dan berbagai cerita menarik dari jalanan.
            </p>
            <a href="https://instagram.com/kopikabin.id" className="group inline-flex items-center gap-4 bg-brand-yellow text-brand-navy border-[4px] border-brand-navy hover:bg-brand-red hover:text-white rounded-none px-8 py-4 font-bold uppercase text-xl brutal-shadow transition-all relative overflow-hidden">
              <span className="relative z-10 flex items-center gap-4 font-mono">
                <Instagram size={28} />
                INITIATE_FOLLOW
              </span>
            </a>
          </div>

          <div className="w-full md:w-1/2 md:order-1 relative perspective-1000">
            {/* Cyberspace floating phone/card */}
            <motion.div 
               animate={{ y: [0, -15, 0] }}
               transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
               className="bg-white text-brand-navy border-[6px] border-brand-navy p-6 pb-8 shadow-[16px_16px_0px_var(--color-brand-red)] max-w-md mx-auto transform rotate-y-12 rotate-x-6 hover:rotate-0 transition-transform duration-700 relative z-10"
            >
               <div className="absolute top-0 left-0 w-full h-[6px] bg-brand-navy"></div>
               <div className="flex items-center justify-between mb-6 border-b-[2px] border-gray-200 pb-4">
                 <div className="font-bold text-xl flex items-center gap-2">
                   kopikabin <span className="bg-brand-blue text-white text-xs px-2 py-0.5 rounded-full">OK</span>
                 </div>
                 <div className="flex gap-1.5">
                   <div className="w-2 h-2 bg-brand-navy"></div>
                   <div className="w-2 h-2 bg-brand-navy"></div>
                   <div className="w-2 h-2 bg-brand-navy"></div>
                 </div>
               </div>
               <div className="flex items-center gap-6 mb-6">
                 <div className="w-24 h-24 rounded-none border-[4px] border-brand-yellow p-1 bg-brand-navy brutal-shadow-yellow group relative overflow-hidden">
                   <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-scanline"></div>
                   <div className="w-full h-full bg-brand-blue flex items-center justify-center text-brand-yellow relative z-10">
                      <KopiKabinLogo className="w-12 h-12 transform group-hover:scale-110 transition-transform" />
                   </div>
                 </div>
                 <div className="flex gap-4 text-center flex-1 justify-between font-mono">
                   <div><div className="font-black text-2xl text-brand-red">99</div><div className="text-[10px] uppercase font-bold text-gray-500">Post</div></div>
                   <div><div className="font-black text-2xl">9M</div><div className="text-[10px] uppercase font-bold text-gray-500">Followers</div></div>
                   <div><div className="font-black text-2xl">9</div><div className="text-[10px] uppercase font-bold text-gray-500">Following</div></div>
                 </div>
               </div>
               <div className="mb-6 font-mono">
                 <h4 className="font-black text-lg">Kopi Kabin</h4>
                 <p className="opacity-70 text-sm">Coffee / Street Interface</p>
               </div>
               <div className="flex gap-3">
                 <button className="flex-1 bg-brand-blue text-white py-2.5 font-bold text-xs uppercase tracking-wider border-[2px] border-brand-navy hover:bg-brand-red transition-colors">Follow</button>
                 <button className="flex-1 border-[2px] border-brand-navy bg-gray-50 py-2.5 font-bold text-xs uppercase tracking-wider hover:bg-brand-yellow transition-colors">Code</button>
                 <button className="flex-1 border-[2px] border-brand-navy bg-gray-50 py-2.5 font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors">/Msg</button>
               </div>
            </motion.div>
            
            {/* Background elements */}
            <div className="absolute top-10 left-0 w-64 h-64 border-[4px] border-brand-yellow border-dashed rounded-full opacity-30 animate-spin-slow pointer-events-none"></div>
            <div className="absolute bottom-0 right-10 flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-16 bg-brand-red opacity-80" style={{ height: `${Math.random() * 64 + 16}px` }}></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cyber Footer */}
      <footer className="bg-brand-navy border-t-[8px] border-brand-yellow p-8 md:p-16 text-brand-yellow bg-tech-grid flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10 w-full max-w-7xl mx-auto">
          
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-brand-yellow text-brand-navy p-3 border-[4px] border-brand-blue">
                <KopiKabinLogo className="w-12 h-12" />
              </div>
              <div>
                <div className="font-black text-4xl uppercase leading-none text-brand-yellow tracking-tighter">KOPI KABIN</div>
                <div className="text-brand-blue bg-brand-yellow inline-block px-2 mt-1 font-mono text-xs font-bold uppercase tracking-widest">Sys_Ver_2025.1</div>
              </div>
            </div>
            <div className="text-xl font-bold uppercase tracking-widest opacity-80 border-l-[4px] border-brand-red pl-4 py-2">
              Cerita di jalan, <br/> cerita jadi jalan.
            </div>
          </div>
          
          <div>
            <h4 className="font-mono text-sm uppercase mb-4 text-white border-b-[2px] border-white/20 pb-2">/ DIR_CONTACT</h4>
            <ul className="space-y-4 font-mono text-sm tracking-wider">
              <li className="hover:text-white cursor-pointer flex items-center gap-3 transition-colors group">
                <div className="w-2 h-2 bg-brand-red group-hover:scale-150 transition-transform"></div>
                kopikabin.id
              </li>
              <li className="hover:text-white cursor-pointer flex items-center gap-3 transition-colors group">
                <div className="w-2 h-2 bg-brand-blue group-hover:scale-150 transition-transform"></div>
                +62 877-5520-2057
              </li>
              <li className="hover:text-white cursor-pointer flex items-center gap-3 transition-colors group">
                <div className="w-2 h-2 bg-brand-orange group-hover:scale-150 transition-transform"></div>
                kopikabin@gmail.com
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-mono text-sm uppercase mb-4 text-white border-b-[2px] border-white/20 pb-2">/ LOC_DATA</h4>
            <ul className="space-y-4 font-mono text-sm tracking-wider">
              <li className="flex gap-3">
                <MapPin className="text-brand-yellow shrink-0 mt-0.5" size={16} />
                <span className="hover:text-white cursor-pointer transition-colors">Metropolis Town Square</span>
              </li>
              <li className="flex gap-3 opacity-60">
                <Terminal className="text-brand-yellow shrink-0 mt-0.5" size={16} />
                <span>Jelajah Jalanan Jakarta</span>
              </li>
              <li className="flex gap-3 mt-4 pt-4 border-t-[2px] border-white/10 opacity-40 hover:opacity-100 transition-opacity">
                <Terminal className="text-brand-yellow shrink-0 mt-0.5" size={16} />
                <Link to="/login/kurir" className="hover:text-brand-yellow transition-colors">STAFF_LOGIN</Link>
              </li>
              <li className="flex gap-3 mt-2 opacity-40 hover:opacity-100 transition-opacity">
                <Terminal className="text-brand-red shrink-0 mt-0.5" size={16} />
                <Link to="/login/admin" className="hover:text-brand-red transition-colors">SYS_ADMIN</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t-[4px] border-brand-blue/30 w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs font-mono uppercase tracking-widest opacity-60">
          <div>(C) 2025 KOPI KABIN_ INC. ALL PROTOCOLS SECURED.</div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span>REGION: INDONESIA</span>
            <span>SYSTEM_EST: 2025</span>
          </div>
        </div>
      </footer>

      {/* Floating social contact buttons */}
      <div className="fixed bottom-6 right-4 z-[45] flex flex-col gap-3">
        <a
          href="https://wa.me/6287755202057"
          target="_blank"
          rel="noopener noreferrer"
          title="Chat WhatsApp"
          className="w-14 h-14 rounded-full border-[3px] border-black shadow-[3px_3px_0px_black] flex items-center justify-center transition-transform hover:-translate-y-1 active:translate-y-0"
          style={{ backgroundColor: '#25D366' }}
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
        <a
          href="https://www.tiktok.com/@kopikabin"
          target="_blank"
          rel="noopener noreferrer"
          title="TikTok @kopikabin"
          className="w-14 h-14 rounded-full border-[3px] border-black shadow-[3px_3px_0px_black] flex items-center justify-center transition-transform hover:-translate-y-1 active:translate-y-0 bg-black"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z"/>
          </svg>
        </a>
      </div>
    </div>
  );
}
