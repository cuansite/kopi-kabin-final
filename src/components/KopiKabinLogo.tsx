export const KopiKabinLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Chimney & Steam */}
    <path d="M70 32.5 V20 H63 V26.5" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M66.5 13 C64.5 9 68.5 5 66.5 1" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M60.5 16 C58.5 12 62.5 8 60.5 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    
    {/* House / Chat bubble outline */}
    <path d="M50 22 L20 45 V85 C20 87.76 22.24 90 25 90 H45 L50 100 L55 90 H75 C77.76 90 80 87.76 80 85 V45 Z" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    
    {/* Coffee Bean Inner */}
    <path d="M38 52 C45 42 62 48 62 65 C62 82 45 76 38 70 C31 64 31 62 38 52 Z" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    
    {/* Coffee Bean Split line */}
    <path d="M54 48 C48 55 52 62 46 68" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
