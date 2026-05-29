import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import ZenvoraBackground from '../components/ZenvoraBackground';
import {
  ChevronLeft, ChevronRight, Calendar as CalIcon,
  Plus, Clock, Trash2, X, CheckCircle2, Lock
} from 'lucide-react';

// ─── Color palette for blocks ───────────────────────────────────────────────
const BLOCK_COLORS = [
  { bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-800', dot: 'bg-violet-400' },
  { bg: 'bg-sky-100',    border: 'border-sky-300',    text: 'text-sky-800',    dot: 'bg-sky-400'    },
  { bg: 'bg-emerald-100',border: 'border-emerald-300',text: 'text-emerald-800',dot: 'bg-emerald-400'},
  { bg: 'bg-amber-100',  border: 'border-amber-300',  text: 'text-amber-800',  dot: 'bg-amber-400'  },
  { bg: 'bg-rose-100',   border: 'border-rose-300',   text: 'text-rose-800',   dot: 'bg-rose-400'   },
  { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-800', dot: 'bg-indigo-400' },
];

const STORAGE_KEY = 'zenvora_calendar_schedule_v1';

const loadSchedule = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
};
const saveSchedule = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// ─── Format "09:00" → 9.0 (float hour) ─────────────────────────────────────
const timeToFloat = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
};

// ─── 24h ↔ 12h AM/PM helpers ─────────────────────────────────────────────────
const to12h = (time24) => {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour: String(hour12), minute: String(m).padStart(2, '0'), period };
};

