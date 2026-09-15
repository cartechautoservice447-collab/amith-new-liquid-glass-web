import React from 'react';
import { Home, LayoutGrid, Folder, FileText, Sparkles, Layers } from 'lucide-react';

export type DockTab = 'home' | 'courses' | 'collections' | 'notes' | 'more';

interface StudioBottomDockProps {
  activeTab: DockTab;
  onSelectTab: (tab: DockTab) => void;
  onReturnToClassic: () => void;
  dockRef?: React.Ref<HTMLElement>;
}

export const StudioBottomDock: React.FC<StudioBottomDockProps> = ({
  activeTab,
  onSelectTab,
  onReturnToClassic,
  dockRef,
}) => {
  return (
    <nav
      ref={dockRef}
      id="studio-bottom-dock"
      aria-label="Studio Navigation Dock"
      className="fixed bottom-7 left-1/2 -translate-x-1/2 z-40 select-none flex items-center gap-2 p-2 rounded-[32px] shadow-2xl transition-all duration-300 pointer-events-auto backdrop-blur-xl"
      style={{
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        boxShadow:
          '0 30px 60px -12px rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.45)',
      }}
    >
      {/* Home Button */}
      <button
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center justify-center px-4 sm:px-5 py-2.5 rounded-[24px] transition-all duration-200 cursor-pointer min-w-[62px] ${
          activeTab === 'home'
            ? 'bg-white/20 border border-white/30 text-white shadow-lg scale-[1.03]'
            : 'text-slate-300 hover:text-white hover:bg-white/10'
        }`}
      >
        <Home className="w-4 h-4 mb-1" />
        <span className="text-[10px] font-bold tracking-tight">Home</span>
      </button>

      {/* Courses Button */}
      <button
        onClick={() => onSelectTab('courses')}
        className={`flex flex-col items-center justify-center px-4 sm:px-5 py-2.5 rounded-[24px] transition-all duration-200 cursor-pointer min-w-[62px] ${
          activeTab === 'courses'
            ? 'bg-white/20 border border-white/30 text-white shadow-lg scale-[1.03]'
            : 'text-slate-300 hover:text-white hover:bg-white/10'
        }`}
      >
        <LayoutGrid className="w-4 h-4 mb-1" />
        <span className="text-[10px] font-bold tracking-tight">Courses</span>
      </button>

      {/* Collections Button */}
      <button
        onClick={() => onSelectTab('collections')}
        className={`flex flex-col items-center justify-center px-4 sm:px-5 py-2.5 rounded-[24px] transition-all duration-200 cursor-pointer min-w-[62px] ${
          activeTab === 'collections'
            ? 'bg-white/20 border border-white/30 text-white shadow-lg scale-[1.03]'
            : 'text-slate-300 hover:text-white hover:bg-white/10'
        }`}
      >
        <Folder className="w-4 h-4 mb-1" />
        <span className="text-[10px] font-bold tracking-tight">Collections</span>
      </button>

      {/* Notes Button */}
      <button
        onClick={() => onSelectTab('notes')}
        className={`flex flex-col items-center justify-center px-4 sm:px-5 py-2.5 rounded-[24px] transition-all duration-200 cursor-pointer min-w-[62px] ${
          activeTab === 'notes'
            ? 'bg-white/20 border border-white/30 text-white shadow-lg scale-[1.03]'
            : 'text-slate-300 hover:text-white hover:bg-white/10'
        }`}
      >
        <FileText className="w-4 h-4 mb-1" />
        <span className="text-[10px] font-bold tracking-tight">Notes</span>
      </button>

      {/* More Button */}
      <button
        onClick={() => onSelectTab('more')}
        className={`flex flex-col items-center justify-center px-4 sm:px-5 py-2.5 rounded-[24px] transition-all duration-200 cursor-pointer min-w-[62px] ${
          activeTab === 'more'
            ? 'bg-white/20 border border-white/30 text-white shadow-lg scale-[1.03]'
            : 'text-slate-300 hover:text-white hover:bg-white/10'
        }`}
      >
        <Sparkles className="w-4 h-4 mb-1 text-cyan-300" />
        <span className="text-[10px] font-bold tracking-tight">More</span>
      </button>

      {/* Subtle Divider with clean vertical margin */}
      <div className="h-8 w-[1px] bg-white/20 mx-1.5" />

      {/* Return to Classic View Button */}
      <button
        onClick={onReturnToClassic}
        className="flex flex-col items-center justify-center px-4 sm:px-5 py-2.5 rounded-[24px] text-blue-200 hover:text-white bg-blue-600/20 hover:bg-blue-600/35 border border-blue-400/30 transition-all duration-200 cursor-pointer min-w-[62px] shadow-sm"
        title="Return to Classic View"
        id="btn-return-classic-dock"
      >
        <Layers className="w-4 h-4 mb-1 text-blue-300" />
        <span className="text-[10px] font-bold tracking-tight">Classic</span>
      </button>
    </nav>
  );
};
