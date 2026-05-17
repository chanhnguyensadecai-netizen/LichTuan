export type UserRole = 'admin' | 'office' | 'leader' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  position: string;
  createdAt: string;
}

export type ScheduleType = 'meeting' | 'fieldwork' | 'event' | 'other';
export type Priority = 'low' | 'medium' | 'high';

export interface Schedule {
  id: string;
  title: string;
  description: string;
  date: string; // ISO format YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string;
  location: string;
  host: string;
  participants: string;
  type: ScheduleType;
  priority: Priority;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: string;
  scheduleId: string;
}
