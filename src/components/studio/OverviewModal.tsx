import React from 'react';
import { X, Flame, Award, Clock, BookOpen, BarChart2, CheckCircle2, TrendingUp } from 'lucide-react';
import { COURSES_DATA } from '../../data/coursesData';

interface OverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPomodoro?: () => void;
  onOpenStudyHub?: () => void;
}

export const OverviewModal: React.FC<OverviewModalProps> = ({
  isOpen,
  onClose,
  onOpenPomodoro,
  onOpenStudyHub,
}) => {
  if (!isOpen) return null;

  const totalNotes = COURSES_DATA.reduce((acc, c) => acc + c.noteCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-3xl rounded-3xl border border-white/20 shadow-2xl text-white overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 24, 45, 0.95) 0%, rgba(13, 17, 35, 0.98) 100%)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400">
              <BarChart2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Study Tools & Progress</h2>
              <p className="text-xs text-slate-400">Holistic overview of your learning velocity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                <BookOpen className="w-4 h-4" /> Total Notes
              </div>
              <p className="text-2xl font-bold text-white">{totalNotes}</p>
              <p className="text-[11px] text-slate-400">Across 3 courses</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <Flame className="w-4 h-4" /> Daily Streak
              </div>
              <p className="text-2xl font-bold text-white">5 Days</p>
              <p className="text-[11px] text-emerald-400 font-medium">+2 days from last week</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold">
                <Clock className="w-4 h-4" /> Study Hours
              </div>
              <p className="text-2xl font-bold text-white">34.5 hrs</p>
              <p className="text-[11px] text-slate-400">This month</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <Award className="w-4 h-4" /> Mastery Level
              </div>
              <p className="text-2xl font-bold text-white">Advanced</p>
              <p className="text-[11px] text-slate-400">Top 5% cohort</p>
            </div>
          </div>

          {/* Course Mastery Progress Bars */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> Active Course Mastery
              </h3>
              <span className="text-xs text-slate-400">Calculated by quiz & notes retention</span>
            </div>

            <div className="space-y-3">
              {COURSES_DATA.map((c) => (
                <div key={c.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-white flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{c.number}</span>
                      {c.title}
                    </span>
                    <span className="text-slate-300 font-semibold">{c.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${c.progress}%`,
                        backgroundColor: c.color,
                        boxShadow: `0 0 10px ${c.color}80`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Study Tools Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => {
                onClose();
                onOpenStudyHub?.();
              }}
              className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 to-blue-800/20 border border-blue-400/30 hover:border-blue-400/60 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold">
                  <BookOpen className="w-4 h-4" /> Study Hub
                </div>
                <p className="text-sm font-bold text-white">CS50 Video Lectures</p>
                <p className="text-xs text-slate-400">9 recorded modules available</p>
              </div>
              <span className="px-3 py-1 text-xs rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Open →
              </span>
            </div>

            <div
              onClick={() => {
                onClose();
                onOpenPomodoro?.();
              }}
              className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 to-purple-800/20 border border-purple-400/30 hover:border-purple-400/60 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold">
                  <Clock className="w-4 h-4" /> Focus Timer
                </div>
                <p className="text-sm font-bold text-white">25-minute Pomodoro</p>
                <p className="text-xs text-slate-400">Boost cognitive concentration</p>
              </div>
              <span className="px-3 py-1 text-xs rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
                Launch →
              </span>
            </div>
          </div>

          {/* Weekly Learning Habits Checklist */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Weekly Learning Goals
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Complete CS50 Python Lecture 2 & Practice Problems</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Review Mobile Application Skia Shader architecture notes</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-4 h-4 rounded-full border border-slate-500" />
                <span>Publish 2 technical summaries to Web Development & Three.js</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
