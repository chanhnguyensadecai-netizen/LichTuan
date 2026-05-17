import React, { useState, useEffect } from 'react';
import AttachmentManager from './AttachmentManager';
import { Schedule, UserRole } from '../types';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Clock, 
  MapPin, 
  Users,
  ChevronDown,
  Calendar as CalendarIcon,
  Plus,
  Copy,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Download,
   Upload,
  Loader2,
  Share2,
  Paperclip,
  ExternalLink
} from 'lucide-react';
import { TYPE_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG } from '../constants';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { deleteDoc, doc, updateDoc, collection, addDoc, query, onSnapshot } from 'firebase/firestore';
import { Attachment } from '../types';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { downloadExcelTemplate, parseExcelFile } from '../lib/excel';

interface ScheduleListProps {
  schedules: Schedule[];
  role: UserRole;
  onEdit: (schedule: Schedule) => void;
  onDuplicate: (schedule: Schedule) => void;
  onAddNew: () => void;
}

export default function ScheduleList({ schedules, role, onEdit, onDuplicate, onAddNew }: ScheduleListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachmentSchedule, setAttachmentSchedule] = useState<Schedule | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'attachments'));
    const unsub = onSnapshot(q, (snap) => {
      setAttachments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Attachment)));
    });
    return () => unsub();
  }, []);

  const getAttachmentsForSchedule = (scheduleId: string) =>
    attachments.filter(a => a.scheduleId === scheduleId);

  const filtered = schedules.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || s.type === filterType;
    const matchesStatus = filterStatus === 'all' || (s.status || 'pending') === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'schedules', id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `schedules/${id}`);
    }
  };

  const handleShareZalo = async (s: Schedule) => {
    const content = `THÔNG BÁO LỊCH CÔNG TÁC\n\n` +
      `- Thời gian: ${format(parseISO(s.date), 'EEEE, dd/MM/yyyy', { locale: vi })}, ${s.startTime}\n` +
      `- Nội dung: ${s.title}\n` +
      `- Địa điểm: ${s.location}\n` +
      `- Thường trực Đảng ủy: ${s.host}\n` +
      (s.participants ? `- Thành phần: ${s.participants}\n` : '');
    
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(s.id);
      setTimeout(() => setCopiedId(null), 3000);
      window.open('https://chat.zalo.me', '_blank');
    } catch (err) {
      alert('Không thể sao chép văn bản. Vui lòng kiểm tra lại quyền truy cập bộ nhớ tạm.');
    }
  };

  const handleDelete = async (id: string) => {
    alert('Đang thực hiện xóa lịch...');
    console.log('Attempting to delete schedule with ID:', id);
    try {
      await deleteDoc(doc(db, 'schedules', id));
      console.log('Delete successful for ID:', id);
    } catch (err: any) {
      console.error('Delete error for ID:', id, err);
      alert('Lỗi khi xóa: ' + (err.message || err));
      handleFirestoreError(err, OperationType.DELETE, `schedules/${id}`);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await parseExcelFile(file);
      const batch = data.map(item => ({
        ...item,
        status: (['admin', 'office', 'leader'].includes(role)) ? 'approved' : 'pending',
        createdBy: auth.currentUser?.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      for (const item of batch) {
        await addDoc(collection(db, 'schedules'), item);
      }
      
      alert(`Đã nhập thành công ${batch.length} lịch công tác.`);
    } catch (err: any) {
      console.error('Import error:', err);
      alert('Lỗi khi nhập file Excel: ' + (err.message || 'Sai định dạng file.'));
    } finally {
      setIsImporting(false);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800 tracking-tight uppercase">Danh sách Lịch công tác</h2>
          <p className="text-xs text-gray-500 font-medium">Hệ thống quản lý dữ liệu tập trung.</p>
        </div>

        <div className="flex items-center gap-3">
          {['admin', 'office', 'leader'].includes(role) && (
            <>
              <div className="flex items-center bg-gray-100 rounded p-1">
                <button 
                  onClick={downloadExcelTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white text-slate-600 rounded text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap"
                  title="Tải tệp mẫu Excel"
                >
                  <Download className="w-3.5 h-3.5" /> Mẫu
                </button>
                <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                <label className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white text-slate-600 rounded text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    className="hidden" 
                    onChange={handleImportExcel}
                    disabled={isImporting}
                  />
                  {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {isImporting ? 'Đang nhập...' : 'Nhập Excel'}
                </label>
              </div>

              <button 
                onClick={onAddNew}
                className="flex items-center gap-2 px-4 py-2 bg-[#da251d] text-white rounded text-xs font-bold shadow-sm hover:bg-red-800 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm lịch mới
              </button>
            </>
          )}

          <div className="relative">
            <input
              type="text"
              placeholder="Tìm nội dung, chủ trì..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded text-xs focus:ring-1 focus:ring-[#da251d] outline-none w-full md:w-56 shadow-sm"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded border transition-all cursor-pointer ${showFilters ? 'bg-red-50 border-[#da251d]/20 text-[#da251d]' : 'bg-white border-gray-200 text-gray-600'}`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-top-1 transition-all">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lọc theo:</span>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded text-[11px] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#da251d] font-medium"
            >
              <option value="all">Tất cả loại hình</option>
              <option value="meeting">Hội nghị/Họp</option>
              <option value="fieldwork">Đi địa bàn</option>
              <option value="event">Sự kiện</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái:</span>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded text-[11px] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#da251d] font-medium"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>
        </div>
      )}

      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 uppercase tracking-wider">
                <th className="px-6 py-3 border-r border-gray-200 w-28">Thời gian</th>
                <th className="px-6 py-3 border-r border-gray-200">Nội dung công tác</th>
                <th className="px-6 py-3 border-r border-gray-200 w-48">Địa điểm/Thành phần</th>
                <th className="px-6 py-3 border-r border-gray-200 w-32">Thường trực Đảng ủy</th>
                <th className="px-6 py-3 border-r border-gray-200 w-24 text-center">Trạng thái</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 border-r border-gray-100">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#da251d] capitalize">{format(parseISO(s.date), 'EEEE, dd/MM/yyyy', { locale: vi })}</span>
                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5 whitespace-nowrap">
                          <Clock className="w-3 h-3" /> {s.startTime}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r border-gray-100">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                           <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${TYPE_CONFIG[s.type].color.replace('rounded-full', 'rounded')}`}>
                            {TYPE_CONFIG[s.type].label}
                          </span>
                        </div>
                        <p className="font-bold text-gray-800 leading-snug">{s.title}</p>
                        {getAttachmentsForSchedule(s.id).length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {getAttachmentsForSchedule(s.id).map(att => (
                              <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 border border-purple-200 rounded text-[10px] font-bold hover:bg-purple-100 transition-colors"
                                title={att.name}
                                onClick={e => e.stopPropagation()}
                              >
                                <Paperclip className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate max-w-[100px]">{att.name}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r border-gray-100 italic text-gray-500">
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1.5">
                          <MapPin className="w-3 h-3 text-[#da251d] shrink-0" />
                          <span className="">{s.location}</span>
                        </div>
                        {s.participants && (
                          <div className="flex items-baseline gap-1.5 opacity-70">
                            <Users className="w-3 h-3 shrink-0" />
                            <span className="">{s.participants}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r border-gray-100">
                      <p className="font-bold text-gray-700">{s.host}</p>
                    </td>
                    <td className="px-6 py-4 border-r border-gray-100 text-center">
                      <span className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase border ${STATUS_CONFIG[s.status || 'pending'].color}`}>
                        {STATUS_CONFIG[s.status || 'pending'].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {['admin', 'office', 'leader'].includes(role) && (
                        <div className="flex items-center justify-end gap-1.5 transition-opacity">
                          {(s.status === 'pending' || !s.status) && (
                            <div className="flex items-center gap-1 mr-2 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                              <button 
                                onClick={() => handleStatusChange(s.id, 'approved')}
                                className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-[10px] font-bold hover:bg-green-700 transition-all cursor-pointer shadow-sm"
                                title="Phê duyệt"
                              >
                                <CheckCircle className="w-3 h-3" /> Duyệt
                              </button>
                              <button 
                                onClick={() => handleStatusChange(s.id, 'rejected')}
                                className="flex items-center gap-1 px-2 py-1 bg-slate-400 text-white rounded text-[10px] font-bold hover:bg-slate-500 transition-all cursor-pointer shadow-sm"
                                title="Từ chối"
                              >
                                <XCircle className="w-3 h-3" /> Từ chối
                              </button>
                            </div>
                          )}
                          <div className="flex items-center gap-0.5">
                            <button 
                              onClick={() => handleShareZalo(s)}
                              className={`p-2 rounded transition-colors cursor-pointer ${copiedId === s.id ? 'text-green-500 bg-green-50' : 'text-blue-500 hover:bg-blue-50'}`}
                              title={copiedId === s.id ? "Đã sao chép" : "Gửi Zalo"}
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setAttachmentSchedule(s)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                              title="Tài liệu đính kèm"
                            >
                              <Paperclip className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => onDuplicate(s)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer"
                              title="Sao chép"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => onEdit(s)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(s.id)}
                              className="p-2.5 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all cursor-pointer shadow-sm hover:shadow-md border border-transparent hover:border-red-700"
                              title="Xóa vĩnh viễn"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-300 font-medium uppercase tracking-widest text-[10px]">
                    Dữ liệu trống
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attachment Manager Modal */}
      {attachmentSchedule && (
        <AttachmentManager
          scheduleId={attachmentSchedule.id}
          scheduleTitle={attachmentSchedule.title}
          role={role}
          onClose={() => setAttachmentSchedule(null)}
        />
      )}
    </div>
  );
}
