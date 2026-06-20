import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Schedule } from '../types';
import { 
  format, startOfWeek, addDays, parseISO, isSameDay, startOfToday,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { Printer, ChevronLeft, ChevronRight, Share2, Paperclip, ExternalLink } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Attachment } from '../types';

interface WeeklyViewProps {
  schedules: Schedule[];
  orgName?: string;
}

export default function WeeklyView({ schedules, orgName }: WeeklyViewProps) {
  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const [currentWeekStart, setCurrentWeekStart] = React.useState(thisWeekStart);
  
  const weekOffset = Math.round((currentWeekStart.getTime() - thisWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const isCurrentWeek = weekOffset === 0;
  const isPrevWeek = weekOffset === -1;
  const isNextWeek = weekOffset === 1;
  const [copied, setCopied] = React.useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Load tất cả attachments 1 lần
  useEffect(() => {
    const q = query(collection(db, 'attachments'));
    const unsub = onSnapshot(q, (snap) => {
      setAttachments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Attachment)));
    });
    return () => unsub();
  }, []);

  const getAttachmentsForSchedule = (scheduleId: string) =>
    attachments.filter(a => a.scheduleId === scheduleId);
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
          <td colSpan={5} className="border-2 border-black p-3 text-center text-gray-400 italic text-xs font-bold uppercase tracking-widest">
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
        <td className="border-2 border-black p-2 align-top">
                  <div>- <span className="font-medium" dangerouslySetInnerHTML={{ __html: s.title }} /></div>
                  {getAttachmentsForSchedule(s.id).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {getAttachmentsForSchedule(s.id).map(att => (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100 transition-colors"
                          title={att.name}
                        >
                          <Paperclip className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[120px]">{att.name}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </td>
        <td className="border-2 border-black p-2 align-top">- {s.startTime.replace(':', 'h')}, {s.location}</td>
        <td className="border-2 border-black p-2 align-top">
          {s.host.split(/[,;\n]/).filter((h: string) => h.trim()).map((part: string, i: number) => (
            <div key={i}>- {part.trim()}</div>
          ))}
        </td>
        <td className="border-2 border-black p-2 align-top text-[11px]">
          {s.participants && s.participants.split(/[;\n]/).filter((p: string) => p.trim()).map((part: string, i: number) => (
            <div key={i}>- {part.trim()}</div>
          ))}
        </td>
        <td className="border-2 border-black p-2 align-top text-[11px]">
          {s.notes && <span dangerouslySetInnerHTML={{ __html: s.notes }} />}
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
            <th style={{width:'130px'}}>Ghi chú</th>
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
          {/* Nút điều hướng tuần */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button onClick={prevWeek} className="px-3 py-2 hover:bg-[#da251d] hover:text-white text-gray-600 transition-all cursor-pointer group">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={resetToCurrent} className={`px-4 py-2 text-xs font-bold cursor-pointer uppercase tracking-wide transition-all border-x border-gray-200 ${isCurrentWeek ? 'bg-[#da251d] text-white' : 'text-gray-700 hover:bg-[#da251d] hover:text-white'}`}>
              {isCurrentWeek ? 'Hiện tại' : weekOffset < 0 ? `Tuần trước${weekOffset < -1 ? ' (' + weekOffset + ')' : ''}` : `Tuần sau${weekOffset > 1 ? ' (+' + weekOffset + ')' : ''}`}
            </button>
            <button onClick={nextWeek} className="px-3 py-2 hover:bg-[#da251d] hover:text-white text-gray-600 transition-all cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Nút Gửi Zalo */}
          <button onClick={handleShareZalo}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
              copied
                ? 'bg-green-500 text-white shadow-green-200'
                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-200'
            }`}>
            <Share2 className="w-4 h-4" /> {copied ? '✓ Đã sao chép!' : 'Gửi Zalo'}
          </button>

          {/* Nút Xuất PDF */}
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 transition-all cursor-pointer shadow-slate-200">
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
              <th className="border-2 border-black p-2 w-[130px] text-center uppercase font-bold">Ghi chú</th>
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
