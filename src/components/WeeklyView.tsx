import React from 'react';
import { Schedule } from '../types';
import { 
  format, 
  startOfWeek, 
  addDays, 
  parseISO, 
  isSameDay, 
  startOfToday,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { Printer, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { TYPE_CONFIG } from '../constants';

interface WeeklyViewProps {
  schedules: Schedule[];
  orgName?: string;
}

export default function WeeklyView({ schedules, orgName }: WeeklyViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = React.useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [copied, setCopied] = React.useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getSchedulesForDay = (day: Date) => {
    return schedules
      .filter(s => isSameDay(parseISO(s.date), day) && s.status === 'approved')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
  const resetToCurrent = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handlePrint = () => {
    window.print();
  };

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
          if (s.participants) content += `  + Thành phần: ${s.participants}\n`;
          content += `\n`;
        });
      }
    });
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      window.open('https://chat.zalo.me', '_blank');
    } catch {
      alert('Không thể sao chép. Vui lòng kiểm tra quyền truy cập bộ nhớ tạm.');
    }
  };

  const tableContent = (
    <table className="w-full border-2 border-black border-collapse text-[12px] text-black">
      <thead>
        <tr>
          <th className="border-2 border-black p-2 w-[90px] text-center uppercase font-bold">Thứ, ngày, tháng</th>
          <th className="border-2 border-black p-2 text-center uppercase font-bold">Nội dung</th>
          <th className="border-2 border-black p-2 w-[190px] text-center uppercase font-bold">Thời gian, địa điểm</th>
          <th className="border-2 border-black p-2 w-[190px] text-center uppercase font-bold">Thường trực Đảng ủy</th>
          <th className="border-2 border-black p-2 w-[140px] text-center uppercase font-bold">Thành phần</th>
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
              <tr key={day.toISOString()}>
                <td className="border-2 border-black p-2 text-center align-middle font-bold leading-tight">
                  <div className="capitalize">{dayName}</div>
                  <div>{dateStr}</div>
                </td>
                <td colSpan={4} className="border-2 border-black p-3 text-center text-gray-400 italic uppercase tracking-widest text-xs font-bold">
                  --- Nghỉ ---
                </td>
              </tr>
            );
          }

          return daySchedules.map((s, index) => (
            <tr key={s.id} className={isTodayActive ? 'bg-yellow-50' : ''} style={{ pageBreakInside: 'avoid' }}>
              {index === 0 && (
                <td rowSpan={daySchedules.length} className="border-2 border-black p-2 text-center align-middle font-bold leading-tight">
                  <div className="capitalize">{dayName}</div>
                  <div>{dateStr}</div>
                </td>
              )}
              <td className="border-2 border-black p-2 align-top">
                <div className="flex gap-1"><span className="shrink-0">-</span><span className="font-medium leading-tight">{s.title}</span></div>
              </td>
              <td className="border-2 border-black p-2 align-top">
                <div className="flex gap-1"><span className="shrink-0">-</span><span className="leading-tight">{s.startTime.replace(':', 'h')}, {s.location}</span></div>
              </td>
              <td className="border-2 border-black p-2 align-top">
                <div className="space-y-0.5">
                  {s.host.split(/[,;\n]/).filter(h => h.trim()).map((part, i) => (
                    <div key={i} className="flex gap-1 leading-tight"><span className="shrink-0">-</span><span>{part.trim()}</span></div>
                  ))}
                </div>
              </td>
              <td className="border-2 border-black p-2 align-top text-[11px]">
                {s.participants && <div className="flex gap-1 leading-tight"><span className="shrink-0">-</span><span>{s.participants}</span></div>}
              </td>
            </tr>
          ));
        })}
      </tbody>
    </table>
  );

  return (
    <>
      {/* CSS in ấn */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm 8mm; }
          body { margin: 0; }
          body > div > div > div > div:not(#root) { display: none !important; }
          #print-area {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
          }
          #print-area .no-print { display: none !important; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          table { page-break-inside: auto; font-size: 10px !important; }
        }
      `}</style>

      <div className="space-y-4">
        {/* Thanh điều hướng - chỉ hiện trên web, ẩn khi in */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-800 uppercase tracking-tight">Lịch công tác tuần</span>
            <span className="bg-yellow-100 text-yellow-800 text-[11px] font-bold px-2 py-1 rounded">
              TUẦN {format(currentWeekStart, 'ww')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-gray-200 rounded p-1 shadow-sm">
              <button onClick={prevWeek} className="p-1.5 hover:bg-gray-50 rounded cursor-pointer"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
              <button onClick={resetToCurrent} className="px-3 py-1 text-xs font-bold text-gray-700 hover:text-[#da251d] cursor-pointer uppercase">Hiện tại</button>
              <button onClick={nextWeek} className="p-1.5 hover:bg-gray-50 rounded cursor-pointer"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
            </div>
            <button onClick={handleShareZalo} className={`flex items-center gap-2 px-4 py-2 border rounded text-xs font-bold shadow-sm transition-all cursor-pointer ${copied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}>
              <Share2 className="w-4 h-4" /> {copied ? 'Đã sao chép!' : 'Gửi Zalo'}
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs font-bold shadow-sm hover:bg-gray-200 cursor-pointer">
              <Printer className="w-4 h-4" /> Xuất PDF
            </button>
          </div>
        </div>

        {/* Vùng nội dung - hiện cả web lẫn in */}
        <div id="print-area" className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {/* Header */}
          <div className="text-center mb-4">
            <p className="text-[11px] font-bold uppercase text-gray-700">Đảng Bộ Tỉnh Đồng Tháp</p>
            <p className="text-[13px] font-bold uppercase text-[#da251d] mt-0.5">{orgName || 'Đảng ủy xã Tân Dương'}</p>
            <h1 className="text-xl font-bold uppercase text-gray-800 mt-2">Lịch công tác tuần</h1>
            <p className="text-gray-500 mt-1 text-xs uppercase">
              (Từ ngày {format(weekDays[0], 'dd/MM/yyyy')} đến ngày {format(weekDays[6], 'dd/MM/yyyy')})
            </p>
          </div>

          {/* Bảng */}
          {tableContent}

          {/* Footer */}
          <div className="no-print mt-3 border-t border-gray-100 pt-2 flex justify-end text-[10px] text-gray-400 uppercase">
            Hệ thống quản lý lịch công tác | {format(new Date(), 'HH:mm dd/MM/yyyy')}
          </div>
        </div>
      </div>
    </>
  );
}
