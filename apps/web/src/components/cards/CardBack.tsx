interface CardBackProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CardBack({ className = '', size = 'md' }: CardBackProps) {
  const sizeStyles = {
    sm: 'w-12 h-16 rounded-md',
    md: 'w-20 h-28 rounded-xl',
    lg: 'w-28 h-40 rounded-2xl',
  };

  return (
    <div
      className={`relative select-none overflow-hidden border-2 border-gold-500/70 shadow-lg ${sizeStyles[size]} ${className}`}
      style={{
        background: 'linear-gradient(135deg, #0A2E1F 0%, #061A11 50%, #030F0A 100%)',
      }}
      aria-label="Card back"
    >
      {/* Ornate inner border */}
      <div className="absolute inset-1 border border-gold-500/40 rounded-[inherit] pointer-events-none flex items-center justify-center">
        {/* Repeating diamond lattice SVG */}
        <svg width="100%" height="100%" className="opacity-25" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="card-back-pattern" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M6 0L12 6L6 12L0 6Z" fill="none" stroke="#D4AF37" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#card-back-pattern)" />
        </svg>

        {/* Center Seal */}
        <div className="absolute w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-gold-400 bg-charcoal-950/80 flex items-center justify-center shadow-md">
          <span className="text-gold-400 text-xs sm:text-sm font-bold font-serif">♠</span>
        </div>
      </div>
    </div>
  );
}
