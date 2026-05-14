import React, { useState, useEffect } from 'react';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Schedule, ScheduleType, Priority, UserProfile } from '../types';
import { 
  X, 
  Save, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Users, 
  AlertCircle,
  FileText,
  Bookmark,
  Sparkles,
  Loader2,
  CheckCircle,
  Clock3
} from 'lucide-react';
import { parseScheduleWithAI } from '../services/geminiService';

interface ScheduleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Schedule;
  profile: UserProfile;
}

export default function ScheduleForm({ onSuccess, onCancel, initialData, profile }: ScheduleFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '07:30',
    endTime: '11:00',
    location: 'Phòng họp Đảng ủy',
    host: '',
    participants: '',
    type: 'meeting' as ScheduleType,
    priority: 'medium' as Priority,
    notes: '',
    status: 'pending' as 'pending' | 'approved' | 'rejected',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiText, setAiText] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);

  const handleAiImport = async (autoSave = false) => {
    if (!aiText.trim()) return;
    setIsAiParsing(true);
    setError('');
    
    try {
      const parsed = await parseScheduleWithAI(aiText);
      if (parsed) {
        const newFormData = {
          ...formData,
          title: parsed.title || formData.title,
          date: parsed.date || formData.date,
          startTime: parsed.startTime || formData.startTime,
          location: parsed.location || formData.location,
          host: parsed.host || formData.host,
          participants: parsed.participants || formData.participants,
          type: (parsed.type as ScheduleType) || formData.type,
          priority: (parsed.priority as Priority) || formData.priority,
        };
        
        setFormData(newFormData);
        setAiText('');

        if (autoSave) {
          setLoading(true);
          try {
            const finalStatus = (['admin', 'office', 'leader'].includes(profile.role)) ? 'approved' : 'pending';
            await addDoc(collection(db, 'schedules'), {
              ...newFormData,
              status: finalStatus,
              createdBy: auth.currentUser?.uid,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            onSuccess();
          } catch (err: any) {
            console.error("Quick add error:", err);
            handleFirestoreError(err, OperationType.CREATE, 'schedules');
          } finally {
            setLoading(false);
          }
        }
      } else {
        setError('Không thể nhận diện được thông tin từ văn bản này. Vui lòng kiểm tra lại.');
      }
    } catch (err: any) {
      console.error("AI Import error:", err);
      setError('Lỗi xử lý AI: ' + err.message);
    } finally {
      setIsAiParsing(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        date: initialData.date,
        startTime: initialData.startTime,
        endTime: initialData.endTime || '',
        location: initialData.location,
        host: initialData.host,
        participants: initialData.participants || '',
        type: initialData.type,
        priority: initialData.priority,
        notes: initialData.notes || '',
        status: initialData.status || 'pending',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      if (initialData) {
        await updateDoc(doc(db, 'schedules', initialData.id), payload);
      } else {
        const finalStatus = ['admin', 'office', 'leader'].includes(profile.role) ? 'approved' : 'pending';
        await addDoc(collection(db, 'schedules'), {
          ...payload,
          status: finalStatus,
          createdBy: auth.currentUser?.uid,
          createdAt: new Date().toISOString(),
        });
      }
      onSuccess();
    } catch (err) {
      handleFirestoreError(err, initialData ? OperationType.UPDATE : OperationType.CREATE, 'schedules');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-red-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold uppercase tracking-tight">{initialData ? 'Cập nhật lịch công tác' : 'Thêm lịch công tác mới'}</h3>
              <p className="text-red-100 text-xs opacity-80 uppercase tracking-widest font-medium">Đảng ủy Xã</p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {!initialData && (
            <div className="mb-10 p-5 bg-yellow-50 border border-yellow-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-yellow-600" />
                <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-tight">Trợ lý AI - Nhập nhanh</h4>
              </div>
              <p className="text-[11px] text-yellow-700 mb-4 italic">
                Dán nội dung từ văn bản hoặc tin nhắn (ví dụ: "Thứ 2 này họp chi bộ lúc 8h sáng tại phòng 1, Đ/c Bí thư chủ trì").
              </p>
              <div className="flex gap-2">
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  className="flex-1 px-4 py-2 text-sm bg-white border border-yellow-200 rounded-xl focus:ring-1 focus:ring-yellow-500 outline-none min-h-[60px]"
                  placeholder="Nhập nội dung lịch công tác..."
                />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleAiImport(false)}
                    disabled={isAiParsing || !aiText.trim() || loading}
                    className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isAiParsing && !loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isAiParsing && !loading ? 'Đang đọc...' : 'Phân tích'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAiImport(true)}
                    disabled={isAiParsing || !aiText.trim() || loading}
                    className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {(loading || (isAiParsing && !error)) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {loading ? 'Đang lưu...' : (isAiParsing ? 'Đang đọc...' : 'Thêm vào lịch')}
                  </button>
                </div>
              </div>
              {error && (
                <div className="mt-3 p-3 bg-red-50 text-red-600 text-[11px] rounded-xl flex items-center gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Nội dung công tác *
                </label>
                <textarea
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none text-sm transition-all min-h-[100px]"
                  placeholder="Ví dụ: Họp Ban Thường vụ định kỳ tháng 05/2026..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Ngày *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Bắt đầu *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Địa điểm *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none text-sm transition-all"
                  placeholder="Hội trường UBND Xã..."
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Người chủ trì *
                </label>
                <input
                  type="text"
                  required
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none text-sm transition-all"
                  placeholder="Đ/c Bí thư Đảng ủy..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Thành phần tham dự
                </label>
                <input
                  type="text"
                  value={formData.participants}
                  onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none text-sm transition-all"
                  placeholder="Toàn thể BCH Đảng bộ..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                   Ghi chú
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none text-sm transition-all"
                  placeholder="Chuẩn bị tài liệu báo cáo..."
                />
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
             <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : (
                <>
                  <Save className="w-5 h-5" />
                  {initialData ? 'Cập nhật' : 'Thêm vào lịch'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
