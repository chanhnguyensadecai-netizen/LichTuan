import React from 'react';
import { 
  BarChart3, 
  Calendar, 
  ChevronRight, 
  LayoutDashboard, 
  ListTodo, 
  PlusCircle, 
  Settings, 
  Users,
  X,
  LogOut
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth } from '../lib/firebase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  profile: UserProfile;
  orgName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentTab, setCurrentTab, profile, orgName, isOpen, onClose }: SidebarProps) {
  const role = profile.role;
  const menuItems = [
    { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard },
    { id: 'schedules', label: 'Nhập lịch', icon: Calendar, roles: ['admin', 'office', 'leader'] },
    { id: 'weekly', label: 'Lịch tuần', icon: ListTodo },
    { id: 'reports', label: 'Báo cáo & Thống kê', icon: BarChart3 },
    { id: 'accounts', label: 'Quản lý tài khoản', icon: Users, roles: ['admin'] },
    { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings, roles: ['admin', 'office', 'leader'] },
  ];

  const filteredMenu = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  return (
    <aside className={cn(
      "fixed top-0 left-0 bottom-0 w-52 bg-[#da251d] text-white flex flex-col h-full shrink-0 shadow-lg z-20 transition-all duration-300 ease-in-out lg:translate-x-0 print:hidden",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-4 border-b border-red-700 flex flex-col items-center gap-3 relative">
        <div 
          className="text-center w-full overflow-hidden cursor-pointer"
          onClick={() => profile.id === 'guest' ? setCurrentTab('login') : setCurrentTab('dashboard')}
        >
          <h1 className="text-[12px] font-black uppercase tracking-tight leading-tight text-yellow-400 drop-shadow-sm">Đảng Bộ Tỉnh Đồng Tháp</h1>
          <h2 className="text-[12px] font-black uppercase tracking-tight mt-1 text-yellow-400 drop-shadow-md">
            {orgName || 'Đảng ủy xã Tân Dương'}
          </h2>
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-1">
        {filteredMenu.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentTab(item.id);
              if (window.innerWidth < 1024) onClose();
            }}
            className={cn(
              "w-full flex items-center gap-2 px-4 py-3 transition-all duration-200 group cursor-pointer",
              currentTab === item.id 
                ? "bg-white/10 border-l-4 border-yellow-400 font-semibold" 
                : "text-red-100 hover:bg-white/5 opacity-80 hover:opacity-100"
            )}
          >
            <item.icon className={cn(
              "w-4 h-4 transition-colors shrink-0",
              currentTab === item.id ? "text-yellow-400" : "text-red-200 group-hover:text-white"
            )} />
            <span className="text-[13px] leading-tight text-left">{item.label}</span>
          </button>
        ))}
      </nav>

      {profile.id !== 'guest' && (
        <div className="p-2 border-t border-red-700">
          <button 
            onClick={() => {
              auth.signOut();
              setCurrentTab('login');
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center gap-2 px-4 py-3 text-red-100 hover:bg-white/5 opacity-80 hover:opacity-100 transition-all rounded cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-200" />
            <span className="text-[13px] font-medium tracking-tight">Đăng xuất</span>
          </button>
        </div>
      )}

      <div className="p-4 border-t border-red-700 text-[10px] text-center opacity-60 uppercase tracking-widest font-medium">
        Hệ thống Quản lý Hành chính v2.4
      </div>
    </aside>
  );
}
