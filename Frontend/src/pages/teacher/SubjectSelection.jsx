import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { Search, Loader2, CheckSquare, BookOpen, Beaker, MessageCircle, Save, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PREDEFINED_SUBJECTS = [
  // Theory
  { id: 't1', name: 'Engineering Mathematics-I', type: 'Theory' },
  { id: 't2', name: 'Programming for Problem Solving (C / Python)', type: 'Theory' },
  { id: 't3', name: 'Engineering Physics', type: 'Theory' },
  { id: 't4', name: 'Engineering Chemistry', type: 'Theory' },
  { id: 't5', name: 'Basic Electrical and Electronics Engineering', type: 'Theory' },
  { id: 't6', name: 'Engineering Graphics and Design', type: 'Theory' },
  // Lab
  { id: 'l1', name: 'Programming Laboratory', type: 'Lab' },
  { id: 'l2', name: 'Physics / Chemistry Laboratory', type: 'Lab' },
  { id: 'l3', name: 'Engineering Workshop Practice', type: 'Lab' },
  // Skill
  { id: 's1', name: 'Technical English / Communication Skills', type: 'Skill' },
  { id: 's2', name: 'Environmental Sciences', type: 'Skill' },
];

const getIconForType = (type) => {
  switch(type) {
    case 'Theory': return <BookOpen className="w-5 h-5 text-primary" />;
    case 'Lab': return <Beaker className="w-5 h-5 text-warning" />;
    case 'Skill': return <MessageCircle className="w-5 h-5 text-success" />;
    default: return <BookOpen className="w-5 h-5 text-primary" />;
  }
};

const getBadgeBg = (type) => {
  switch(type) {
    case 'Theory': return 'bg-primary/10 text-primary border-primary/20';
    case 'Lab': return 'bg-warning/10 text-warning border-warning/20';
    case 'Skill': return 'bg-success/10 text-success border-success/20';
    default: return 'bg-primary/10 text-primary border-primary/20';
  }
};

const SubjectSelection = () => {
  const { token, user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  
  const [assignmentData, setAssignmentData] = useState({
    semester: '1',
    sectionId: ''
  });
  
  const [sections, setSections] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSections();
  }, [token]);

  const fetchSections = async () => {
    try {
      // Fetch sections for the teacher's department (Mock logic or actual logic based on API)
      const res = await axios.get(`http://localhost:5000/api/v1/sections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSections(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch sections', error);
      // Fallback dummy sections for UI testing if endpoint fails
      setSections([{ id: 'sec-a', name: 'A' }, { id: 'sec-b', name: 'B' }]);
    }
  };

  const filteredSubjects = PREDEFINED_SUBJECTS.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSubject = (subject) => {
    setError('');
    const isSelected = selectedSubjects.some(s => s.id === subject.id);
    if (isSelected) {
      setSelectedSubjects(selectedSubjects.filter(s => s.id !== subject.id));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const handleSave = async () => {
    setError('');
    setSaveSuccess(false);

    if (selectedSubjects.length === 0) {
      setError('At least one subject must be selected.');
      return;
    }

    setIsSaving(true);
    try {
      await axios.post('http://localhost:5000/api/v1/teachers/subjects', {
        subjects: selectedSubjects,
        semester: parseInt(assignmentData.semester),
        sectionId: assignmentData.sectionId || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setSelectedSubjects([]); // Clear selection after save
    } catch (err) {
      console.error('Failed to save subjects', err);
      setError(err.response?.data?.message || 'Failed to save subject assignments.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-textPrimary">Subject Management</h2>
          <p className="text-textSecondary mt-1 font-medium">Select and assign subjects to your classes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Panel: Subject Library */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-card shadow-sm h-full flex flex-col">
            <CardHeader className="border-b border-border bg-background/50 pb-4">
              <CardTitle>Subject Library</CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search subjects by name or type..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:bg-background text-textPrimary transition-colors outline-none focus:ring-2 focus:ring-primary/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[600px] bg-background/20">
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filteredSubjects.map(subject => {
                    const isSelected = selectedSubjects.some(s => s.id === subject.id);
                    return (
                      <motion.div
                        key={subject.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleSubject(subject)}
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 ${
                          isSelected 
                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                            : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
                        }`}
                      >
                        <div className={`mt-1 w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${
                          isSelected ? 'bg-primary border-primary text-white' : 'border-textSecondary/30 bg-background'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 font-bold" />}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getIconForType(subject.type)}
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getBadgeBg(subject.type)}`}>
                              {subject.type}
                            </span>
                          </div>
                          <h4 className={`font-semibold ${isSelected ? 'text-primary' : 'text-textPrimary'} leading-snug`}>
                            {subject.name}
                          </h4>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
                {filteredSubjects.length === 0 && (
                  <div className="col-span-full py-10 text-center text-textSecondary font-medium">
                    No subjects found matching your search.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Assignment Preview & Actions */}
        <div className="space-y-6">
          <Card className="border-border bg-card shadow-md sticky top-6">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-6 h-6 text-primary" />
                <CardTitle className="text-primary">Assignment Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Selected Subjects List */}
              <div>
                <h4 className="text-sm font-bold text-textSecondary uppercase tracking-wider mb-3">
                  Selected Subjects ({selectedSubjects.length})
                </h4>
                {selectedSubjects.length === 0 ? (
                  <div className="p-4 rounded-lg bg-background border border-dashed border-border text-center text-textSecondary text-sm font-medium">
                    Select subjects from the library to assign.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence>
                      {selectedSubjects.map(subject => (
                        <motion.div 
                          key={subject.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-background border border-border text-sm"
                        >
                          {getIconForType(subject.type)}
                          <span className="font-semibold text-textPrimary truncate">{subject.name}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Assignment Targets */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <label className="block text-sm font-semibold text-textSecondary mb-1.5">Target Semester</label>
                  <select 
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-textPrimary focus:ring-2 focus:ring-primary/50 outline-none"
                    value={assignmentData.semester}
                    onChange={(e) => setAssignmentData({...assignmentData, semester: e.target.value})}
                  >
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-textSecondary mb-1.5">Target Section (Optional)</label>
                  <select 
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-textPrimary focus:ring-2 focus:ring-primary/50 outline-none"
                    value={assignmentData.sectionId}
                    onChange={(e) => setAssignmentData({...assignmentData, sectionId: e.target.value})}
                  >
                    <option value="">All Sections</option>
                    {sections.map(sec => (
                      <option key={sec.id} value={sec.id}>Section {sec.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error/Success Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </motion.div>
                )}
                {saveSuccess && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Subjects assigned successfully!
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving || selectedSubjects.length === 0}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-bold text-lg shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSaving ? 'Saving...' : 'Save Assignment'}
              </button>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default SubjectSelection;
