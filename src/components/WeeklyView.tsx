import React, { useRef, useCallback } from 'react';
import { Schedule } from '../types';
import { 
  format, startOfWeek, addDays, parseISO, isSameDay, startOfToday,
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
  const printRef = useRef<HTMLDivElement>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getSchedulesForDay = (day: Date) =>
    schedules
      .filter(s => isSameDay(parseISO(s.date), day) && s.status === 'approved')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
  const resetToCurrent = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handlePrint = useCallback(() => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Lịch Công Tác Tuần</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
            @page { size: A4 landscape; margin: 10mm 8mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Be Vietnam Pro', sans-serif; background: white; }
            .header { text-align: center; margin-bottom: 12px; }
            .header .org-top { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #333; }
            .header .org-main { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #da251d; margin-top: 2px; }
            .header h1 { font-size: 18px; font-weight: 700; text-transform: uppercase; margin: 8px 0 4px; }
            .header .dates { font-size: 11px; color: #555; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; font-size: 10pt; page-break-inside: auto; }
            thead { display: table-header-group; }
            th { border: 2px solid black; padding: 5px 6px; text-align: center; font-weight: 700; text-transform: uppercase; background: #f5f5f5; }
            td { border: 2px solid black; padding: 4px 6px; vertical-align: top; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            .day-cell { text-align: center; vertical-align: middle; font-weight: 700; line-height: 1.4; }
            .day-cell .day-name { text-transform: capitalize; }
            .empty-row td { text-align: center; color: #aaa; font-style: italic; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; padding: 10px; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 800);
  }, []);

  const handleShareZalo = async () => {
    let content = `LỊCH CÔNG TÁC TUẦN ${format(currentWeekStart, 'ww')} (${format(weekDays[0], 'dd/MM')} - ${format(weekDays[6], 'dd/MM')})\n${orgName || 'Đảng ủy xã Tân Dương'}\n\n`;
    weekDays.forEach(day => {
      const ds = getSchedulesForDay(day);
      if (ds.length > 0) {
        content += `${format(day, 'EEEE, dd/MM/yyyy', { locale: vi }).toUpperCase()}\n`;
        ds.forEach((s: any) => {
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

  const tableRows = weekDays.map((day) => {
    const daySchedules = getSchedulesForDay(day);
    const isTodayActive = isSameDay(day, startOfToday());
    const dayName = format(day, 'EEEE', { locale: vi });
    const dateStr = format(day, 'd.M.yyyy');

    if (daySchedules.length === 0) {
      return (
        <tr key={day.toISOString()} className="empty-row">
          <td className="day-cell border-2 border-black p-2 text-center align-middle font-bold">
            <div className="day-name capitalize">{dayName}</div>
            <div>{dateStr}</div>
          </td>
          <td colSpan={4} className="border-2 border-black p-3 text-center text-gray-400 italic text-xs font-bold uppercase tracking-widest">
            --- Nghỉ ---
          </td>
        </tr>
      );
    }

    return daySchedules.map((s: any, index: number) => (
      <tr key={s.id} className={isTodayActive ? 'bg-yellow-50' : ''}>
        {index === 0 && (
          <td rowSpan={daySchedules.length} className="day-cell border-2 border-black p-2 text-center align-middle font-bold">
            <div className="day-name capitalize">{dayName}</div>
            <div>{dateStr}</div>
          </td>
        )}
        <td className="border-2 border-black p-2 align-top">- <span className="font-medium">{s.title}</span></td>
        <td className="border-2 border-black p-2 align-top">- {s.startTime.replace(':', 'h')}, {s.location}</td>
        <td className="border-2 border-black p-2 align-top">
          {s.host.split(/[,;\n]/).filter((h: string) => h.trim()).map((part: string, i: number) => (
            <div key={i}>- {part.trim()}</div>
          ))}
        </td>
        <td className="border-2 border-black p-2 align-top text-[11px]">
          {s.participants && `- ${s.participants}`}
        </td>
      </tr>
    ));
  });

  const tableContent = (
    <>
      <div className="header">
        <div className="org-top">Đảng Bộ Tỉnh Đồng Tháp</div>
        <div className="org-main">{orgName || 'Đảng ủy xã Tân Dương'}</div>
        <h1>Lịch công tác tuần</h1>
        <div className="dates">
          (Từ ngày {format(weekDays[0], 'dd/MM/yyyy')} đến ngày {format(weekDays[6], 'dd/MM/yyyy')})
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style={{width:'90px'}}>Thứ, ngày, tháng</th>
            <th>Nội dung</th>
            <th style={{width:'190px'}}>Thời gian, địa điểm</th>
            <th style={{width:'190px'}}>Thường trực Đảng ủy</th>
            <th style={{width:'140px'}}>Thành phần</th>
          </tr>
        </thead>
        <tbody>{tableRows}</tbody>
      </table>
    </>
  );

  return (
    <div className="space-y-4">
      {/* Thanh điều hướng */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
          <button onClick={handleShareZalo}
            className={`flex items-center gap-2 px-4 py-2 border rounded text-xs font-bold shadow-sm transition-all cursor-pointer ${
              copied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}>
            <Share2 className="w-4 h-4" /> {copied ? 'Đã sao chép!' : 'Gửi Zalo'}
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs font-bold shadow-sm hover:bg-gray-200 cursor-pointer">
            <Printer className="w-4 h-4" /> Xuất PDF
          </button>
        </div>
      </div>

      {/* Hiển thị trên web */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="text-center mb-4">
          <p className="text-[11px] font-bold uppercase text-gray-700">Đảng Bộ Tỉnh Đồng Tháp</p>
          <p className="text-[13px] font-bold uppercase text-[#da251d] mt-0.5">{orgName || 'Đảng ủy xã Tân Dương'}</p>
          <h1 className="text-xl font-bold uppercase text-gray-800 mt-2">Lịch công tác tuần</h1>
          <p className="text-gray-500 mt-1 text-xs uppercase">
            (Từ ngày {format(weekDays[0], 'dd/MM/yyyy')} đến ngày {format(weekDays[6], 'dd/MM/yyyy')})
          </p>
        </div>
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
          <tbody>{tableRows}</tbody>
        </table>
      </div>

      {/* Vùng in ẩn */}
      <div ref={printRef} style={{display:'none'}}>
        {tableContent}
      </div>
    </div>
  );
}
