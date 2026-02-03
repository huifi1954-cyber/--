import React, { useState } from 'react';
import { UserRole } from '../types.ts';
import { LogOut, ClipboardCheck, Wifi, WifiOff, Share2, QrCode, X, Copy } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  userName?: string;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, role, userName, onLogout }) => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const userStr = localStorage.getItem('edu_current_user');
  const schoolCode = userStr ? JSON.parse(userStr).schoolCode : 'HOUAIFI';

  React.useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const currentUrl = window.location.href;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'رقمنة الغيابات - نظام الغياب',
          text: `انضم لنظامنا بكود: ${schoolCode}`,
          url: currentUrl,
        });
      } catch (err) {
        setShowShareModal(true);
      }
    } else {
      setShowShareModal(true);
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden" dir="rtl">
      <aside className="w-full md:w-64 bg-white border-l border-slate-200 flex flex-col shrink-0 z-30 shadow-sm md:shadow-none">
        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between md:block">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-blue-600 flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 md:w-8 md:h-8" />
              رقمنة الغيابات
            </h1>
            <p className="hidden md:block text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-tight">الربط اللحظي بين الهواتف</p>
          </div>
          <button onClick={handleShare} className="md:hidden p-2 bg-blue-50 text-blue-600 rounded-full">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <nav className="hidden md:flex flex-1 p-4 flex-col gap-4">
          <div className="space-y-2">
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">الحالة</div>
            <div className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 font-bold">
              {role === UserRole.TEACHER ? <GraduationCap className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              {role === UserRole.TEACHER ? 'بوابة المعلم' : 'لوحة المراقب'}
            </div>
          </div>

          <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-black text-slate-400 uppercase mb-1">رمز الربط للمؤسسة</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-blue-600 tracking-widest">{schoolCode}</span>
              <button onClick={() => {navigator.clipboard.writeText(schoolCode); alert('تم نسخ الكود')}} className="p-1 hover:bg-white rounded-md">
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleShare}
            className="mt-auto flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 font-bold transition-all"
          >
            <QrCode className="w-5 h-5 text-slate-400" />
            دعوة هاتف آخر
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3 bg-white">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
            {isOnline ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-green-700 uppercase">مزامنة حية نشطة</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[10px] font-bold text-red-700 uppercase">بانتظار الإنترنت...</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black border-2 border-white shrink-0">
              {userName ? userName[0] : 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black text-slate-700 truncate">{userName || 'مستخدم'}</p>
              <button 
                onClick={onLogout}
                className="text-[9px] text-red-500 uppercase font-black hover:underline"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-0 bg-slate-50 relative overflow-y-auto custom-scrollbar p-4 md:p-8">
        {children}
      </main>

      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center space-y-6">
            <h3 className="text-xl font-black text-slate-800">ربط الهواتف</h3>
            <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto rounded-3xl border-4 border-slate-50" />
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-bold">لربط هاتف زميلك، افتح الكاميرا وامسح الكود.</p>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[10px] text-blue-400 font-black uppercase mb-1">رمز المؤسسة المطلوب للدخول</p>
                <p className="text-xl font-black text-blue-600 tracking-[0.2em]">{schoolCode}</p>
              </div>
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full py-4 bg-slate-100 text-slate-600 font-black rounded-2xl">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
};

const GraduationCap = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
);
const ShieldCheck = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
);

export default Layout;