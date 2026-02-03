import React, { useState, useEffect, useMemo } from 'react';
import { AbsenceRecord } from '../types.ts';
import { exportToExcel } from '../services/excelService.ts';
import { getAttendanceInsights } from '../services/geminiService.ts';
import { 
  Download, 
  Search, 
  UserX, 
  MessageCircle, 
  Sparkles, 
  Loader2, 
  ClipboardList, 
  FileText, 
  AlertCircle, 
  X,
  Trash2,
  RefreshCw,
  Bell,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { format } from 'date-fns';

interface SupervisorViewProps {
  records: AbsenceRecord[];
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
}

const SupervisorView: React.FC<SupervisorViewProps> = ({ records, onDeleteRecord, onClearAll }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [insights, setInsights] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastRecordCount, setLastRecordCount] = useState(records.length);
  const [showUpdateToast, setShowUpdateToast] = useState(false);

  // Calculate cumulative absences for each student
  const studentStats = useMemo(() => {
    const stats: Record<string, number> = {};
    records.forEach(r => {
      if (r.reason === 'absent') {
        stats[r.studentName] = (stats[r.studentName] || 0) + 1;
      }
    });
    return stats;
  }, [records]);

  const getAbsenceStyle = (studentName: string) => {
    const count = studentStats[studentName] || 0;
    
    if (count >= 32) return { 
      bg: 'bg-purple-50', 
      text: 'text-purple-800', 
      border: 'border-purple-200', 
      badge: 'bg-purple-600',
      label: 'خطير جداً (32+)' 
    };
    if (count >= 16) return { 
      bg: 'bg-red-50', 
      text: 'text-red-800', 
      border: 'border-red-200', 
      badge: 'bg-red-600',
      label: 'إنذار نهائي (16+)' 
    };
    if (count >= 7) return { 
      bg: 'bg-orange-50', 
      text: 'text-orange-800', 
      border: 'border-orange-200', 
      badge: 'bg-orange-500',
      label: 'تجاوز الأسبوع (7+)' 
    };
    if (count >= 3) return { 
      bg: 'bg-yellow-50', 
      text: 'text-yellow-800', 
      border: 'border-yellow-200', 
      badge: 'bg-yellow-500',
      label: 'تنبيه أول (3+)' 
    };
    
    return { 
      bg: 'bg-white', 
      text: 'text-slate-700', 
      border: 'border-slate-100', 
      badge: 'bg-slate-400',
      label: '' 
    };
  };

  const handleAnalyze = async () => {
    if (records.length === 0) return;
    setIsAnalyzing(true);
    const result = await getAttendanceInsights(records);
    setInsights(result.insights || []);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    // Automatically analyze if records change significantly
    if (records.length > 0 && Math.abs(records.length - lastRecordCount) > 5) {
      handleAnalyze();
    } else if (records.length === 0) {
      setInsights([]);
    }

    if (records.length > lastRecordCount && lastRecordCount !== 0) {
      setShowUpdateToast(true);
      const timer = setTimeout(() => setShowUpdateToast(false), 5000);
      setLastRecordCount(records.length);
      return () => clearTimeout(timer);
    }
    setLastRecordCount(records.length);
  }, [records.length]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [records, searchTerm]);

  const handleExportExcel = () => {
    if (filteredRecords.length === 0) return;
    const exportData = filteredRecords.map(r => ({
      'تاريخ التقرير': format(new Date(r.date), 'yyyy-MM-dd HH:mm'),
      'الأستاذ': r.teacherName,
      'اسم التلميذ': r.studentName,
      'إجمالي الغيابات': studentStats[r.studentName] || 0,
      'الحالة': r.reason === 'absent' ? 'غائب' : 'متأخر',
      'ملاحظة الجلسة': r.messageToSupervisor || 'لا توجد'
    }));
    exportToExcel(exportData, `متابعة_الغياب_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleExportText = () => {
    const absentStudents = filteredRecords
      .filter(r => r.reason === 'absent')
      .map(r => `${r.studentName} (${studentStats[r.studentName]} غيابات)`);

    if (absentStudents.length === 0) return;
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const content = `قائمة التلاميذ الغائبين - رقمنة الغيابات - ${dateStr}\n` + 
                    `===================================\n\n` + 
                    absentStudents.map((name, index) => `${index + 1}. ${name}`).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `قائمة_الغياب_${dateStr}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500" dir="rtl">
      
      {/* Real-time Status & AI Insights Trigger */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between p-4 bg-white text-slate-800 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping absolute" />
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full relative shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">مزامنة حية</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || records.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black border border-indigo-100 hover:bg-indigo-100 transition-all disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              تحليل ذكي للبيانات
            </button>
          </div>
        </div>

        {showUpdateToast && (
          <div className="flex items-center justify-between p-4 bg-indigo-600 text-white rounded-2xl shadow-2xl animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 animate-bounce" />
              <p className="text-sm font-black">تنبيه: وصل تقرير غياب جديد الآن!</p>
            </div>
            <button onClick={() => setShowUpdateToast(false)} className="p-1.5"><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* AI Insights Card */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-3xl text-white shadow-2xl space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4">
            <Lightbulb className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-xl">
                <Sparkles className="w-5 h-5 text-indigo-100" />
              </div>
              <h3 className="text-xl font-black">تحليلات الأداء والغياب (Gemini AI)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.map((insight, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/15 transition-all">
                  <p className="text-sm font-bold leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Threshold Legend */}
      <div className="flex flex-wrap gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-xs font-black text-slate-400 uppercase w-full mb-1">دليل العقوبات والغياب:</div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-xl border border-yellow-100 text-[10px] font-black">
          <div className="w-2 h-2 bg-yellow-500 rounded-full" /> 3+ أيام
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-xl border border-orange-100 text-[10px] font-black">
          <div className="w-2 h-2 bg-orange-500 rounded-full" /> 7+ أيام
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-xl border border-red-100 text-[10px] font-black">
          <div className="w-2 h-2 bg-red-600 rounded-full" /> 16+ يوماً
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 text-[10px] font-black">
          <div className="w-2 h-2 bg-purple-600 rounded-full" /> 32+ يوماً
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="ابحث عن تلميذ..."
              className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button onClick={handleExportText} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black hover:bg-slate-700 transition-all"><FileText className="w-4 h-4" /> نص</button>
            <button onClick={handleExportExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all"><Download className="w-4 h-4" /> إكسل</button>
            <button onClick={onClearAll} className="flex-1 md:flex-none p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-red-100" title="مسح الكل"><Trash2 className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">اسم التلميذ</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">إجمالي الغيابات</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">الأستاذ</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">التاريخ</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record, idx) => {
                const style = getAbsenceStyle(record.studentName);
                const count = studentStats[record.studentName] || 0;
                
                return (
                  <tr key={record.id} className={`hover:bg-slate-50/50 transition-colors ${style.bg}`}>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className={`font-black text-sm ${style.text}`}>{record.studentName}</span>
                        {style.label && (
                          <span className={`text-[9px] font-black uppercase flex items-center gap-1 ${style.text}`}>
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {style.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-black text-xs ${style.badge} shadow-sm`}>
                        {count}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-500">{record.teacherName}</td>
                    <td className="px-6 py-5 text-[11px] font-black text-slate-400 tabular-nums">
                      {format(new Date(record.date), 'HH:mm - dd/MM')}
                    </td>
                    <td className="px-6 py-5 flex items-center justify-center gap-3">
                      {record.messageToSupervisor && (
                        <div className="relative group/tooltip">
                          <MessageCircle className="w-5 h-5 text-blue-300 group-hover:text-blue-600 cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover/tooltip:opacity-100 z-50 pointer-events-none shadow-2xl leading-relaxed transition-opacity">
                            {record.messageToSupervisor}
                          </div>
                        </div>
                      )}
                      <button onClick={() => onDeleteRecord(record.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 font-bold italic">
                    لا توجد سجلات مطابقة للبحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupervisorView;