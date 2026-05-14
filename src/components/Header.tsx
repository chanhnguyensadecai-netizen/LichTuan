import React from 'react';
import { LogOut, User as UserIcon, Menu, LogIn } from 'lucide-react';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { ROLE_LABELS } from '../constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HeaderProps {
  profile: UserProfile;
  onToggleSidebar: () => void;
  setCurrentTab: (tab: string) => void;
}

export default function Header({ profile, onToggleSidebar, setCurrentTab }: HeaderProps) {
  const handleLogout = async () => {
    try {
      await auth.signOut();
      setCurrentTab('login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between shadow-sm z-10 shrink-0 print:hidden">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-sm md:text-lg font-bold text-gray-800 uppercase tracking-tight truncate max-w-[150px] md:max-w-none">
          LỊCH CÔNG TÁC ĐẢNG ỦY
        </h2>
        <span className="hidden lg:inline-flex bg-yellow-100 text-yellow-800 text-[11px] font-bold px-2 py-1 rounded">TUẦN HIỆN TẠI</span>
      </div>

      <div className="flex items-center gap-4">
        <div 
          onClick={() => profile.id === 'guest' && setCurrentTab('login')}
          className={cn(
            "flex items-center gap-3 pr-4 border-r border-gray-200",
            profile.id === 'guest' && "cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
          )}
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900 leading-none">{profile.fullName}</p>
            <p className="text-[10px] text-gray-500 mt-1 uppercase font-semibold tracking-wider">
              {profile.id === 'guest' ? 'Click để đăng nhập' : ROLE_LABELS[profile.role]}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
            <UserIcon className="w-4 h-4" />
          </div>
        </div>

        {profile.id !== 'guest' ? (
          <button
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setCurrentTab('login')}
            className="hidden sm:flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wide cursor-pointer shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}
