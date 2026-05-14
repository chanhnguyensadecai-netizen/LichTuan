import * as XLSX from 'xlsx';
import { Schedule, ScheduleType, Priority } from '../types';

const TEMPLATE_HEADERS = [
  'Nội dung công tác', 
  'Ngày (YYYY-MM-DD)', 
  'Giờ (HH:mm)', 
  'Địa điểm', 
  'Chủ trì', 
  'Thành phần tham dự'
];

export const downloadExcelTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    ['Họp giao ban đầu tuần', '2024-05-20', '08:00', 'Phòng họp BTV', 'Bí thư', 'Toàn thể CBCC'],
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  
  // Set column widths
  const wscols = [
    { wch: 40 }, // Nội dung
    { wch: 15 }, // Ngày
    { wch: 15 }, // Giờ
    { wch: 25 }, // Địa điểm
    { wch: 20 }, // Chủ trì
    { wch: 30 }, // Thành phần
  ];
  ws['!cols'] = wscols;

  XLSX.writeFile(wb, 'Mau_Nhap_Lich_Cong_Tac.xlsx');
};

export const parseExcelFile = (file: File): Promise<Partial<Schedule>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Skip header row
        const rows = jsonData.slice(1) as any[][];
        
        const schedules: Partial<Schedule>[] = rows.map(row => ({
          title: String(row[0] || ''),
          date: String(row[1] || ''),
          startTime: String(row[2] || ''),
          location: String(row[3] || ''),
          host: String(row[4] || ''),
          participants: String(row[5] || ''),
          type: 'meeting' as ScheduleType,
          priority: 'medium' as Priority,
          description: '',
          notes: '',
        })).filter(s => s.title && s.date); // Basic validation: must have title and date

        resolve(schedules);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export const exportSchedulesToExcel = (schedules: Schedule[]) => {
  const data = schedules.map(s => ({
    'Tiêu đề': s.title,
    'Ngày': s.date,
    'Giờ bắt đầu': s.startTime,
    'Giờ kết thúc': s.endTime || '',
    'Địa điểm': s.location,
    'Chủ trì': s.host,
    'Thành phần': s.participants,
    'Loại': s.type,
    'Ưu tiên': s.priority,
    'Trạng thái': s.status,
    'Lần cuối cập nhật': s.updatedAt
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Schedules');
  
  XLSX.writeFile(wb, `Lich_Cong_Tac_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
};
