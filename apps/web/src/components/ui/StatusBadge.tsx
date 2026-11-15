import { Crown, CheckCircle2, Clock } from 'lucide-react';

export interface StatusBadgeProps {
  type: 'host' | 'ready' | 'waiting' | 'turn' | 'connected' | 'disconnected';
  label?: string;
  className?: string;
}

export function StatusBadge({ type, label, className = '' }: StatusBadgeProps) {
  switch (type) {
    case 'host':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-500/20 text-gold-300 border border-gold-500/40 ${className}`}
        >
          <Crown className="w-3 h-3 text-gold-400" />
          <span>{label || 'Host'}</span>
        </span>
      );
    case 'ready':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>{label || 'Ready'}</span>
        </span>
      );
    case 'waiting':
      return (
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-charcoal-700 text-gray-300 border border-charcoal-600 ${className}`}
        >
          <Clock className="w-3 h-3 text-gray-400" />
          <span>{label || 'Waiting'}</span>
        </span>
      );
    case 'turn':
      return (
        <span
          className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gold-500 text-charcoal-950 shadow-gold-glow animate-pulse ${className}`}
        >
          <span className="w-2 h-2 rounded-full bg-charcoal-900 animate-ping" />
          <span>{label || 'In Turn'}</span>
        </span>
      );
    case 'connected':
      return (
        <span className="flex items-center space-x-1 text-xs text-emerald-400" title="Connected">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          {label && <span>{label}</span>}
        </span>
      );
    case 'disconnected':
      return (
        <span className="flex items-center space-x-1 text-xs text-ruby-400" title="Disconnected">
          <span className="w-2 h-2 rounded-full bg-ruby-500 inline-block" />
          {label && <span>{label}</span>}
        </span>
      );
  }
}
