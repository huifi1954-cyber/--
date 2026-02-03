import React, { useState } from 'react';
import { User, UserRole } from '../types.ts';
import { LogIn, UserPlus, ShieldCheck, GraduationCap, Loader2, KeyRound } from 'lucide-react';
import { OnlineService } from '../services/onlineService.ts';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>(UserRole.TEACHER);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolCode) return alert('يرجى إدخل رمز المؤسسة للربط بين الهواتف');
    
    setLoading(true);
    
    if (isLogin) {
      OnlineService.findUser(schoolCode, email, (cloudUser) => {
        if (cloudUser && cloudUser.password === password) {
          onLogin(cloudUser);
        } else {
          alert('بيانات الدخول غير صحيحة. تأكد من الرمز والبريد.');
        }
        setLoading(false);
      });
    } else {
      const newUser: User = {
        id: `USER-${Math.random().toString(36).substr(2, 9)}`,
        name,
        email,
        role,
        password,
        schoolCode: schoolCode.toLowerCase().trim()
      };
      
      OnlineService.syncUser(newUser);
      
      // Save locally as well
      const users = JSON.parse(localStorage.getItem('edu_users') || '[]');
      localStorage.setItem('edu_users', JSON.stringify([...users, newUser]));
      
      onLogin(newUser);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden relative">
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-200">
              <KeyRound className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">رقمنة الغيابات</h2>
            <p className="text-slate-400 text-xs font-bold uppercase mt-1">أدخل رمز الغرفة للربط مع زملائك</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">رمز المؤسسة (سر المشترك)</label>
              <input
                required
                type="text"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                className="w-full px-5 py-4 bg-blue-50/50 border-2 border-blue-100 rounded-2xl focus:border-blue-500 outline-none font-black text-blue-700 placeholder:text-blue-200"
                placeholder="مثلاً: SCHOOL2025"
              />
            </div>

            {!isLogin && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setRole(UserRole.TEACHER)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${role === UserRole.TEACHER ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}
                >
                  <GraduationCap className="w-6 h-6" />
                  <span className="text-[10px] font-black">أستاذ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole(UserRole.SUPERVISOR)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${role === UserRole.SUPERVISOR ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}
                >
                  <ShieldCheck className="w-6 h-6" />
                  <span className="text-[10px] font-black">مراقب</span>
                </button>
              </div>
            )}

            {!isLogin && (
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"
                placeholder="الاسم الكامل"
              />
            )}
            
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"
              placeholder="البريد الإلكتروني"
            />

            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"
              placeholder="كلمة المرور"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 mt-6 active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'دخول للنظام' : 'إنشاء حساب جديد')}
            </button>
          </form>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-center mt-8 text-sm font-black text-blue-600"
          >
            {isLogin ? 'لا تملك حساباً؟ سجل هنا' : 'لديك حساب؟ سجل دخولك'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;