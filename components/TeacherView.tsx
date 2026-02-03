import React, { useState, useRef } from 'react';
import { AbsenceRecord, User } from '../types.ts';
import { generateProfessionalMessage } from '../services/geminiService.ts';
import { parseExcelForStudents } from '../services/excelService.ts';
import { Send, Sparkles, CheckCircle2, Info, UserPlus, X, FileUp, ListChecks, Trash2, Loader2, Mic, MicOff } from 'lucide-react';
import { format } from 'date-fns';

interface TeacherViewProps {
  currentUser: User;
  onRecordAbsences: (records: AbsenceRecord[]) => void;
}

interface SelectedStudent {
  name: string;
  status: 'absent' | 'late';
}

const TeacherView: React.FC<TeacherViewProps> = ({ currentUser, onRecordAbsences }) => {
  const [typedName, setTypedName] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>([]);
  const [aiMessage, setAiMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("المتصفح الخاص بك لا يدعم ميزة التعرف على الصوت. يرجى استخدام Chrome أو Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTypedName(transcript);
    };

    recognition.start();
  };

  const handleAddStudent = (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = typedName.trim();
    if (!name) return;
    
    if (selectedStudents.find(s => s.name.toLowerCase() === name.toLowerCase())) {
      setTypedName('');
      return;
    }

    setSelectedStudents([...selectedStudents, { name, status: 'absent' }]);
    setTypedName('');
  };

  const removeStudent = (name: string) => {
    setSelectedStudents(selectedStudents.filter(s => s.name !== name));
  };

  const toggleStatus = (name: string) => {
    setSelectedStudents(selectedStudents.map(s => 
      s.name === name ? { ...s, status: s.status === 'absent' ? 'late' : 'absent' } : s
    ));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const names = await parseExcelForStudents(file);
      const imported = names.map(name => ({ name, status: 'absent' as const }));
      
      const newOnes = imported.filter(imp => 
        !selectedStudents.some(ex => ex.name.toLowerCase() === imp.name.toLowerCase())
      );

      setSelectedStudents([...selectedStudents, ...newOnes]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      alert("خطأ في قراءة الملف. تأكد من وجود عمود 'الاسم'.");
    }
  };

  const handleAiGenerate = async () => {
    const names = selectedStudents.filter(s => s.status === 'absent').map(s => s.name);
    if (names.length === 0) {
      alert("يرجى إضافة طلاب غائبين أولاً لتوليد التقرير.");
      return;
    }
    
    setIsGenerating(true);
    const message = await generateProfessionalMessage(currentUser.name, names, format(new Date(), 'yyyy-MM-dd HH:mm'));
    setAiMessage(message || '');
    setIsGenerating(false);
  };

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
      alert("قائمة الطلاب فارغة.");
      return;
    }

    setIsSubmitting(true);
    
    const records: AbsenceRecord[] = selectedStudents.map(s => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      date: new Date().toISOString(),
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      studentId: 'STUD-' + Math.random().toString(36).substr(2, 5),
      studentName: s.name,
      reason: s.status,
      messageToSupervisor: aiMessage
    }));

    onRecordAbsences(records);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setAiMessage('');
      setSelectedStudents([]);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 400);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Absence Entry Console */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">تسجيل غياب جديد</h3>
                <p className="text-sm text-slate-500">أضف التلاميذ لإرسالهم فوراً للمراقب العام</p>
              </div>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  <FileUp className="w-4 h-4" />
                  إكسل
                </button>
              </div>
            </div>

            <form onSubmit={handleAddStudent} className="flex gap-2">
              <div className="relative flex-1">
                <UserPlus className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="اكتب اسم التلميذ..."
                  className="w-full pr-12 pl-14 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                />
                <button 
                  type="button"
                  onClick={startVoiceRecognition}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-200'}`}
                  title="استخدم الصوت"
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>
              <button 
                type="submit"
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
              >
                إضافة
              </button>
            </form>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-sm font-semibold text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                  <ListChecks className="w-4 h-4" />
                  قائمة المحددين ({selectedStudents.length})
                </h4>
                {selectedStudents.length > 0 && (
                  <button 
                    onClick={() => setSelectedStudents([])}
                    className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    مسح القائمة
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                {selectedStudents.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 italic">
                    <p className="mb-1">لا يوجد تلاميذ في القائمة حالياً.</p>
                  </div>
                ) : (
                  selectedStudents.map((student, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-200 transition-all group animate-in slide-in-from-right-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {student.name[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-700">{student.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleStatus(student.name)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                            student.status === 'absent' 
                            ? 'bg-red-50 text-red-600 border border-red-100' 
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}
                        >
                          {student.status === 'absent' ? 'غائب' : 'متأخر'}
                        </button>
                        <button 
                          onClick={() => removeStudent(student.name)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-50 rounded-full -ml-16 -mt-16 opacity-50 pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-500" />
                  إرسال التقرير النهائي
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase">ملاحظات التقرير للمراقب</label>
                  <button 
                    onClick={handleAiGenerate}
                    disabled={isGenerating || selectedStudents.length === 0}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 transition-all disabled:opacity-30"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isGenerating ? 'جاري الصياغة...' : 'مسودة ذكية'}
                  </button>
                </div>

                <textarea
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  placeholder="اكتب رسالة للمراقبين أو استخدم الذكاء الاصطناعي لصياغة التقرير..."
                  className="w-full h-40 p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none outline-none leading-relaxed"
                />

                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || selectedStudents.length === 0}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold transition-all shadow-lg ${
                    isSubmitting || selectedStudents.length === 0 
                    ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200 active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      إرسال للمراقبين فوراً
                    </>
                  )}
                </button>

                {showSuccess && (
                  <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-xl text-sm font-black border border-green-200 animate-in fade-in zoom-in">
                    <CheckCircle2 className="w-5 h-5" />
                    تم إرسال تقرير الغياب بنجاح!
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 mt-2">
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
              <p className="text-[10px] text-blue-700 leading-relaxed font-bold">
                بمجرد الضغط على إرسال، ستظهر الأسماء فوراً في لوحة التحكم الخاصة بالمراقب العام بشكل حي.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeacherView;