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

interface WeeklyViewProps {
  schedules: Schedule[];
  orgName?: string;
}

export default function WeeklyView({ schedules, orgName }: WeeklyViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = React.useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [copied, setCopied] = React.useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getSchedulesForDay = (day: Date) =>
    schedules
      .filter(s => isSameDay(parseISO(s.date), day) && s.status === 'approved')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
  const resetToCurrent = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handlePrint = () => window.print();

  const handleShareZalo = async () => {
    let content = `LỊCH CÔNG TÁC TUẦN ${format(currentWeekStart, 'ww')} (${format(weekDays[0], 'dd/MM')} - ${format(weekDays[6], 'dd/MM')})\n${orgName || 'Đảng ủy xã Tân Dương'}\n\n`;
    weekDays.forEach(day => {
      const ds = getSchedulesForDay(day);
      if (ds.length > 0) {
        content += `${format(day, 'EEEE, dd/MM/yyyy', { locale: vi }).toUpperCase()}\n`;
        ds.forEach(s => {
          content += `- ${s.startTime}: ${s.title}\n  + Địa điểm: ${s.location}\n  + Chủ trì: ${s.host}\n`;
          if (s.participants) content += `  + Thành phần: ${s.participants}\n`;
          content += '\n';
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

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm 8mm;
          }

          /* Ẩn toàn bộ trang */
          html, body {
            height: auto !important;
            overflow: visible !important;
          }

          body > * { display: none !important; }

          /* Chỉ hiện #root và đường dẫn đến print-area */
          body > #root { display: block !important; }
          body > #root > * { display: none !important; }
          body > #root > div { display: block !important; }
          body > #root > div > * { display: none !important; }
          body > #root > div > div { display: block !important; }
          body > #root > div > div > * { display: none !important; }

          /* Hiện vùng in */
          #weekly-print-area { display: block !important; }
          #weekly-print-area * { display: revert !important; }

          /* Bảng xuống trang đúng cách */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
            font-size: 10pt !important;
          }
          thead { display: table-header-group !important; }
          tfoot { display: table-footer-group !important; }
          tr { page-break-inside: avoid !important; page-break-after: auto !important; }
          td, th { page-break-inside: avoid !important; }
        }
      `}</style>

      <div className="space-y-4">
        {/* Thanh điều hướng - ẩn khi in */}
        <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-800 uppercase tracking-tight">Lịch công tác tuần</span>
            <span className="bg-yellow-100 text-yellow-800 text-[11px] font-bold px-2 py-1 rounded">
              TUẦN {format(currentWeekStart, 'ww')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-gray-200 rounded p-1 shadow-sm">
              <button onClick={prevWeek} className="p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button onClick={resetToCurrent} className="px-3 py-1 text-xs font-bold text-gray-700 hover:text-[#da251d] cursor-pointer uppercase">
                Hiện tại
              </button>
              <button onClick={nextWeek} className="p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <button
              onClick={handleShareZalo}
              className={`flex items-center gap-2 px-4 py-2 border rounded text-xs font-bold shadow-sm transition-all cursor-pointer ${
                copied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Share2 className="w-4 h-4" /> {copied ? 'Đã sao chép!' : 'Gửi Zalo'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs font-bold shadow-sm hover:bg-gray-200 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Xuất PDF
            </button>
          </div>
        </div>

        {/* Vùng in */}
        <div id="weekly-print-area" className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 print:p-0 print:border-none print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="text-center mb-4">
            <p className="text-[11px] font-bold uppercase text-gray-700">Đảng Bộ Tỉnh Đồng Tháp</p>
            <p className="text-[13px] font-bold uppercase text-[#da251d] mt-0.5">
              {orgName || 'Đảng ủy xã Tân Dương'}
            </p>
            <h1 className="text-xl font-bold uppercase text-gray-800 mt-2">Lịch công tác tuần</h1>
            <p className="text-gray-500 mt-1 text-xs uppercase">
              (Từ ngày {format(weekDays[0], 'dd/MM/yyyy')} đến ngày {format(weekDays[6], 'dd/MM/yyyy')})
            </p>
          </div>

          {/* Bảng */}
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
                      <td colSpan={4} className="border-2 border-black p-3 text-center text-gray-400 italic text-xs font-bold uppercase tracking-widest">
                        --- Nghỉ ---
                      </td>
                    </tr>
                  );
                }

                return daySchedules.map((s, index) => (
                  <tr key={s.id} className={isTodayActive ? 'bg-yellow-50' : ''}>
                    {index === 0 && (
                      <td
                        rowSpan={daySchedules.length}
                        className="border-2 border-black p-2 text-center align-middle font-bold leading-tight"
                      >
                        <div className="capitalize">{dayName}</div>
                        <div>{dateStr}</div>
                      </td>
                    )}
                    <td className="border-2 border-black p-2 align-top">
                      <div className="flex gap-1">
                        <span className="shrink-0">-</span>
                        <span className="font-medium leading-tight">{s.title}</span>
                      </div>
                    </td>
                    <td className="border-2 border-black p-2 align-top">
                      <div className="flex gap-1">
                        <span className="shrink-0">-</span>
                        <span className="leading-tight">{s.startTime.replace(':', 'h')}, {s.location}</span>
                      </div>
                    </td>
                    <td className="border-2 border-black p-2 align-top">
                      <div className="space-y-0.5">
                        {s.host.split(/[,;\n]/).filter(h => h.trim()).map((part, i) => (
                          <div key={i} className="flex gap-1 leading-tight">
                            <span className="shrink-0">-</span>
                            <span>{part.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="border-2 border-black p-2 align-top text-[11px]">
                      {s.participants && (
                        <div className="flex gap-1 leading-tight">
                          <span className="shrink-0">-</span>
                          <span>{s.participants}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>

          <div className="print:hidden mt-3 border-t border-gray-100 pt-2 flex justify-end text-[10px] text-gray-400 uppercase">
            Hệ thống quản lý lịch công tác | {format(new Date(), 'HH:mm dd/MM/yyyy')}
          </div>
        </div>
      </div>
    </>
  );
}
