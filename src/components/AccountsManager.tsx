import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, updateDoc, doc, query, setDoc, deleteDoc, where, getDocs } from 'firebase/firestore';
import { UserProfile, UserRole } from '../types';
import { Users, Shield, Mail, Calendar, UserCheck, AlertCircle, Plus, Trash2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function AccountsManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newAccount, setNewAccount] = useState({
    email: '',
    fullName: '',
    position: '',
    role: 'leader' as UserRole
  });

  useEffect(() => {
    // Only fetch admin, leader, and office roles
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['admin', 'office', 'leader'])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setUsers(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      alert('Cập nhật quyền thành công!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.email || !newAccount.fullName) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const normalizedEmail = newAccount.email.toLowerCase().trim();
    setLoading(true);
    try {
      // Use email as a temporary ID if we don't have a UID yet
      // This will be picked up by App.tsx when the user logs in
      const tempId = `pre_${normalizedEmail.replace(/[.@]/g, '_')}`;
      const docRef = doc(db, 'users', tempId);
      
      await setDoc(docRef, {
        ...newAccount,
        email: normalizedEmail,
        id: tempId,
        createdAt: new Date().toISOString()
      });

      alert('Thêm tài khoản thành công!');
      
      setNewAccount({
        email: '',
        fullName: '',
        position: '',
        role: 'leader'
      });
      setIsAddingMode(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'users/tempId');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (userId: string, fullName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${fullName}"?`)) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'users', userId));
      alert('Xóa tài khoản thành công!');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Quản lý tài khoản</h2>
          <p className="text-slate-500">Phân quyền và quản lý Lãnh đạo và Văn phòng.</p>
        </div>
        {!isAddingMode && (
          <button 
            onClick={() => setIsAddingMode(true)}
            className="flex items-center gap-2 bg-[#da251d] text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg shadow-red-200 hover:bg-[#b01d17] transition-all"
          >
            <Plus className="w-5 h-5" />
            Thêm tài khoản
          </button>
        )}
      </div>

      {isAddingMode && (
        <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#da251d]" />
              Thêm tài khoản mới
            </h3>
            <button onClick={() => setIsAddingMode(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Họ tên</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                placeholder="Nguyễn Văn A"
                value={newAccount.fullName}
                onChange={e => setNewAccount({...newAccount, fullName: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                placeholder="email@example.com"
                value={newAccount.email}
                onChange={e => setNewAccount({...newAccount, email: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Chức vụ</label>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                placeholder="Chánh Văn phòng"
                value={newAccount.position}
                onChange={e => setNewAccount({...newAccount, position: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Quyền hạn</label>
              <div className="flex gap-2">
                <select 
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold bg-white"
                  value={newAccount.role}
                  onChange={e => setNewAccount({...newAccount, role: e.target.value as UserRole})}
                >
                  <option value="leader">Lãnh đạo</option>
                  <option value="office">Văn phòng</option>
                  <option value="admin">Quản trị viên</option>
                </select>
                <button 
                  type="submit"
                  className="bg-[#da251d] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#b01d17] transition-all"
                >
                  Lưu
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Người dùng</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Quyền hạn</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Ngày đăng ký</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{user.fullName}</p>
                        <p className="text-xs text-slate-500">{user.position}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 opacity-50" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:ring-2 focus:ring-red-500 outline-none transition-all ${
                          user.role === 'admin' ? 'bg-red-50 text-red-700 border-red-200' : 
                          user.role === 'office' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="admin">Quản trị viên</option>
                        <option value="office">Văn phòng</option>
                        <option value="leader">Lãnh đạo</option>
                      </select>
                      <Shield className={`w-4 h-4 ${user.role === 'admin' ? 'text-red-500' : 'text-slate-300'}`} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-4 h-4 opacity-50" />
                      {user.createdAt ? format(parseISO(user.createdAt), 'dd/MM/yyyy') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteAccount(user.id, user.fullName)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Xóa tài khoản"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Chưa có tài khoản nào được quản lý.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4">
         <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
            <AlertCircle className="w-5 h-5" />
         </div>
         <div className="space-y-1">
            <p className="text-sm font-bold text-amber-800">Lưu ý quản lý</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Dánh sách này chỉ bao gồm các tài khoản Lãnh đạo, Văn phòng và Quản trị. Người dùng phổ thông (Guest) không cần đăng ký tài khoản và không hiển thị tại đây.
            </p>
         </div>
      </div>
    </div>
  );
}
