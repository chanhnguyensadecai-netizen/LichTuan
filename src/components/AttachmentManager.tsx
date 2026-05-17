import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { Attachment, UserRole } from '../types';
import { Link, Trash2, Download, ExternalLink, Plus, X, AlertCircle, Loader2, FileText, Paperclip } from 'lucide-react';

interface AttachmentManagerProps {
  scheduleId: string;
  scheduleTitle: string;
  role: UserRole;
  onClose: () => void;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return '🖼️';
  if (ext === 'pdf') return '📄';
  if (['doc','docx'].includes(ext)) return '📝';
  if (['xls','xlsx'].includes(ext)) return '📊';
  if (['ppt','pptx'].includes(ext)) return '📋';
  return '📎';
}

function extractFileName(url: string, customName: string): string {
  if (customName) return customName;
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    return decodeURIComponent(parts[parts.length - 1]) || 'Tài liệu';
  } catch {
    return 'Tài liệu';
  }
}

export default function AttachmentManager({ scheduleId, scheduleTitle, role, onClose }: AttachmentManagerProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '' });

  const canAdd = ['admin', 'office', 'leader'].includes(role);
  const canDelete = ['admin', 'office'].includes(role);

  useEffect(() => {
    const q = query(collection(db, 'attachments'), where('scheduleId', '==', scheduleId));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Attachment));
      data.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
      setAttachments(data);
      setLoading(false);
    });
    return () => unsub();
  }, [scheduleId]);

  const handleAdd = async () => {
    if (!form.url.trim()) { setError('Vui lòng nhập link tài liệu'); return; }
    
    // Kiểm tra URL hợp lệ
    try { new URL(form.url); } catch { setError('Link không hợp lệ. Vui lòng kiểm tra lại.'); return; }

    setAdding(true);
    setError('');
    try {
      const name = form.name.trim() || extractFileName(form.url, '');
      await addDoc(collection(db, 'attachments'), {
        name,
        url: form.url.trim(),
        size: 0,
        type: 'link',
        storagePath: '',
        uploadedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'Người dùng',
        uploadedAt: new Date().toISOString(),
        scheduleId,
      });
      setForm({ name: '', url: '' });
      setShowForm(false);
    } catch {
      setError('Lỗi khi thêm tài liệu. Vui lòng thử lại.');
    }
    setAdding(false);
  };

  const handleDelete = async (att: Attachment) => {
    if (!window.confirm(`Xóa tài liệu "${att.name}"?`)) return;
    setDeleting(att.id);
    try {
      await deleteDoc(doc(db, 'attachments', att.id));
    } catch {
      setError('Lỗi khi xóa. Vui lòng thử lại.');
    }
    setDeleting(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Paperclip className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Tài liệu đính kèm</h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[280px]">{scheduleTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Hướng dẫn */}
        <div className="mx-5 mt-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-700 flex gap-2">
          <span className="text-base">💡</span>
          <div>
            <p className="font-bold mb-0.5">Cách thêm tài liệu từ Google Drive:</p>
            <p>1. Mở file trên Google Drive → nhấn <strong>Chia sẻ</strong></p>
            <p>2. Đổi quyền thành <strong>"Bất kỳ ai có link"</strong> → Sao chép link</p>
            <p>3. Dán link vào ô bên dưới</p>
          </div>
        </div>

        {/* Form thêm link */}
        {canAdd && (
          <div className="px-5 mt-3">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-purple-200 rounded-xl text-purple-600 text-sm font-bold hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Thêm link tài liệu
              </button>
            ) : (
              <div className="border border-purple-200 rounded-xl p-4 space-y-3 bg-purple-50/30">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Tên tài liệu</label>
                  <input
                    type="text"
                    placeholder="VD: Biên bản họp tháng 5"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Link Google Drive *</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={form.url}
                    onChange={e => { setForm(f => ({ ...f, url: e.target.value })); setError(''); }}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={adding}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {adding ? 'Đang thêm...' : 'Thêm'}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setForm({ name: '', url: '' }); setError(''); }}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Danh sách tài liệu */}
        <div className="flex-1 overflow-y-auto p-5 pt-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : attachments.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Paperclip className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Chưa có tài liệu nào</p>
              {canAdd && <p className="text-xs mt-1">Nhấn "Thêm link tài liệu" để đính kèm</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                {attachments.length} tài liệu
              </p>
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <span className="text-2xl shrink-0">{getFileIcon(att.name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{att.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {att.uploadedBy} • {new Date(att.uploadedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                      title="Mở tài liệu"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(att)}
                        disabled={deleting === att.id}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Xóa"
                      >
                        {deleting === att.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
