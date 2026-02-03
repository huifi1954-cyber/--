import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserRole, AbsenceRecord, User } from './types.ts';
import Layout from './components/Layout.tsx';
import TeacherView from './components/TeacherView.tsx';
import SupervisorView from './components/SupervisorView.tsx';
import Auth from './components/Auth.tsx';
import { OnlineService } from './services/onlineService.ts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const recordsMapRef = useRef<Map<string, AbsenceRecord>>(new Map());

  useEffect(() => {
    const savedUser = localStorage.getItem('edu_current_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.schoolCode) return;

    OnlineService.subscribeToRecords(currentUser.schoolCode, (newChunks: any[]) => {
      newChunks.forEach(chunk => {
        if (chunk._deleted) {
          recordsMapRef.current.delete(chunk.id);
        } else if (chunk.id && chunk.studentName) {
          recordsMapRef.current.set(chunk.id, chunk as AbsenceRecord);
        }
      });

      const updatedList: AbsenceRecord[] = Array.from(recordsMapRef.current.values());
      updatedList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecords([...updatedList]);
    });
  }, [currentUser?.schoolCode]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('edu_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('edu_current_user');
    recordsMapRef.current.clear();
    setRecords([]);
  };

  const handleRecordAbsences = (newRecords: AbsenceRecord[]) => {
    if (!currentUser) return;
    newRecords.forEach(record => {
      OnlineService.saveRecord(currentUser.schoolCode, record);
    });
  };

  const handleDeleteRecord = useCallback((id: string) => {
    if (!currentUser) return;
    OnlineService.deleteRecord(currentUser.schoolCode, id);
  }, [currentUser]);

  const handleClearAllRecords = useCallback(() => {
    if (!currentUser || records.length === 0) return;
    records.forEach(r => {
      OnlineService.deleteRecord(currentUser.schoolCode, r.id);
    });
  }, [currentUser, records]);

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Layout 
      role={currentUser.role} 
      onRoleChange={() => {}} 
      userName={currentUser.name}
      onLogout={handleLogout}
    >
      <div className="mb-4 flex items-center gap-2 p-3 bg-white rounded-2xl border border-blue-100 shadow-sm md:hidden">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-black text-slate-400 uppercase">المدرسة: </span>
        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg">{currentUser.schoolCode}</span>
      </div>

      {currentUser.role === UserRole.TEACHER ? (
        <TeacherView 
          currentUser={currentUser} 
          onRecordAbsences={handleRecordAbsences} 
        />
      ) : (
        <SupervisorView 
          records={records} 
          onDeleteRecord={handleDeleteRecord}
          onClearAll={handleClearAllRecords}
        />
      )}
    </Layout>
  );
};

export default App;