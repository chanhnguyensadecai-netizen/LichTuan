import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Building2, Bell, Shield, Globe, Loader2, CheckCircle2 } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { exportSchedulesToExcel } from '../lib/excel';
import { Schedule } from '../types';

export default function Settings() {
  const [orgName, setOrgName] = useState('Đảng ủy Xã Tân Dương');
  const [address, setAddress] = useState('Số 01, Đường Lê Lợi, Xã Tân Dương');
  const [emailOnNew, setEmailOnNew] = useState(true);
  const [remindBefore30m, setRemindBefore30m] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!auth.currentUser) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'settings', 'system_config');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setOrgName(data.orgName || 'Đảng ủy Xã Tân Dương');
          setAddress(data.address || 'Số 01, Đường Lê Lợi, Xã Tân Dương');
          setEmailOnNew(data.emailOnNew ?? true);
          setRemindBefore30m(data.remindBefore30m ?? true);
          setWeeklyReport(data.weeklyReport ?? false);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await setDoc(doc(db, 'settings', 'system_config'), {
        orgName,
        address,
        emailOnNew,
        remindBefore30m,
        weeklyReport,
        updatedAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/system_config');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'schedules'));
      const schedules = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
      exportSchedulesToExcel(schedules);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'schedules');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Cài đặt hệ thống</h2>
          <p className="text-slate-500">Tùy chỉnh thông tin đơn vị và cấu hình ứng dụng.</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Đã lưu thành công</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-red-600" />
              Thông tin đơn vị
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên đơn vị (Hiển thị trên tiêu đề in ấn)</label>
                <input 
                  type="text" 
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu cấu hình
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Thông báo và Nhắc nhở
            </h3>
            <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-sm text-slate-700 font-medium">Gửi thông báo email khi có lịch mới</span>
                    <button 
                      onClick={() => setEmailOnNew(!emailOnNew)}
                      className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${emailOnNew ? 'bg-red-600' : 'bg-slate-300'}`}
                    >
                       <div className={`absolute top-0.5 transition-all duration-200 ${emailOnNew ? 'left-6.5' : 'left-0.5'} bg-white w-5 h-5 rounded-full shadow-sm`} />
                    </button>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-sm text-slate-700 font-medium">Nhắc lịch trước 30 phút qua ứng dụng</span>
                    <button 
                      onClick={() => setRemindBefore30m(!remindBefore30m)}
                      className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${remindBefore30m ? 'bg-red-600' : 'bg-slate-300'}`}
                    >
                       <div className={`absolute top-0.5 transition-all duration-200 ${remindBefore30m ? 'left-6.5' : 'left-0.5'} bg-white w-5 h-5 rounded-full shadow-sm`} />
                    </button>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-sm text-slate-700 font-medium">Tự động gửi báo cáo tuần vào sáng Thứ Hai</span>
                    <button 
                      onClick={() => setWeeklyReport(!weeklyReport)}
                      className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${weeklyReport ? 'bg-red-600' : 'bg-slate-300'}`}
                    >
                       <div className={`absolute top-0.5 transition-all duration-200 ${weeklyReport ? 'left-6.5' : 'left-0.5'} bg-white w-5 h-5 rounded-full shadow-sm`} />
                    </button>
                 </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 italic">
              * Một số tính năng thông báo đang trong quá trình tích hợp máy chủ SMTP.
            </p>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-red-50 rounded-3xl p-6 border border-red-100">
               <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                 <Shield className="w-4 h-4" /> Bảo mật hệ thống
               </h4>
               <p className="text-xs text-red-700 leading-relaxed mb-4">
                 Dữ liệu của bạn được mã hóa và lưu trữ an toàn trên nền tảng đám mây Google Firebase.
               </p>
               <button 
                onClick={() => alert('Nhật ký truy cập hiện tại trống.')}
                className="w-full py-2 bg-white text-red-800 rounded-xl font-bold text-xs shadow-sm cursor-pointer hover:bg-red-100 transition-colors"
               >
                  Kiểm tra nhật ký truy cập
               </button>
           </div>
           
           <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
               <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                 <Globe className="w-4 h-4" /> Sao lưu dữ liệu
               </h4>
               <p className="text-xs text-blue-700 leading-relaxed mb-4">
                 Bạn có thể xuất toàn bộ dữ liệu lịch ra file Excel hoặc JSON để lưu trữ ngoại tuyến.
               </p>
               <button 
                onClick={handleBackup}
                className="w-full py-2 bg-white text-blue-800 rounded-xl font-bold text-xs shadow-sm cursor-pointer hover:bg-blue-100 transition-colors"
               >
                  Tải xuống bản sao lưu (.xlsx)
               </button>
           </div>
        </div>
      </div>
    </div>
  );
}
