import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { Schedule, UserProfile } from '../types';
import ScheduleList from './ScheduleList';
import ScheduleForm from './ScheduleForm';
import WeeklyView from './WeeklyView';
import AccountsManager from './AccountsManager';
import StatsOverview from './StatsOverview';
import Settings from './Settings';
import Login from './Login';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3 } from 'lucide-react';

import Reports from './Reports';

interface DashboardProps {
  currentTab: string;
  profile: UserProfile;
  setCurrentTab: (tab: string) => void;
  settings?: any;
}

export default function Dashboard({ currentTab, profile, setCurrentTab, settings }: DashboardProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'schedules'), orderBy('date', 'desc'), orderBy('startTime', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
      setSchedules(data);
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setCurrentTab('add-schedule');
  };

  const handleDuplicate = (schedule: Schedule) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, createdBy, ...rest } = schedule;
    setEditingSchedule(rest as any);
    setCurrentTab('add-schedule');
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <StatsOverview schedules={schedules} setCurrentTab={setCurrentTab} role={profile.role} />;
      case 'schedules':
        return (
          <ScheduleList 
            schedules={schedules} 
            role={profile.role} 
            onEdit={handleEdit} 
            onDuplicate={handleDuplicate}
            onAddNew={() => setCurrentTab('add-schedule')}
          />
        );
      case 'add-schedule':
        if (!['admin', 'office', 'leader'].includes(profile.role)) return <WeeklyView schedules={schedules} orgName={settings?.orgName} />;
        return (
          <ScheduleForm 
            onSuccess={() => {
              setCurrentTab('schedules');
              setEditingSchedule(null);
            }} 
            initialData={editingSchedule || undefined}
            profile={profile}
            onCancel={() => {
              setCurrentTab('schedules');
              setEditingSchedule(null);
            }}
          />
        );
      case 'weekly':
        return <WeeklyView schedules={schedules} orgName={settings?.orgName} />;
      case 'accounts':
        if (profile.role !== 'admin') return <WeeklyView schedules={schedules} orgName={settings?.orgName} />;
        return <AccountsManager />;
      case 'settings':
        if (!['admin', 'office', 'leader'].includes(profile.role)) return <WeeklyView schedules={schedules} orgName={settings?.orgName} />;
        return <Settings />;
      case 'login':
        return <Login />;
      case 'reports':
        return <Reports schedules={schedules} />;
      default:
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-slate-400">Đang phát triển...</p>
          </div>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentTab}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  );
}