const to24h = (hour, minute, period) => {
  let h = parseInt(hour, 10);
  if (period === 'AM') { if (h === 12) h = 0; }
  else                 { if (h !== 12) h += 12; }
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

// ─── Custom AM/PM Time Picker component ──────────────────────────────────────
const TimePicker = ({ value, onChange }) => {
  const { hour, minute, period } = to12h(value);

  const update = (h, m, p) => onChange(to24h(h, m, p));

  const selectCls =
    'bg-purple-50/40 border border-purple-100 rounded-lg text-sm font-semibold text-slate-700 ' +
    'focus:outline-none focus:border-zenvora-400 focus:ring-2 focus:ring-purple-100 cursor-pointer';

  return (
    <div className="flex items-center gap-1.5">
      {/* Hour */}
      <select
        value={hour}
        onChange={e => update(e.target.value, minute, period)}
        className={`${selectCls} py-2 pl-2 pr-1`}
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
          <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
        ))}
      </select>

      <span className="text-slate-400 font-bold text-sm">:</span>

      {/* Minute */}
      <select
        value={minute}
        onChange={e => update(hour, e.target.value, period)}
        className={`${selectCls} py-2 pl-2 pr-1`}
      >
        {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      {/* AM / PM toggle */}
      <div className="flex rounded-lg overflow-hidden border border-purple-100">
        {['AM','PM'].map(p => (
          <button
            key={p}
            type="button"
            onClick={() => update(hour, minute, p)}
            className={`px-2.5 py-2 text-xs font-bold transition-colors ${
              period === p
                ? 'bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white'
                : 'bg-purple-50/40 text-slate-500 hover:bg-purple-100'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};

const CalendarPage = () => {
  const { token, API_HOST } = useAuth();

  const [tasks, setTasks]               = useState([]);
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [selectedDay, setSelectedDay]   = useState(null);     // { year, month, day }
  const [schedule, setSchedule]         = useState(loadSchedule); // { 'YYYY-MM-DD': [{ id, startTime, endTime, label, colorIdx }] }

  // Add-block modal state
  const [showModal, setShowModal]       = useState(false);
  const [startTime, setStartTime]       = useState('09:00');
  const [endTime, setEndTime]           = useState('10:00');
  const [label, setLabel]               = useState('');
  const [colorIdx, setColorIdx]         = useState(0);
  const [modalError, setModalError]     = useState('');

  // Load API tasks for dot markers
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_HOST}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setTasks(await res.json());
      } catch { /* offline ok */ }
    };
    load();
  }, [token]);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays     = new Date(year, month + 1, 0).getDate();

  const dayCells = [];
  for (let i = 0; i < firstDayIndex; i++) dayCells.push(null);
  for (let i = 1; i <= totalDays; i++)    dayCells.push(i);

  const toKey = (y, m, d) => `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const selectedKey = selectedDay
    ? toKey(selectedDay.year, selectedDay.month, selectedDay.day)
    : null;

  const blocksForDay = selectedKey ? (schedule[selectedKey] || []) : [];

  // ── Add a new time block ──────────────────────────────────────────────────
  const handleAddBlock = () => {
    setModalError('');
    if (!label.trim()) { setModalError('Please enter a task name.'); return; }
    if (timeToFloat(startTime) >= timeToFloat(endTime)) {
      setModalError('End time must be after start time.');
      return;
    }

    const newBlock = {
      id: Date.now().toString(),
      startTime,
      endTime,
      label: label.trim(),
      colorIdx
    };

    const updated = {
      ...schedule,
      [selectedKey]: [...(schedule[selectedKey] || []), newBlock].sort(
        (a, b) => timeToFloat(a.startTime) - timeToFloat(b.startTime)
      )
    };

    setSchedule(updated);
    saveSchedule(updated);
    setLabel('');
    setStartTime('09:00');
    setEndTime('10:00');
    setColorIdx((colorIdx + 1) % BLOCK_COLORS.length);
    setShowModal(false);
  };

  // ── Delete a block ────────────────────────────────────────────────────────
  const handleDelete = (blockId) => {
    const updated = {
      ...schedule,
      [selectedKey]: (schedule[selectedKey] || []).filter(b => b.id !== blockId)
    };
    setSchedule(updated);
    saveSchedule(updated);
  };

  // ── Calendar dot: has task OR has scheduled block ─────────────────────────
  const dayHasContent = (day) => {
    const k = toKey(year, month, day);
    const thisDate = new Date(year, month, day);
    const apiTask = tasks.some(t => t.dueDate && new Date(t.dueDate).toDateString() === thisDate.toDateString());
    const sched   = (schedule[k] || []).length > 0;
    return { apiTask, sched };
  };

  const isToday = (day) => {
    const now = new Date();
    return day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
  };

  // A day is "past" if it is strictly before today (ignore time)
  const isPastDay = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(year, month, day);
    return target < today;
  };

  const selectedIsPast = selectedDay ? isPastDay(selectedDay.day) : false;

  const isSelected = (day) =>
    selectedDay && selectedDay.day === day && selectedDay.month === month && selectedDay.year === year;

  // ── Selected day label ────────────────────────────────────────────────────
  const selectedLabel = selectedDay
    ? new Date(selectedDay.year, selectedDay.month, selectedDay.day).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      })
    : null;

  // ── Hours ruler (6 AM → 10 PM) ────────────────────────────────────────────
  const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6..22

  // visual row height per hour (px)
  const HOUR_H = 52;

  return (
    <div className="flex-1 p-6 overflow-y-auto relative h-screen">
      <ZenvoraBackground mode="diagonal" />

      <div className="max-w-6xl mx-auto space-y-6 z-10 relative">

        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Task Calendar</h1>
          <p className="text-slate-400 text-sm mt-1">Click any day to schedule time-blocked tasks</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left: Monthly Calendar ──────────────────────────────────── */}
          <div className="lg:col-span-2 glass-panel p-5 rounded-3xl space-y-4">

            {/* Month nav */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CalIcon className="w-4 h-4 text-zenvora-600" />
                <span className="font-extrabold text-slate-800">{MONTH_NAMES[month]} {year}</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                  className="p-1.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-100 text-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  className="p-1.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-100 text-slate-600 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 text-center">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <div key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {dayCells.map((day, idx) => {
                if (!day) return <div key={`e-${idx}`} />;
                const { apiTask, sched } = dayHasContent(day);
                const today    = isToday(day);
                const selected = isSelected(day);

                return (
                  <button
                    key={`d-${day}`}
                    onClick={() => setSelectedDay({ year, month, day })}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold relative transition-all duration-200
                      ${selected
                        ? 'bg-gradient-to-br from-zenvora-600 to-zenvora-500 text-white shadow-md shadow-purple-200'
                        : today
                          ? 'bg-purple-100 text-zenvora-700 border border-zenvora-300'
                          : isPastDay(day)
                            ? 'bg-transparent text-slate-300 border border-transparent cursor-default'
                            : 'bg-white/50 hover:bg-white text-slate-600 border border-transparent hover:border-purple-100'
                      }`}
                  >
                    {day}
                    {/* Dot indicators */}
                    <div className="flex gap-0.5 absolute bottom-1">
                      {apiTask && <span className="w-1 h-1 rounded-full bg-rose-400" />}
                      {sched   && <span className="w-1 h-1 rounded-full bg-violet-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 pt-1 text-[10px] font-semibold text-slate-400 border-t border-purple-50">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block"/>Due task</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block"/>Scheduled block</span>
            </div>
          </div>

          {/* ── Right: Day Schedule ─────────────────────────────────────── */}
          <div className="lg:col-span-3 glass-panel p-5 rounded-3xl flex flex-col gap-4">

            {!selectedDay ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 gap-3 py-20">
                <CalIcon className="w-12 h-12 text-purple-200" />
                <p className="text-sm font-semibold">Select a day on the calendar<br/>to view and schedule tasks</p>
              </div>
            ) : (
              <>
                {/* Day header + Add button */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">{selectedLabel}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{blocksForDay.length} time block{blocksForDay.length !== 1 ? 's' : ''} scheduled</p>
                  </div>
                  {selectedIsPast ? (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-xs font-bold">
                      <Lock className="w-3.5 h-3.5" />
                      Past date
                    </div>
                  ) : (
                    <button
                      onClick={() => { setShowModal(true); setModalError(''); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white text-xs font-bold shadow-sm hover:shadow-purple-200 hover:shadow-md transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Time Block
                    </button>
                  )}
                </div>

                {/* Past date read-only banner */}
                {selectedIsPast && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    This is a past date. You can view existing blocks but cannot add new ones.
                  </div>
                )}

                {/* Timeline View */}
                {blocksForDay.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 gap-2 py-12 border-2 border-dashed border-purple-100 rounded-2xl">
                    <Clock className="w-8 h-8 text-purple-200" />
                    {selectedIsPast
                      ? <p className="text-xs font-semibold">No tasks were scheduled for this past date.</p>
                      : <p className="text-xs font-semibold">No tasks scheduled for this day.<br/>Click <strong className="text-zenvora-600">Add Time Block</strong> to get started.</p>
                    }
                  </div>
                ) : (
                  <div className="relative overflow-y-auto" style={{ maxHeight: '480px' }}>
                    {/* Hour ruler */}
                    <div className="relative" style={{ height: `${HOURS.length * HOUR_H}px` }}>

                      {/* Hour lines */}
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          className="absolute left-0 right-0 flex items-start"
                          style={{ top: `${(h - 6) * HOUR_H}px` }}
                        >
                          <span className="w-12 text-[10px] font-bold text-slate-300 shrink-0 select-none text-right pr-3">
                            {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
                          </span>
                          <div className="flex-1 border-t border-purple-50 mt-2" />
                        </div>
                      ))}

                      {/* Scheduled blocks */}
                      {blocksForDay.map((block) => {
                        const startF  = timeToFloat(block.startTime);
                        const endF    = timeToFloat(block.endTime);
                        const topPx   = (startF - 6) * HOUR_H;
                        const height  = (endF - startF) * HOUR_H;
                        const color   = BLOCK_COLORS[block.colorIdx % BLOCK_COLORS.length];

                        return (
                          <div
                            key={block.id}
                            className={`absolute left-14 right-2 rounded-xl border px-3 py-2 flex flex-col justify-between group
                              ${color.bg} ${color.border} ${color.text}`}
                            style={{ top: `${topPx + 4}px`, height: `${Math.max(height - 6, 28)}px` }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${color.dot}`} />
                                <span className="font-bold text-xs truncate">{block.label}</span>
                              </div>
                              {!selectedIsPast && (
                                <button
                                  onClick={() => handleDelete(block.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {height >= 36 && (
                              <span className="text-[10px] font-semibold opacity-70">
                                {block.startTime} – {block.endTime}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Compact list below timeline */}
                {blocksForDay.length > 0 && (
                  <div className="space-y-2 border-t border-purple-50 pt-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">All Blocks</p>
                    {blocksForDay.map((block) => {
                      const color = BLOCK_COLORS[block.colorIdx % BLOCK_COLORS.length];
                      return (
                        <div key={block.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border ${color.bg} ${color.border}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${color.text}`} />
                            <span className={`font-bold text-xs truncate ${color.text}`}>{block.label}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-semibold ${color.text} opacity-80`}>
                              {block.startTime} – {block.endTime}
                            </span>
                            {!selectedIsPast && (
                              <button onClick={() => handleDelete(block.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Time Block Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-5 relative border border-purple-100">
            
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-slate-800 text-lg">Schedule a Task</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedLabel}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl hover:bg-purple-50 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Task name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task Name</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddBlock()}
                placeholder="e.g. Coding, Meeting, Gym..."
                className="w-full px-4 py-2.5 rounded-xl border border-purple-100 bg-purple-50/40 text-sm font-semibold text-slate-700 focus:outline-none focus:border-zenvora-400 focus:ring-2 focus:ring-purple-100"
                autoFocus
              />
            </div>

            {/* Time range */}
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Time</label>
                <TimePicker value={startTime} onChange={setStartTime} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Time</label>
                <TimePicker value={endTime} onChange={setEndTime} />
              </div>
            </div>

            {/* Color picker */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Block Color</label>
              <div className="flex gap-2">
                {BLOCK_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setColorIdx(i)}
                    className={`w-7 h-7 rounded-lg border-2 ${c.dot.replace('bg-','bg-')} transition-all ${
                      colorIdx === i ? 'border-slate-700 scale-110' : 'border-transparent scale-100'
                    }`}
                    style={{ backgroundColor: '' }}
                  >
                    <span className={`block w-full h-full rounded-md ${c.dot}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {modalError && (
              <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
                {modalError}
              </div>
            )}

            {/* Preview */}
            {label && (() => {
              const { hour: sh, minute: sm, period: sp } = to12h(startTime);
              const { hour: eh, minute: em, period: ep } = to12h(endTime);
              const fmt = (h, m, p) => `${String(h).padStart(2,'0')}:${m} ${p}`;
              return (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${BLOCK_COLORS[colorIdx].bg} ${BLOCK_COLORS[colorIdx].border} ${BLOCK_COLORS[colorIdx].text}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {fmt(sh, sm, sp)} – {fmt(eh, em, ep)} : {label}
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-purple-100 text-slate-600 text-sm font-bold hover:bg-purple-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBlock}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white text-sm font-bold shadow-sm hover:shadow-purple-200 hover:shadow-md transition-all"
              >
                Add Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
