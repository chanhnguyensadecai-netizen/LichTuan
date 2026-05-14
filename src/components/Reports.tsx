import React, { useState, useMemo, useRef } from 'react';
import { Schedule } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp,
  Table as TableIcon,
  Printer
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
    start: startOfMonth(subMonths(new Date(), 3)), // Last 3 months
    end: endOfMonth(new Date())
  });
  const [viewType, setViewType] = useState<'charts' | 'table'>('charts');

  const handlePrint = () => {
    window.print();
  };

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const date = parseISO(s.date);
      return isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
    });
  }, [schedules, dateRange]);

  // Data for Type Distribution (Pie Chart)
  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSchedules.forEach(s => {
      counts[s.type] = (counts[s.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      name: TYPE_CONFIG[type as keyof typeof TYPE_CONFIG]?.label || type,
      value: count
    }));
  }, [filteredSchedules]);

  // Data for Monthly Trends (Bar/Line Chart)
  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({ start: dateRange.start, end: dateRange.end });
    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const count = filteredSchedules.filter(s => format(parseISO(s.date), 'yyyy-MM') === monthStr).length;
      return {
        name: format(month, 'MM/yyyy'),
        meetings: count
      };
    });
  }, [filteredSchedules, dateRange]);

  // Data for Host activity
  const hostData = useMemo(() => {
    const hosts: Record<string, number> = {};
    filteredSchedules.forEach(s => {
      if (s.host) {
        hosts[s.host] = (hosts[s.host] || 0) + 1;
      }
    });
    return Object.entries(hosts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 hosts
  }, [filteredSchedules]);

  const exportToExcel = () => {
    const data = filteredSchedules.map(s => ({
      'Ngày': s.date,
      'Thời gian': s.startTime,
      'Nội dung': s.title,
      'Loại': TYPE_CONFIG[s.type]?.label || s.type,
      'Chủ trì': s.host,
      'Địa điểm': s.location,
      'Thành phần': s.participants
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BaoCaoCongTac");
    XLSX.writeFile(wb, `Bao_cao_cong_tac_${format(new Date(), 'ddMMyyyy')}.xlsx`);
  };

  return (
    <div className="space-y-6 print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#da251d]" />
            Báo cáo & Thống kê
          </h2>
          <p className="text-slate-500 text-sm mt-1">Phân tích dữ liệu công tác định kỳ</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold uppercase transition-all hover:bg-emerald-100 cursor-pointer"
          >
            <TableIcon className="w-4 h-4" /> Xuất Excel
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase transition-all hover:bg-slate-900 cursor-pointer shadow-lg"
          >
            <Printer className="w-4 h-4" /> In Báo cáo PDF
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center print:hidden">
        <div className="flex items-center gap-2 text-slate-500">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">Lọc theo thời gian:</span>
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={format(dateRange.start, 'yyyy-MM-dd')}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: parseISO(e.target.value) }))}
            className="text-xs border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#da251d]/20 transition-all font-medium"
          />
          <span className="text-slate-300">→</span>
          <input 
            type="date" 
            value={format(dateRange.end, 'yyyy-MM-dd')}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: parseISO(e.target.value) }))}
            className="text-xs border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#da251d]/20 transition-all font-medium"
          />
        </div>

        <div className="ml-auto flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setViewType('charts')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === 'charts' ? 'bg-white text-[#da251d] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Đồ thị
          </button>
          <button 
            onClick={() => setViewType('table')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === 'table' ? 'bg-white text-[#da251d] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Bảng kê
          </button>
        </div>
      </div>

      {viewType === 'charts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summary Stats */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-[#da251d]">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Tổng cộng công tác</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-800 leading-none">{filteredSchedules.length}</span>
                <span className="text-xs text-slate-400 font-medium pb-1">nhiệm vụ</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-blue-500">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Tháng nhiều nhất</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-blue-600 leading-none">
                  {Math.max(...monthlyData.map(d => d.meetings), 0)}
                </span>
                <span className="text-xs text-slate-400 font-medium pb-1">cuộc họp</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-emerald-500">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Đơn vị tích cực</p>
              <div className="flex items-end gap-2">
                <span className="text-lg font-black text-emerald-600 truncate leading-none">
                  {hostData[0]?.name || 'N/A'}
                </span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-amber-500">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Phân loại hàng đầu</p>
              <div className="flex items-end gap-2">
                <span className="text-lg font-black text-amber-600 truncate leading-none">
                  {typeData.sort((a, b) => b.value - a.value)[0]?.name || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
             <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Xu hướng công tác theo tháng</h3>
             </div>
             <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar dataKey="meetings" fill="#da251d" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Type Distribution */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
             <div className="flex items-center gap-2 mb-6">
                <PieIcon className="w-5 h-5 text-[#da251d]" />
                <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Cấu trúc loại hình công tác</h3>
             </div>
             <div className="flex-1 min-h-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '10px', fontWeight: 600, paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Host Ranking */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
             <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Top Lãnh đạo/Đơn vị công tác nhiều nhất</h3>
             </div>
             <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hostData} layout="vertical" margin={{ top: 0, right: 30, left: 60, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
                      width={100}
                    />
                    <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                       cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      ) : (
        /* Table View */
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
                {filteredSchedules.length > 0 ? (
                  filteredSchedules.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-slate-700">{format(parseISO(s.date), 'dd/MM/yyyy')}</div>
                        <div className="text-[10px] text-slate-400">{s.startTime}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-slate-800 leading-snug">{s.title}</div>
                      </td>
                      <td className="px-4 py-3">
                         <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight ${TYPE_CONFIG[s.type]?.color || 'bg-slate-100 text-slate-600'}`}>
                           {TYPE_CONFIG[s.type]?.label || s.type}
                         </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-slate-700">{s.host}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-500 font-medium">{s.location}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">
                      Không có dữ liệu trong khoảng thời gian này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable section hidden from screen */}
      <div className="hidden print:block print:m-0 print:p-8">
        <div className="text-center mb-12">
           <h1 className="text-2xl font-black uppercase mb-1">BÁO CÁO THỐNG KÊ CÔNG TÁC</h1>
           <p className="text-xs uppercase tracking-widest font-bold text-slate-500">Thời gian: {format(dateRange.start, 'dd/MM/yyyy')} - {format(dateRange.end, 'dd/MM/yyyy')}</p>
        </div>
        
        <div className="grid grid-cols-3 gap-6 mb-12">
           <div className="border border-slate-200 p-4 rounded-xl text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 leading-none">Tổng số công tác</p>
              <p className="text-2xl font-black">{filteredSchedules.length}</p>
           </div>
           <div className="border border-slate-200 p-4 rounded-xl text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 leading-none">Phân loại phổ biến</p>
              <p className="text-lg font-black">{typeData.sort((a, b) => b.value - a.value)[0]?.name || 'N/A'}</p>
           </div>
           <div className="border border-slate-200 p-4 rounded-xl text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 leading-none">Chủ trì nhiều nhất</p>
              <p className="text-lg font-black">{hostData[0]?.name || 'N/A'}</p>
           </div>
        </div>

        <h3 className="text-sm font-black uppercase mb-4 border-b-2 border-slate-800 pb-1">Chi tiết biểu kê công tác</h3>
        <table className="w-full border-collapse border border-slate-300 mb-12">
           <thead>
             <tr className="bg-slate-50">
               <th className="border border-slate-300 p-2 text-[10px] uppercase font-black text-center">STT</th>
               <th className="border border-slate-300 p-2 text-[10px] uppercase font-black w-24">Thời gian</th>
               <th className="border border-slate-300 p-2 text-[10px] uppercase font-black">Nội dung</th>
               <th className="border border-slate-300 p-2 text-[10px] uppercase font-black">Chủ trì</th>
               <th className="border border-slate-300 p-2 text-[10px] uppercase font-black">Địa điểm</th>
             </tr>
           </thead>
           <tbody>
             {filteredSchedules.map((s, index) => (
               <tr key={s.id}>
                 <td className="border border-slate-300 p-2 text-center text-xs">{index + 1}</td>
                 <td className="border border-slate-300 p-2 text-xs">
                   {format(parseISO(s.date), 'dd/MM/yyyy')}<br />{s.startTime}
                 </td>
                 <td className="border border-slate-300 p-2 text-xs font-bold">{s.title}</td>
                 <td className="border border-slate-300 p-2 text-xs">{s.host}</td>
                 <td className="border border-slate-300 p-2 text-xs">{s.location}</td>
               </tr>
             ))}
           </tbody>
        </table>

        <div className="grid grid-cols-2 mt-20">
           <div className="text-center">
              <p className="text-xs font-bold uppercase mb-20 text-slate-400 italic">Người lập biểu</p>
              <p className="text-sm font-black uppercase">{format(new Date(), "'Ngày' dd 'tháng' MM 'năm' yyyy")}</p>
           </div>
           <div className="text-center">
              <p className="text-sm font-black uppercase mb-20">Thường trực Đảng ủy</p>
              <p className="text-sm font-black uppercase">(Ký tên & đóng dấu)</p>
           </div>
        </div>
      </div>
    </div>
  );
}
