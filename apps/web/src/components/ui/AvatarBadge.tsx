import { AvatarId, AVAILABLE_AVATARS } from '@bhabhi/shared';

export interface AvatarBadgeProps {
  avatarId: AvatarId;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBorder?: boolean;
  className?: string;
}

export function AvatarBadge({
  avatarId,
  size = 'md',
  showBorder = true,
  className = '',
}: AvatarBadgeProps) {
  const avatar = AVAILABLE_AVATARS.find((a) => a.id === avatarId) || AVAILABLE_AVATARS[0]!;

  const sizeStyles = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-11 h-11 text-xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-20 h-20 text-4xl',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-charcoal-800 shadow-md transition-transform select-none ${
        sizeStyles[size]
      } ${
        showBorder ? 'ring-2 ring-gold-500/70 border border-charcoal-950' : ''
      } ${className}`}
      title={avatar.label}
      aria-label={avatar.label}
      style={{
        background: `radial-gradient(circle at 35% 35%, ${avatar.color}33, #161b26 90%)`,
      }}
    >
      <span role="img" aria-label={avatar.label}>
        {avatar.emoji}
      </span>
    </div>
  );
}
