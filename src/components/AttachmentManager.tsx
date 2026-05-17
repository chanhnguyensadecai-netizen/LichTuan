import React, { useState, useEffect, useRef } from 'react';
import { db, storage, auth } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Attachment, UserRole } from '../types';
import { Paperclip, Upload, Trash2, Download, FileText, FileImage, File, Loader2, X, AlertCircle } from 'lucide-react';

interface AttachmentManagerProps {
  scheduleId: string;
  scheduleTitle: string;
  role: UserRole;
  onClose: () => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'text/plain',
];

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-500" />;
  if (type === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
  if (type.includes('word')) return <FileText className="w-5 h-5 text-blue-700" />;
  if (type.includes('excel') || type.includes('spreadsheet')) return <FileText className="w-5 h-5 text-green-600" />;
  if (type.includes('powerpoint') || type.includes('presentation')) return <FileText className="w-5 h-5 text-orange-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function AttachmentManager({ scheduleId, scheduleTitle, role, onClose }: AttachmentManagerProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUpload = ['admin', 'office', 'leader'].includes(role);
  const canDelete = ['admin', 'office'].includes(role);

  useEffect(() => {
    const q = query(collection(db, 'attachments'), where('scheduleId', '==', scheduleId));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Attachment));
      data.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
      setAttachments(data);
    });
    return () => unsub();
  }, [scheduleId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setError('');
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" quá lớn. Tối đa 20MB.`);
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`File "${file.name}" không được hỗ trợ.`);
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const timestamp = Date.now();
        const storagePath = `attachments/${scheduleId}/${timestamp}_${file.name}`;
        const storageRef = ref(storage, storagePath);

        await new Promise<void>((resolve, reject) => {
          const task = uploadBytesResumable(storageRef, file);
          task.on('state_changed',
            (snap) => {
              const progress = ((i / files.length) + (snap.bytesTransferred / snap.totalBytes / files.length)) * 100;
              setUploadProgress(Math.round(progress));
            },
            reject,
            async () => {
              const url = await getDownloadURL(task.snapshot.ref);
              await addDoc(collection(db, 'attachments'), {
                name: file.name,
                size: file.size,
                type: file.type,
                url,
                storagePath,
                uploadedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'Người dùng',
                uploadedAt: new Date().toISOString(),
                scheduleId,
              });
              resolve();
            }
          );
        });
      }
      setUploadProgress(100);
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
    } catch (err) {
      setError('Lỗi khi tải lên. Vui lòng thử lại.');
      setUploading(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!window.confirm(`Xóa tài liệu "${attachment.name}"?`)) return;
    setDeleting(attachment.id);
    try {
      await deleteObject(ref(storage, attachment.storagePath));
      await deleteDoc(doc(db, 'attachments', attachment.id));
    } catch (err) {
      setError('Lỗi khi xóa tài liệu.');
    }
    setDeleting(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Paperclip className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Tài liệu đính kèm</h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[300px]">{scheduleTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Upload area */}
        {canUpload && (
          <div className="p-5 border-b border-gray-100">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-blue-200 rounded-xl p-5 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <span className="text-sm font-bold text-blue-600">Đang tải lên... {uploadProgress}%</span>
                  <div className="w-full bg-blue-100 rounded-full h-2 mt-1">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-blue-400" />
                  <span className="text-sm font-bold text-blue-600">Nhấn để chọn tài liệu</span>
                  <span className="text-xs text-gray-400">PDF, Word, Excel, PowerPoint, Ảnh • Tối đa 20MB/file</span>
                </>
              )}
            </button>
            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Danh sách tài liệu */}
        <div className="flex-1 overflow-y-auto p-5">
          {attachments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Paperclip className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Chưa có tài liệu nào</p>
              {canUpload && <p className="text-xs mt-1">Nhấn vào ô trên để đính kèm tài liệu</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                {attachments.length} tài liệu
              </p>
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                  <div className="shrink-0">{getFileIcon(att.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{att.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatFileSize(att.size)} • {att.uploadedBy} • {new Date(att.uploadedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={att.name}
                      className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                      title="Tải xuống"
                    >
                      <Download className="w-4 h-4" />
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
