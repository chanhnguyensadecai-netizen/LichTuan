import React, { useRef } from 'react';
import { Schedule } from '../types';
import { 
  format, 
  startOfWeek, 
  addDays, 
  parseISO, 
  isSameDay, 
  startOfToday,
  isWithinInterval,
  endOfWeek
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { Printer, Download, ChevronLeft, ChevronRight, Clock, MapPin, Users, Share2 } from 'lucide-react';
import { TYPE_CONFIG } from '../constants';

interface WeeklyViewProps {
  schedules: Schedule[];
  orgName?: string;
}

export default function WeeklyView({ schedules, orgName }: WeeklyViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = React.useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [copied, setCopied] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getSchedulesForDay = (day: Date) => {
    return schedules.filter(s => isSameDay(parseISO(s.date), day) && s.status === 'approved')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
  const resetToCurrent = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleShareZalo = async () => {
    const weekStr = `LỊCH CÔNG TÁC TUẦN ${format(currentWeekStart, 'ww')} (${format(weekDays[0], 'dd/MM')} - ${format(weekDays[6], 'dd/MM')})\n${orgName || 'Đảng ủy xã Tân Dương'}\n\n`;
    
    let content = weekStr;
    
    weekDays.forEach(day => {
      const daySchedules = getSchedulesForDay(day);
      if (daySchedules.length > 0) {
        content += `${format(day, 'EEEE, dd/MM/yyyy', { locale: vi }).toUpperCase()}\n`;
        daySchedules.forEach(s => {
          content += `- ${s.startTime}: ${s.title}\n`;
          content += `  + Địa điểm: ${s.location}\n`;
          content += `  + Chủ trì: ${s.host}\n`;
          if (s.participants) {
            content += `  + Thành phần: ${s.participants}\n`;
          }
          content += `\n`;
        });
      }
    });

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      // Open Zalo web to help the user paste it
      window.open('https://chat.zalo.me', '_blank');
    } catch (err) {
      alert('Không thể sao chép văn bản. Vui lòng kiểm tra lại quyền truy cập bộ nhớ tạm.');
    }
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-gray-800 uppercase tracking-tight">Lịch công tác tuần</span>
          <span className="bg-yellow-100 text-yellow-800 text-[11px] font-bold px-2 py-1 rounded">TUẦN {format(currentWeekStart, 'ww')}</span>
        </div>

        <div className="flex items-center gap-2">
           <div className="flex items-center bg-white border border-gray-200 rounded p-1 shadow-sm">
             <button onClick={prevWeek} className="p-1.5 hover:bg-gray-50 rounded transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
             <button onClick={resetToCurrent} className="px-3 py-1 text-xs font-bold text-gray-700 hover:text-[#da251d] cursor-pointer uppercase">Hiện tại</button>
             <button onClick={nextWeek} className="p-1.5 hover:bg-gray-50 rounded transition-colors cursor-pointer"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
           </div>
           
           <button 
             onClick={handleShareZalo}
             className={`flex items-center gap-2 px-4 py-2 border rounded text-xs font-bold shadow-sm transition-all cursor-pointer ${
               copied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
             }`}
           >
             <Share2 className="w-4 h-4" /> {copied ? 'Đã sao chép nội dung!' : 'Gửi Zalo'}
           </button>

           <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs font-bold shadow-sm hover:bg-gray-200 transition-all cursor-pointer"
           >
             <Printer className="w-4 h-4" /> Xuất PDF
           </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 print:p-2">
          {/* Header for print */}
          <div className="hidden print:flex justify-between mb-6 border-b border-gray-200 pb-4 text-center">
             <div className="flex-1">
                <p className="text-[10px] font-bold uppercase text-gray-600">Đảng Bộ Tỉnh Đồng Tháp</p>
                <p className="text-[12px] font-bold uppercase text-[#da251d] leading-tight mt-1">{orgName || 'Đảng ủy xã Tân Dương'}</p>
             </div>
          </div>

          <div className="text-center mb-6">
             <h1 className="text-xl font-bold uppercase text-gray-800 tracking-tight">Lịch công tác tuần</h1>
             <p className="text-gray-500 mt-1 text-xs font-medium uppercase">
              (Từ ngày {format(weekDays[0], 'dd/MM/yyyy')} đến ngày {format(weekDays[6], 'dd/MM/yyyy')})
             </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-2 border-black border-collapse text-[13px] text-black min-w-[800px]">
              <thead className="text-black font-bold">
                <tr>
                  <th className="border-2 border-black p-2 w-[90px] text-center uppercase tracking-tight font-bold">Thứ, ngày, tháng</th>
                  <th className="border-2 border-black p-2 text-center uppercase tracking-tight font-bold">Nội dung</th>
                  <th className="border-2 border-black p-2 w-[200px] text-center uppercase tracking-tight font-bold">Thời gian, địa điểm</th>
                  <th className="border-2 border-black p-2 w-[200px] text-center uppercase tracking-tight font-bold">Thường trực Đảng ủy</th>
                  <th className="border-2 border-black p-2 w-[140px] text-center uppercase tracking-tight font-bold">Thành phần</th>
                </tr>
              </thead>
              <tbody>
                {weekDays.map((day) => {
                  const daySchedules = getSchedulesForDay(day);
                  const isTodayActive = isSameDay(day, startOfToday());
                  const dayName = format(day, 'EEEE', { locale: vi });
                  const dateStr = format(day, 'd.M.yyyy');
                  
                  if (daySchedules.length === 0) {
                    return (
                      <tr key={day.toISOString()} className={isTodayActive ? "bg-yellow-50/30" : ""}>
                        <td className="border-2 border-black p-2 text-center align-middle font-bold leading-tight">
                          <div className="capitalize">{dayName}</div>
                          <div>{dateStr}</div>
                        </td>
                        <td colSpan={4} className="border-2 border-black p-4 text-center text-gray-300 italic uppercase tracking-[0.2em] font-bold text-xs">
                          --- Nghỉ ---
                        </td>
                      </tr>
                    );
                  }

                  return daySchedules.map((s, index) => (
                    <tr key={s.id} className={`${isTodayActive ? "bg-yellow-50/50" : ""} hover:bg-gray-50 transition-colors break-inside-avoid print:break-inside-avoid`}>
                      {index === 0 && (
                        <td 
                          rowSpan={daySchedules.length} 
                          className="border-2 border-black p-2 text-center align-middle font-bold leading-tight w-[90px]"
                        >
                          <div className="capitalize">{dayName}</div>
                          <div>{dateStr}</div>
                        </td>
                      )}
                      <td className="border-2 border-black p-2 align-top text-left">
                        <div className="flex gap-1">
                          <span className="shrink-0">-</span>
                          <span className="font-medium leading-tight">{s.title}</span>
                        </div>
                      </td>
                      <td className="border-2 border-black p-2 align-top text-left">
                        <div className="flex gap-1">
                          <span className="shrink-0">-</span>
                          <div className="leading-tight">
                            {s.startTime.replace(':', 'h')}, {s.location}
                          </div>
                        </div>
                      </td>
                      <td className="border-2 border-black p-2 align-top text-left">
                        <div className="space-y-0.5">
                          {s.host.split(/[,;\n]/).filter(h => h.trim()).map((part, i) => (
                            <div key={i} className="flex gap-1 items-start leading-tight">
                              <span className="shrink-0">-</span>
                              <span>{part.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="border-2 border-black p-2 align-top text-left">
                        {s.participants ? (
                          <div className="flex gap-1 items-start leading-tight text-[12px]">
                            <span className="shrink-0">-</span>
                            <span>{s.participants}</span>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 border-t border-gray-200 bg-gray-50 p-3 flex justify-end items-center text-[10px] text-gray-500 uppercase tracking-tight">
            <div className="font-medium opacity-70">
              Hệ thống quản lý lịch công tác | {format(new Date(), 'HH:mm dd/MM/yyyy')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
