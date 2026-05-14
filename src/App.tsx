import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, query, limit, where, deleteDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { Loader2, Flag } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('weekly');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    // Detect Zalo or in-app browser on iPhone
    const ua = navigator.userAgent || '';
    const isIphone = /iPhone|iPod|iPad/.test(ua);
    const isZalo = /Zalo/.test(ua);
    const isFB = /FBAN|FBAV/.test(ua); // Facebook
    
    if (isIphone && (isZalo || isFB)) {
      setIsInAppBrowser(true);
    }

    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'system_config');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data());
        }
      } catch (settingsErr) {
        console.error('Error fetching settings in App:', settingsErr);
      }
    };

    fetchSettings();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          let userProfile: UserProfile;

          if (docSnap.exists()) {
            const data = docSnap.data();
            // Force admin for the main user email
            const isOwner = firebaseUser.email?.toLowerCase() === 'chanhnguyensadecai@gmail.com';
            if (isOwner && data.role !== 'admin') {
              const updatedProfile = { ...data, role: 'admin', position: 'Quản trị viên hệ thống' };
              await setDoc(docRef, updatedProfile, { merge: true });
              userProfile = { id: firebaseUser.uid, ...updatedProfile } as UserProfile;
            } else {
              userProfile = { id: firebaseUser.uid, ...data } as UserProfile;
            }
          } else {
            // Check if there is a pre-authorized account with this email
            const normalizedEmail = firebaseUser.email?.toLowerCase().trim() || '';
            const isOwner = normalizedEmail === 'chanhnguyensadecai@gmail.com';
            const qPreAuth = query(collection(db, 'users'), where('email', '==', normalizedEmail), limit(1));
            const preAuthSnap = await getDocs(qPreAuth);
            
            if (!preAuthSnap.empty) {
              const preAuthDoc = preAuthSnap.docs[0];
              const preAuthData = preAuthDoc.data();
              
              // Create the new profile using pre-auth data but with the real UID
              const newProfile = {
                ...preAuthData,
                id: firebaseUser.uid,
                email: normalizedEmail,
                fullName: firebaseUser.displayName || preAuthData.fullName || 'Thành viên',
                role: isOwner ? 'admin' : (preAuthData.role || 'viewer'),
                lastLogin: new Date().toISOString()
              };
              
              await setDoc(docRef, newProfile);
              
              try {
                if (preAuthDoc.id !== firebaseUser.uid) {
                  await deleteDoc(doc(db, 'users', preAuthDoc.id));
                }
              } catch (delErr) {
                console.warn('Could not delete pre-auth doc:', delErr);
              }
              
              userProfile = newProfile as unknown as UserProfile;
            } else {
              // Check if this is the first user overall
              const usersRef = collection(db, 'users');
              const userSnapshot = await getDocs(query(usersRef, limit(1)));
              const isFirstUser = userSnapshot.empty;

              // New user default profile
              const newProfile = {
                email: normalizedEmail,
                fullName: firebaseUser.displayName || 'Người dùng mới',
                role: (isOwner || isFirstUser ? 'admin' : 'viewer') as UserRole,
                position: (isOwner || isFirstUser) ? 'Quản trị viên hệ thống' : 'Chưa cập nhật',
                createdAt: new Date().toISOString(),
              };
              await setDoc(docRef, newProfile);
              userProfile = { id: firebaseUser.uid, ...newProfile } as UserProfile;
            }
          }
          
          setProfile(userProfile);
          
          // AUTO REDIRECT AFTER LOGIN - only if we were on 'login' or 'weekly'
          if (currentTab === 'login' || currentTab === 'weekly') {
            setCurrentTab('dashboard');
          }
          
        } else {
          setUser(null);
          // Default guest profile for public access
          setProfile({
            id: 'guest',
            email: '',
            fullName: 'Khách xem',
            role: 'viewer' as UserRole,
            position: 'Người xem công khai',
            createdAt: new Date().toISOString(),
          } as UserProfile);
        }
      } catch (err) {
        console.error('Error in onAuthStateChanged:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  // The check below is removed to allow public access
  // if (!user || !profile) {
  //   return <Login />;
  // }

  if (currentTab === 'login') {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans relative">
      {isInAppBrowser && (
        <div className="fixed inset-0 z-[100] bg-[#da251d] text-white p-8 flex flex-col items-center justify-center text-center">
          <Flag className="w-16 h-16 mb-6 text-yellow-400" />
          <h2 className="text-xl font-bold uppercase mb-4">Vui lòng mở bằng trình duyệt</h2>
          <p className="text-sm leading-relaxed mb-8 opacity-90">
            Trình duyệt Zalo có thể chặn một số tính năng của ứng dụng. Để xem được lịch công tác, vui lòng:
          </p>
          <div className="space-y-6 text-left w-full max-w-xs bg-white/10 p-6 rounded-2xl border border-white/10">
            <div className="flex gap-4 items-start">
              <div className="w-6 h-6 rounded-full bg-yellow-400 text-[#da251d] flex items-center justify-center shrink-0 font-bold text-xs">1</div>
              <p className="text-sm">Bấm vào dấu <strong>ba chấm (...)</strong> hoặc <strong>biểu tượng chia sẻ</strong> ở góc trên bên phải.</p>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-6 h-6 rounded-full bg-yellow-400 text-[#da251d] flex items-center justify-center shrink-0 font-bold text-xs">2</div>
              <p className="text-sm">Chọn <strong>"Mở bằng trình duyệt"</strong> (hoặc "Open in Safari").</p>
            </div>
          </div>
          <button 
            onClick={() => setIsInAppBrowser(false)}
            className="mt-12 text-xs opacity-50 underline"
          >
            Tôi đã hiểu, tiếp tục xem
          </button>
        </div>
      )}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }} 
        profile={profile} 
        orgName={settings?.orgName}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 lg:ml-52 print:ml-0">
        <Header 
          profile={profile} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          setCurrentTab={setCurrentTab}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Dashboard 
            currentTab={currentTab} 
            profile={profile} 
            setCurrentTab={setCurrentTab}
          />
        </main>
      </div>
    </div>
  );
}
