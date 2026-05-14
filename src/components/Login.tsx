import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, limit, getDoc } from 'firebase/firestore';
import { Loader2, Mail, Lock, Flag, LogIn, AlertCircle, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orgName, setOrgName] = useState('Đảng ủy Xã Tân Bình');

  useEffect(() => {
    const fetchOrgName = async () => {
      try {
        const docRef = doc(db, 'settings', 'system_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().orgName) {
          setOrgName(docSnap.data().orgName);
        }
      } catch (err) {
        console.error("Error fetching org name for login:", err);
      }
    };
    fetchOrgName();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google login error:", err);
      setError('Không thể đăng nhập bằng Google. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedEmail = email.toLowerCase().trim();
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        
        // NOW signed in, can read users collection
        const usersRef = collection(db, 'users');
        const userSnapshot = await getDocs(query(usersRef, limit(1)));
        const isFirstUser = userSnapshot.empty;
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: normalizedEmail,
          fullName,
          role: isFirstUser ? 'admin' : 'viewer',
          position: isFirstUser ? 'Quản trị viên hệ thống' : 'Cán bộ',
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = 'Lỗi hệ thống. Vui lòng thử lại sau.';
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Email hoặc mật khẩu không chính xác';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'Email này đã được đăng ký. Vui lòng chuyển sang Đăng nhập.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'Tính năng đăng nhập Email chưa được bật trong Firebase Console. Vui lòng liên hệ kỹ thuật hoặc bật trong Authentication > Sign-in method.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Mật khẩu quá yếu (tối thiểu 6 ký tự)';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Email không hợp lệ';
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#da251d] rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#da251d] rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
          <div className="bg-[#da251d] p-10 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <Flag className="w-64 h-64 absolute -top-8 -right-8 text-white rotate-12" />
             </div>
             
             <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-yellow-400 rounded-full shadow-lg flex items-center justify-center text-red-700 mb-4">
                  <Flag className="w-8 h-8 fill-red-700" />
                </div>
                <h1 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Đảng Cộng Sản Việt Nam</h1>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">{orgName}</h2>
             </div>
          </div>

          <div className="p-8">
            <h2 className="text-sm font-bold text-gray-500 mb-8 text-center uppercase tracking-widest border-b border-gray-100 pb-4">
              {isLogin ? 'Xác thực hệ thống' : 'Đăng ký cán bộ'}
            </h2>

            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 rounded text-xs border border-red-100 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">Họ và tên</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-[#da251d] focus:border-[#da251d] transition-all text-sm outline-none"
                      placeholder="Nguyễn Văn A"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-400">
                      <LogIn className="w-4 h-4 opacity-0" />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">Email công vụ</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-[#da251d] focus:border-[#da251d] transition-all text-sm outline-none"
                    placeholder="example@coquan.gov.vn"
                  />
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">Mật khẩu</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-[#da251d] focus:border-[#da251d] transition-all text-sm outline-none"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#da251d] hover:bg-red-800 text-white font-bold py-3 px-4 rounded shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-6 uppercase text-sm tracking-wide"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Đăng nhập' : 'Tạo tài khoản')}
              </button>
            </form>

            <div className="mt-4 flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-[10px] text-gray-400 font-bold uppercase">Hoặc</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded border border-gray-200 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Đăng nhập bằng Google
            </button>

            <div className="mt-8 text-center text-[11px]">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-gray-400 hover:text-[#da251d] font-bold uppercase tracking-tight cursor-pointer underline underline-offset-4"
              >
                {isLogin ? 'Đăng ký tài khoản nội bộ' : 'Quay lại đăng nhập'}
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 lg:hidden">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-700 italic font-medium leading-relaxed">
                Trên di động, hãy đảm bảo mở link trực tiếp bằng trình duyệt (Chrome/Safari) để việc đăng nhập được thuận tiện nhất.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
           <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
             <strong>Lưu ý:</strong> Để đăng nhập bằng Email/Mật khẩu, bạn cần vào <a href="https://console.firebase.google.com/" target="_blank" className="underline font-bold">Firebase Console</a> {'>'} Authentication {'>'} Sign-in method và Bật (Enable) <strong>Email/Password</strong>.
           </p>
        </div>

        <p className="text-center text-gray-400 text-[10px] mt-8 uppercase font-bold tracking-widest opacity-50">
          Ban Tuyên giáo & Văn phòng Đảng ủy - 2026
        </p>
      </motion.div>
    </div>
  );
}
