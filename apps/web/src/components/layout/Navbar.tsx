import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Settings, User } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.js';
import { AvatarBadge } from '../ui/AvatarBadge.js';
import { ProfileModal } from '../profile/ProfileModal.js';

export function Navbar() {
  const location = useLocation();
  const { settings } = useSettings();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-charcoal-800 bg-charcoal-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-md group-hover:shadow-gold-glow transition-shadow">
              <span className="text-charcoal-950 text-lg font-black font-serif">♠</span>
            </div>
            <div>
              <span className="text-lg sm:text-xl font-bold tracking-wider font-display gold-gradient-text">
                BHABHI THULLA
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-charcoal-800 text-gold-400 rounded-full border border-gold-500/20">
                Phase 1 Preview
              </span>
            </div>
          </Link>

          {/* Right Navigation Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              to="/rules"
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                location.pathname === '/rules'
                  ? 'bg-gold-500/10 text-gold-300 border border-gold-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-charcoal-800'
              }`}
              title="How to Play"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">How to Play</span>
            </Link>

            <Link
              to="/settings"
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                location.pathname === '/settings'
                  ? 'bg-gold-500/10 text-gold-300 border border-gold-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-charcoal-800'
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Settings</span>
            </Link>

            {/* Guest Profile Chip */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center space-x-2 pl-1.5 pr-3 py-1 bg-charcoal-850 hover:bg-charcoal-800 border border-charcoal-700 hover:border-gold-500/40 rounded-full transition-all text-xs"
              title="Edit Profile"
              aria-label="Edit guest profile"
            >
              <AvatarBadge avatarId={settings.avatar} size="sm" showBorder={false} />
              <span className="font-medium text-cream-100 max-w-[100px] truncate">
                {settings.nickname}
              </span>
              <User className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Profile Edit Modal */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}
