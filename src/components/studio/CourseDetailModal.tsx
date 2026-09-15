import React, { useState } from 'react';
import { X, Folder, FileText, ChevronRight, Search, Copy, Check, Calendar, Clock, Tag } from 'lucide-react';
import { CourseFolder, NoteItem } from '../../types/studio';

interface CourseDetailModalProps {
  course: CourseFolder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({ course, isOpen, onClose }) => {
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(course?.notes[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync selected note when course changes
  React.useEffect(() => {
    if (course && course.notes.length > 0) {
      setSelectedNote(course.notes[0]);
    }
  }, [course]);

  if (!isOpen || !course) return null;

  const filteredNotes = course.notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const copyCode = (code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-5xl h-[88vh] flex flex-col rounded-3xl border border-white/20 shadow-2xl text-white overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 43, 0.96) 0%, rgba(10, 15, 30, 0.98) 100%)',
          backdropFilter: 'blur(35px)',
          WebkitBackdropFilter: 'blur(35px)',
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <span
              className="p-2.5 rounded-2xl border text-white font-mono font-bold text-sm"
              style={{
                backgroundColor: `${course.color}25`,
                borderColor: `${course.color}50`,
                color: course.color,
              }}
            >
              {course.number}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  {course.code}
                </span>
                <span className="text-xs text-slate-400">Instructor: {course.instructor}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{course.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Notes Sidebar */}
          <div className="w-full md:w-80 border-r border-white/10 flex flex-col bg-black/20">
            {/* Search */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search in ${course.title}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Note count banner */}
            <div className="px-4 py-2 text-[11px] font-medium text-slate-400 bg-white/5 flex justify-between">
              <span>{filteredNotes.length} notes found</span>
              <span>{course.progress}% finished</span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredNotes.map((note) => {
                const isSelected = selectedNote?.id === note.id;
                return (
                  <button
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-blue-600/30 border border-blue-400/40 text-white'
                        : 'hover:bg-white/5 border border-transparent text-slate-300'
                    }`}
                  >
                    <FileText className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-white truncate">{note.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{note.summary}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                        <span>{note.lastEdited}</span>
                        <span>•</span>
                        <span>{note.readTime}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 mt-1 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note Reader Body */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-8 space-y-6">
            {selectedNote ? (
              <>
                {/* Note Meta Header */}
                <div className="space-y-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Updated {selectedNote.lastEdited}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {selectedNote.readTime} read
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    {selectedNote.title}
                  </h1>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal">
                    {selectedNote.summary}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedNote.tags.map((t, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-cyan-500/15 border border-cyan-400/25 text-cyan-300 flex items-center gap-1"
                      >
                        <Tag className="w-3 h-3" /> {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Main Content Body */}
                <div className="prose prose-invert max-w-none text-sm leading-relaxed text-slate-200 whitespace-pre-line">
                  {selectedNote.content}
                </div>

                {/* Interactive Code Snippet */}
                {selectedNote.codeSnippet && (
                  <div className="rounded-2xl bg-black/60 border border-white/15 overflow-hidden shadow-xl mt-4">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10 text-xs text-slate-400">
                      <span className="font-mono uppercase tracking-wider text-cyan-400">
                        {selectedNote.codeLanguage || 'code'}
                      </span>
                      <button
                        onClick={() => copyCode(selectedNote.codeSnippet)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all text-xs font-medium"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy Code'}
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                      <code>{selectedNote.codeSnippet}</code>
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <FileText className="w-12 h-12 stroke-1 text-slate-600 mb-2" />
                <p>Select a note from the left to read.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
