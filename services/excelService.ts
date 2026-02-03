
// Assuming XLSX is loaded via script tag in index.html
declare var XLSX: any;

/**
 * Exports data to a standard Excel file format.
 */
export const exportToExcel = (data: any[], fileName: string = 'Absence_Report.xlsx') => {
  if (typeof XLSX === 'undefined') {
    alert('Excel library not loaded. Please check your internet connection.');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Absences");
  
  // High quality output
  XLSX.writeFile(workbook, fileName);
};

/**
 * Parses an uploaded Excel file and extracts student names.
 */
export const parseExcelForStudents = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        // Try to find columns like "Name", "Student", or "Student Name"
        const names = json.map(row => {
          const possibleKeys = ['name', 'student', 'student name', 'اسم التلميذ', 'الاسم'];
          const key = Object.keys(row).find(k => possibleKeys.includes(k.toLowerCase()));
          return key ? String(row[key]) : String(Object.values(row)[0]);
        }).filter(n => n && n !== 'undefined');
        
        resolve(names);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};
