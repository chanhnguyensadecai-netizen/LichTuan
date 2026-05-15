import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Schedule } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  FileText, Filter, Calendar, BarChart3, PieChart as PieIcon, 
  TrendingUp, Table as TableIcon, Printer
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths, eachMonthOfInterval } from 'date-fns';
import { TYPE_CONFIG } from '../constants';
import * as XLSX from 'xlsx';

interface ReportsProps {
  schedules: Schedule[];
}

const COLORS = ['#da251d', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function Reports({ schedules }: ReportsProps) {
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(subMonths(new Date(), 3)),
    end: endOfMonth(new Date())
  });
  const [viewType, setViewType] = useState<'charts' | 'table'>('charts');
  const printRef = useRef<HTMLDivElement>(null);

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const date = parseISO(s.date);
      return isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
    });
  }, [schedules, dateRange]);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSchedules.forEach(s => { counts[s.type] = (counts[s.type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({
      name: TYPE_CONFIG[type as keyof typeof TYPE_CONFIG]?.label || type,
      value: count
    }));
  }, [filteredSchedules]);

  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({ start: dateRange.start, end: dateRange.end });
    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const count = filteredSchedules.filter(s => format(parseISO(s.date), 'yyyy-MM') === monthStr).length;
      return { name: format(month, 'MM/yyyy'), meetings: count };
    });
  }, [filteredSchedules, dateRange]);

  const hostData = useMemo(() => {
    const hosts: Record<string, number> = {};
    filteredSchedules.forEach(s => {
      if (s.host) hosts[s.host] = (hosts[s.host] || 0) + 1;
    });
    return Object.entries(hosts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredSchedules]);

  const handlePrint = useCallback(() => {
    // Inject print styles and trigger print directly
    const existingStyle = document.getElementById('report-print-style');
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = 'report-print-style';
    style.innerHTML = `
      @media print {
        @page { size: A4 portrait; margin: 15mm 12mm; }
        html body { margin: 0; padding: 0; }
        html body > * { display: none !important; visibility: hidden !important; }
        html body #root { display: block !important; visibility: visible !important; }
        html body #root > * { display: none !important; visibility: hidden !important; }
        html body #root #report-print-area {
          display: block !important;
          visibility: visible !important;
          position: static !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        html body #root #report-print-area * {
          display: revert !important;
          visibility: visible !important;
        }
        table { width: 100% !important; border-collapse: collapse !important; font-size: 10px !important; page-break-inside: auto !important; }
        thead { display: table-header-group !important; }
        tr { page-break-inside: avoid !important; }
      }
    `;
    document.head.appendChild(style);

    const printArea = document.getElementById('report-print-area');
    if (printArea) printArea.style.display = 'block';

    window.print();

    setTimeout(() => {
      if (printArea) printArea.style.display = 'none';
      style.remove();
    }, 1000);
    return; // Skip old implementation
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head>
        <meta charset="UTF-8">
        <title>Báo Cáo Thống Kê Công Tác</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');
          @page { size: A4 portrait; margin: 15mm 12mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Be Vietnam Pro', sans-serif; background: white; color: #1e293b; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 18px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; }
          .header p { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat-box { border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; text-align: center; }
          .stat-box .label { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 4px; }
          .stat-box .value { font-size: 22px; font-weight: 800; color: #1e293b; }
          .stat-box .value.sm { font-size: 14px; }
          h3 { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #1e293b; padding-bottom: 6px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px; }
          th { border: 1px solid #cbd5e1; padding: 6px 8px; background: #f8fafc; font-weight: 800; text-transform: uppercase; font-size: 9px; color: #64748b; text-align: left; }
          td { border: 1px solid #e2e8f0; padding: 5px 8px; vertical-align: top; }
          tr:nth-child(even) td { background: #f8fafc; }
          .signature { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
          .sig-box { text-align: center; }
          .sig-box .title { font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 50px; }
          .sig-box .name { font-size: 11px; font-weight: 700; text-transform: uppercase; }
          .stt { text-align: center; width: 30px; }
        </style>
      </head><body>${content.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 800);
  }, []);

  const exportToExcel = () => {
    const data = filteredSchedules.map(s => ({
      'Ngày': s.date, 'Thời gian': s.startTime, 'Nội dung': s.title,
      'Loại': TYPE_CONFIG[s.type]?.label || s.type,
      'Chủ trì': s.host, 'Địa điểm': s.location, 'Thành phần': s.participants
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BaoCaoCongTac");
    XLSX.writeFile(wb, `Bao_cao_cong_tac_${format(new Date(), 'ddMMyyyy')}.xlsx`);
  };

  // Tính barSize động theo số tháng
  const barSize = Math.max(10, Math.min(40, Math.floor(200 / (monthlyData.length || 1))));

  return (
    <div className="space-y-6">
      {/* Thanh điều hướng */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#da251d]" /> Báo cáo & Thống kê
          </h2>
          <p className="text-slate-500 text-sm mt-1">Phân tích dữ liệu công tác định kỳ</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold uppercase hover:bg-emerald-100 cursor-pointer">
            <TableIcon className="w-4 h-4" /> Xuất Excel
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase hover:bg-slate-900 cursor-pointer shadow-lg">
            <Printer className="w-4 h-4" /> In Báo cáo PDF
          </button>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-500">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">Lọc theo thời gian:</span>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={format(dateRange.start, 'yyyy-MM-dd')}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: parseISO(e.target.value) }))}
            className="text-xs border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#da251d]/20 font-medium" />
          <span className="text-slate-300">→</span>
          <input type="date" value={format(dateRange.end, 'yyyy-MM-dd')}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: parseISO(e.target.value) }))}
            className="text-xs border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#da251d]/20 font-medium" />
        </div>
        <div className="ml-auto flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setViewType('charts')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === 'charts' ? 'bg-white text-[#da251d] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Đồ thị</button>
          <button onClick={() => setViewType('table')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === 'table' ? 'bg-white text-[#da251d] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Bảng kê</button>
        </div>
      </div>

      {viewType === 'charts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Thống kê tóm tắt */}
          <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Tổng cộng công tác', value: filteredSchedules.length, unit: 'nhiệm vụ', color: 'border-l-[#da251d]', textColor: 'text-slate-800' },
              { label: 'Tháng nhiều nhất', value: Math.max(...monthlyData.map(d => d.meetings), 0), unit: 'cuộc họp', color: 'border-l-blue-500', textColor: 'text-blue-600' },
              { label: 'Đơn vị tích cực', value: hostData[0]?.name || 'N/A', unit: '', color: 'border-l-emerald-500', textColor: 'text-emerald-600', small: true },
              { label: 'Phân loại hàng đầu', value: [...typeData].sort((a, b) => b.value - a.value)[0]?.name || 'N/A', unit: '', color: 'border-l-amber-500', textColor: 'text-amber-600', small: true },
            ].map((item, i) => (
              <div key={i} className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 ${item.color}`}>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">{item.label}</p>
                <div className="flex items-end gap-2">
                  <span className={`font-black ${item.small ? 'text-lg' : 'text-3xl'} ${item.textColor} leading-none truncate`}>{item.value}</span>
                  {item.unit && <span className="text-xs text-slate-400 font-medium pb-1">{item.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Biểu đồ xu hướng tháng */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[380px]">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Xu hướng công tác theo tháng</h3>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="meetings" name="Số công tác" fill="#da251d" radius={[4, 4, 0, 0]} barSize={barSize} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Biểu đồ tròn */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[380px]">
            <div className="flex items-center gap-2 mb-4">
              <PieIcon className="w-5 h-5 text-[#da251d]" />
              <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Cấu trúc loại hình công tác</h3>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={5} dataKey="value">
                    {typeData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 600, paddingTop: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top lãnh đạo */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Top Lãnh đạo/Đơn vị công tác nhiều nhất</h3>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hostData} layout="vertical" margin={{ top: 0, right: 30, left: 80, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }} width={75} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" name="Số công tác" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider w-24">Ngày</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Nội dung</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Loại hình</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Chủ trì</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Địa điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedules.length > 0 ? filteredSchedules.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-xs font-bold text-slate-700">{format(parseISO(s.date), 'dd/MM/yyyy')}</div>
                      <div className="text-[10px] text-slate-400">{s.startTime}</div>
                    </td>
                    <td className="px-4 py-3"><div className="text-xs font-bold text-slate-800">{s.title}</div></td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${TYPE_CONFIG[s.type]?.color || 'bg-slate-100 text-slate-600'}`}>
                        {TYPE_CONFIG[s.type]?.label || s.type}
                      </span>
                    </td>
                    <td className="px-4 py-3"><div className="text-xs font-bold text-slate-700">{s.host}</div></td>
                    <td className="px-4 py-3"><div className="text-xs text-slate-500">{s.location}</div></td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">Không có dữ liệu trong khoảng thời gian này.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vùng in ẩn */}
      <div id="report-print-area" ref={printRef} style={{ display: 'none' }}>
        <div className="header">
          <h1>Báo Cáo Thống Kê Công Tác</h1>
          <p>Thời gian: {format(dateRange.start, 'dd/MM/yyyy')} - {format(dateRange.end, 'dd/MM/yyyy')}</p>
        </div>
        <div className="stats">
          <div className="stat-box">
            <div className="label">Tổng số công tác</div>
            <div className="value">{filteredSchedules.length}</div>
          </div>
          <div className="stat-box">
            <div className="label">Phân loại phổ biến</div>
            <div className="value sm">{[...typeData].sort((a, b) => b.value - a.value)[0]?.name || 'N/A'}</div>
          </div>
          <div className="stat-box">
            <div className="label">Chủ trì nhiều nhất</div>
            <div className="value sm">{hostData[0]?.name || 'N/A'}</div>
          </div>
        </div>
        <h3>Chi tiết biểu kê công tác</h3>
        <table>
          <thead>
            <tr>
              <th className="stt">STT</th>
              <th style={{width:'90px'}}>Thời gian</th>
              <th>Nội dung</th>
              <th>Chủ trì</th>
              <th>Địa điểm</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchedules.map((s, index) => (
              <tr key={s.id}>
                <td className="stt">{index + 1}</td>
                <td>{format(parseISO(s.date), 'dd/MM/yyyy')}<br />{s.startTime}</td>
                <td style={{fontWeight: 700}}>{s.title}</td>
                <td>{s.host}</td>
                <td>{s.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="signature">
          <div className="sig-box">
            <div className="title">Người lập biểu</div>
            <div className="name">{format(new Date(), "'Ngày' dd 'tháng' MM 'năm' yyyy")}</div>
          </div>
          <div className="sig-box">
            <div className="title">Thường trực Đảng ủy</div>
            <div className="name">(Ký tên & đóng dấu)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
