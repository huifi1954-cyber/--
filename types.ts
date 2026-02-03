
export enum UserRole {
  TEACHER = 'TEACHER',
  SUPERVISOR = 'SUPERVISOR'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  schoolCode: string; // الرمز السري للمدرسة لربط الهواتف
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  status: 'present' | 'absent' | 'late';
}

export interface AbsenceRecord {
  id: string;
  date: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  reason: 'absent' | 'late';
  messageToSupervisor?: string;
}
