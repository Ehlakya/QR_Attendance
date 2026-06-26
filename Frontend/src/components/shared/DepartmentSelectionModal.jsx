import { useState } from 'react';
import { Search, X, Check, Building2, Cpu, Wrench, Microscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { MASTER_DEPARTMENTS } from '../../constants/departments';

// Map icons dynamically based on category
const DEPARTMENTS = MASTER_DEPARTMENTS.map(dept => {
  let icon = Cpu;
  if (dept.category === 'Core Engineering' || dept.category === 'Specialised Technology') {
    icon = Wrench;
  }
  if (dept.category === 'Foundational Sciences & Humanities' || dept.abbr === 'BME' || dept.abbr === 'BT') {
    icon = Microscope;
  }
  return { ...dept, icon };
});

const CATEGORIES = [...new Set(DEPARTMENTS.map(d => d.category))];

const DepartmentSelectionModal = ({ isOpen, onClose, selectedIds, onConfirm, multiple = true }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [tempSelection, setTempSelection] = useState(selectedIds || []);

  if (!isOpen) return null;

  const toggleSelection = (id) => {
    if (multiple) {
      if (tempSelection.includes(id)) {
        setTempSelection(tempSelection.filter(item => item !== id));
      } else {
        setTempSelection([...tempSelection, id]);
      }
    } else {
      setTempSelection([id]);
    }
  };

  const handleConfirm = () => {
    onConfirm(tempSelection);
    onClose();
  };

  const filteredDepts = DEPARTMENTS.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dept.abbr.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'All') return matchesSearch;
    if (activeFilter === 'Engineering') return matchesSearch && ['Computing & IT', 'Core Engineering', 'Specialised Technology'].includes(dept.category);
    if (activeFilter === 'Science') return matchesSearch && dept.category === 'Foundational Sciences';
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-background/50">
          <div>
            <h2 className="text-2xl font-bold text-textPrimary">Select Departments</h2>
            <p className="text-textSecondary text-sm mt-1">Choose one or more departments to assign</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-danger/10 hover:text-danger transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Top Bar: Search & Filters */}
        <div className="p-4 border-b border-border bg-background flex flex-col sm:flex-row gap-4 justify-between items-center sticky top-0 z-10">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search CSE, IT, Mechanical..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary/50 outline-none text-textPrimary"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {['All', 'Engineering', 'Science'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                  activeFilter === filter ? 'bg-primary text-white shadow-md' : 'bg-background border border-border text-textSecondary hover:bg-border'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-background/30">
          {CATEGORIES.map(category => {
            const categoryDepts = filteredDepts.filter(d => d.category === category);
            if (categoryDepts.length === 0) return null;

            return (
              <div key={category} className="mb-8">
                <h3 className="text-lg font-bold text-textSecondary mb-4 pb-2 border-b border-border">{category}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {categoryDepts.map(dept => {
                      const isSelected = tempSelection.includes(dept.id);
                      const Icon = dept.icon;
                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          key={dept.id}
                          onClick={() => toggleSelection(dept.id)}
                          className={`cursor-pointer group relative overflow-hidden rounded-xl border-2 transition-all p-4 h-32 flex flex-col justify-between ${
                            isSelected 
                              ? 'border-primary bg-primary/5 shadow-md' 
                              : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20 text-primary' : 'bg-background text-textSecondary group-hover:text-primary group-hover:bg-primary/10'} transition-colors`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-primary border-primary text-white' : 'border-textSecondary/50'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 font-bold" />}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                              {dept.abbr}
                            </span>
                            <h4 className={`text-sm font-semibold mt-1 leading-tight line-clamp-2 ${isSelected ? 'text-textPrimary' : 'text-textSecondary group-hover:text-textPrimary'}`}>
                              {dept.name}
                            </h4>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
          {filteredDepts.length === 0 && (
            <div className="text-center py-20 text-textSecondary">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl font-semibold">No departments found.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card flex justify-between items-center">
          <div className="text-sm font-semibold text-textSecondary">
            <span className="text-primary font-bold text-lg">{tempSelection.length}</span> department{tempSelection.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button 
              onClick={handleConfirm} 
              disabled={tempSelection.length === 0 && multiple}
              className="btn-primary flex items-center gap-2"
            >
              <Check className="w-5 h-5" /> Confirm Selection
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export { DepartmentSelectionModal, DEPARTMENTS };
