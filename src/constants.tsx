import React from 'react';
import { Calendar, CheckCircle2, Clock, MapPin, User, Users, AlertCircle } from 'lucide-react';
import { ScheduleType, Priority } from './types';

export const TYPE_CONFIG: Record<ScheduleType, { label: string; color: string; icon: React.ReactNode }> = {
  meeting: { 
    label: 'Hội nghị/Họp', 
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <Users className="w-4 h-4" />
  },
  fieldwork: { 
    label: 'Đi địa bàn/Cơ sở', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <MapPin className="w-4 h-4" />
  },
  event: { 
    label: 'Sự kiện/Lễ kỷ niệm', 
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: <Calendar className="w-4 h-4" />
  },
  other: { 
    label: 'Công việc khác', 
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: <Clock className="w-4 h-4" />
  }
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low: { label: 'Bình thường', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Quan trọng', color: 'bg-orange-100 text-orange-600' },
  high: { label: 'Khẩn cấp', color: 'bg-red-600 text-white' }
};

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  office: 'Văn phòng Đảng ủy',
  leader: 'Lãnh đạo',
  viewer: 'Cán bộ/Đảng viên'
};

export const STATUS_CONFIG: Record<'pending' | 'approved' | 'rejected', { label: string; color: string }> = {
  pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-700 border-red-200' }
};
