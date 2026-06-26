export const MASTER_DEPARTMENTS = [
  // Computing & IT
  { id: 1, name: 'Computer Science and Engineering', abbr: 'CSE', category: 'Computing & IT' },
  { id: 2, name: 'Information Technology', abbr: 'IT', category: 'Computing & IT' },
  { id: 3, name: 'Artificial Intelligence and Machine Learning', abbr: 'AI & ML', category: 'Computing & IT' },
  { id: 4, name: 'Data Science', abbr: 'DS', category: 'Computing & IT' },
  { id: 5, name: 'Cyber Security', abbr: 'CS', category: 'Computing & IT' },

  // Core Engineering
  { id: 6, name: 'Mechanical Engineering', abbr: 'ME', category: 'Core Engineering' },
  { id: 7, name: 'Civil Engineering', abbr: 'CE', category: 'Core Engineering' },
  { id: 8, name: 'Electrical and Electronics Engineering', abbr: 'EEE', category: 'Core Engineering' },
  { id: 9, name: 'Electronics and Communication Engineering', abbr: 'ECE', category: 'Core Engineering' },
  { id: 10, name: 'Chemical Engineering', abbr: 'ChemE', category: 'Core Engineering' },

  // Specialised Technology
  { id: 11, name: 'Aerospace Engineering', abbr: 'AE', category: 'Specialised Technology' },
  { id: 12, name: 'Biomedical Engineering', abbr: 'BME', category: 'Specialised Technology' },
  { id: 13, name: 'Biotechnology', abbr: 'BT', category: 'Specialised Technology' },
  { id: 14, name: 'Mechatronics Engineering', abbr: 'MTE', category: 'Specialised Technology' },
  { id: 15, name: 'Automobile Engineering', abbr: 'AutoE', category: 'Specialised Technology' },
  { id: 16, name: 'Agricultural Engineering', abbr: 'AgE', category: 'Specialised Technology' },
  { id: 17, name: 'Marine Engineering', abbr: 'MarE', category: 'Specialised Technology' },
  { id: 18, name: 'Textile Technology', abbr: 'TT', category: 'Specialised Technology' },

  // Foundational Sciences & Humanities
  { id: 19, name: 'Applied Sciences and Humanities', abbr: 'ASH', category: 'Foundational Sciences & Humanities' },
  { id: 20, name: 'Mathematics', abbr: 'Math', category: 'Foundational Sciences & Humanities' },
  { id: 21, name: 'Physics', abbr: 'Phy', category: 'Foundational Sciences & Humanities' },
  { id: 22, name: 'Chemistry', abbr: 'Chem', category: 'Foundational Sciences & Humanities' }
];

export const getDepartmentById = (id) => MASTER_DEPARTMENTS.find(d => d.id === parseInt(id));
export const getDepartmentAbbr = (id) => getDepartmentById(id)?.abbr || '';
export const getDepartmentName = (id) => getDepartmentById(id)?.name || '';
