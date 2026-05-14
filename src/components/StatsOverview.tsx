import React from 'react';
import { Schedule, UserRole } from '../types';
import { Calendar, Users, MapPin, Clock, ArrowRight, AlertCircle, Plus, Sparkles } from 'lucide-react';
import { isAfter, isToday, parseISO, startOfToday, format } from 'date-fns';
import { TYPE_CONFIG } from '../constants';

interface StatsOverviewProps {
  schedules: Schedule[];
  setCurrentTab: (tab: string) => void;
  role: UserRole;
}

export default function StatsOverview({ schedules, setCurrentTab, role }: StatsOverviewProps) {
  const today = startOfToday();
  const todaySchedules = schedules.filter(s => isToday(parseISO(s.date)));
  const upcomingSchedules = schedules
    .filter(s => isAfter(parseISO(s.date), today) || isToday(parseISO(s.date)))
    .slice(0, 5);

  // Calculate dynamic stats
  const nextMeeting = todaySchedules.length > 0 
    ? todaySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime))[0]
    : upcomingSchedules[0];

  const urgentCount = schedules.filter(s => 
    s.priority === 'high' && (isToday(parseISO(s.date)) || isAfter(parseISO(s.date), today))
  ).length;

  // Weekly progress calculation
  const startOfWeekDate = new Date(today);
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(startOfWeekDate.setDate(diff));
  const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));

  const weeklySchedules = schedules.filter(s => {
    const d = parseISO(s.date);
    return d >= monday && d <= sunday;
  });

  const completedWeekly = weeklySchedules.filter(s => {
    const d = parseISO(s.date);
    return d < today || (isToday(d) && s.startTime < format(new Date(), 'HH:mm'));
  }).length;

  const progressPercent = weeklySchedules.length > 0 
    ? Math.round((completedWeekly / weeklySchedules.length) * 100) 
    : 100;

  const stats = [
    { 
      label: 'Hôm nay', 
      value: todaySchedules.length.toString().padStart(2, '0'), 
      info: 'Cuộc họp dự kiến', 
      color: 'text-[#da251d]' 
    },
    { 
      label: 'Chủ trì', 
      value: nextMeeting ? nextMeeting.host.split(' - ')[0] : 'N/A', 
      info: nextMeeting ? (nextMeeting.host.includes(' - ') ? nextMeeting.host.split(' - ')[1] : nextMeeting.host) : 'Không có lịch', 
      color: 'text-blue-700' 
    },
    { 
      label: 'Thông báo', 
      value: urgentCount.toString().padStart(2, '0'), 
      info: 'Lịch quan trọng', 
      color: 'text-yellow-600' 
    },
    { 
      label: 'Hoàn thành', 
      value: `${progressPercent}%`, 
      info: 'Chỉ tiêu tuần', 
      color: 'text-green-600' 
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">{stat.label}</div>
              <div className={`text-2xl font-bold ${stat.color} my-1`}>{stat.value}</div>
              <div className="text-[10px] text-gray-400 font-medium">{stat.info}</div>
            </div>
          ))}
        </div>

        {['admin', 'office', 'leader'].includes(role) && (
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <button 
              onClick={() => setCurrentTab('schedules')}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-[#da251d] text-white rounded-xl font-bold shadow-lg hover:bg-red-800 transition-all cursor-pointer uppercase text-xs tracking-wider"
            >
              <Plus className="w-4 h-4" /> Thêm lịch mới
            </button>
            <button 
              onClick={() => setCurrentTab('schedules')}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg font-bold hover:bg-yellow-100 transition-all cursor-pointer text-[10px] uppercase tracking-tighter"
            >
              <Sparkles className="w-3 h-3" /> Nhập bằng AI
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide">
              <Clock className="w-4 h-4 text-[#da251d]" />
              Lịch công tác sắp tới
            </h3>
            <button 
              onClick={() => setCurrentTab('weekly')}
              className="text-[#da251d] text-[11px] font-bold uppercase hover:underline flex items-center gap-1 cursor-pointer tracking-wider"
            >
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-4">
            {upcomingSchedules.length > 0 ? (
              upcomingSchedules.map((s) => (
                <div key={s.id} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group bg-gray-50/50">
                  <div className="w-12 h-12 rounded-lg bg-white flex flex-col items-center justify-center shrink-0 border border-gray-100 shadow-sm">
                    <span className="text-[9px] uppercase font-bold text-gray-400">T{parseISO(s.date).getMonth() + 1}</span>
                    <span className="text-lg font-bold text-[#da251d] leading-none">{parseISO(s.date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight ${TYPE_CONFIG[s.type].color.replace('rounded-full', 'rounded')}`}>
                        {TYPE_CONFIG[s.type].label}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" /> {s.startTime}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-gray-800 truncate group-hover:text-[#da251d] transition-colors">{s.title}</h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-[10px] text-gray-500 items-center flex gap-1 truncate font-medium italic">
                        <MapPin className="w-3 h-3 text-[#da251d]" /> {s.location}
                      </p>
                      <p className="text-[10px] text-gray-500 items-center flex gap-1 truncate font-bold">
                        <Users className="w-3 h-3" /> {s.host}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-xs">Chưa có lịch công tác sắp tới.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#da251d] rounded-xl p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-lg">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
           
           <div>
              <h3 className="text-xl font-bold mb-3 tracking-tight uppercase">Điều hành Thông minh</h3>
              <p className="text-red-100 text-[11px] leading-relaxed opacity-80 font-medium">
                Hệ thống quản lý hành chính tập trung dành cho Đảng ủy Xã. Đảm bảo tính chính xác, kịp thời và minh bạch trong mọi hoạt động.
              </p>
           </div>
           
           <div className="mt-8 flex flex-wrap gap-2">
              <div className="bg-white/10 backdrop-blur-md rounded px-3 py-1 border border-white/10">
                 <p className="text-[9px] text-red-100 uppercase font-bold tracking-wider">Kỷ cương</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded px-3 py-1 border border-white/10">
                 <p className="text-[9px] text-red-100 uppercase font-bold tracking-wider">Trách nhiệm</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
