import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Bell, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface PomodoroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PomodoroModal: React.FC<PomodoroModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(2);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Time durations in seconds
  const durations = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  const setTimerMode = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(durations[newMode]);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (mode === 'work') {
        setSessionsCompleted((prev) => prev + 1);
        setTimerMode('shortBreak');
      } else {
        setTimerMode('work');
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, mode]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalDuration = durations[mode];
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md p-6 rounded-3xl border border-white/20 shadow-2xl text-white overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-lg text-white">Focus Pomodoro</h3>
              <p className="text-xs text-slate-400">Session {sessionsCompleted + 1} of 4</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
              title={soundEnabled ? 'Mute' : 'Enable Sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex p-1 mb-8 rounded-2xl bg-white/5 border border-white/10">
          <button
            onClick={() => setTimerMode('work')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === 'work'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Focus (25m)
          </button>
          <button
            onClick={() => setTimerMode('shortBreak')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === 'shortBreak'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Short Break (5m)
          </button>
          <button
            onClick={() => setTimerMode('longBreak')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === 'longBreak'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Long Break (15m)
          </button>
        </div>

        {/* Circular Display */}
        <div className="relative flex flex-col items-center justify-center my-4">
          <div className="relative w-56 h-56 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="96"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="112"
                cy="112"
                r="96"
                stroke={mode === 'work' ? '#3b82f6' : '#a855f7'}
                strokeWidth="10"
                fill="none"
                strokeDasharray="603"
                strokeDashoffset={603 - (603 * progressPercent) / 100}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>

            {/* Centered Timer Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold tracking-tight text-white font-mono">
                {formattedTime}
              </span>
              <span className="text-xs uppercase tracking-wider text-slate-400 mt-2 font-medium">
                {mode === 'work' ? 'Deep Work' : 'Rest & Recharge'}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(durations[mode]);
            }}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 transition-all active:scale-95 border border-white/10"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" /> Start Focus
              </>
            )}
          </button>
        </div>

        {/* Quick hint */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Tip: Stay hydrated and maintain eye ergonomics during study blocks.
        </div>
      </div>
    </div>
  );
};
