import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  text,
  className = '',
}: LoadingSpinnerProps) {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 space-y-3 ${className}`}>
      <div className="relative">
        <Loader2 className={`${sizeStyles[size]} animate-spin text-gold-400`} />
      </div>
      {text && <p className="text-xs text-cream-200 tracking-wider uppercase">{text}</p>}
    </div>
  );
}
