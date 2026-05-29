import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ZenvoraBackground from '../components/ZenvoraBackground';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Search, 
  Check, 
  Edit,
  Calendar as CalIcon, 
  Info,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  List as ListIcon,
  Table as TableIcon,
  Kanban as BoardIcon,
  AlertTriangle,
  RotateCcw,
  Eye,
  Tag,
  Mic,
  Play,
  Pause,
  X,
  Zap,
  Award,
  Flame,
  AlertCircle,
  Clock,
  CheckCircle,
  Compass,
  TrendingUp,
  Activity
} from 'lucide-react';

const TaskBoardPage = () => {
  const { token, API_HOST, user, addXP } = useAuth();
  
  // Data States
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Layout View Switcher: 'kanban', 'list', 'table', 'calendar'
  const [activeLayout, setActiveLayout] = useState('kanban');

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal Triggers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Active Task variables for Edit/Detail
  const [selectedTask, setSelectedTask] = useState(null);

  // Form Fields (Create/Edit)
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDetail, setTaskDetail] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskCategory, setTaskCategory] = useState('');
  const [taskTags, setTaskTags] = useState('');
  const [taskEstimatedTime, setTaskEstimatedTime] = useState('30');
  const [subtaskList, setSubtaskList] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Undo Delete Snackbar states
  const [deletedTaskCache, setDeletedTaskCache] = useState(null);
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false);

  // Calendar Month states
  const [calDate, setCalDate] = useState(new Date());

  // ----------------------------------------------------
  // FUTURISTIC & GAMIFIED PRODUCTIVITY STATE INJECTIONS
  // ----------------------------------------------------
  const [nlpInput, setNlpInput] = useState('');
  const [breakingDownTaskId, setBreakingDownTaskId] = useState(null);
  const [xpNotice, setXpNotice] = useState(null); // { amount, title, subtitle }

  // Day-wise calculation helper starting from Today
  const getDayName = (offset) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return days[d.getDay()];
  };

  // Day-wise Sticky Notes Planner States
  // 7-colour palette – one per weekday
  const WEEK_COLORS = [
    'bg-purple-50/70 border-purple-100/50 shadow-purple-50 text-purple-700 hover:shadow-purple-100',
    'bg-amber-50/70 border-amber-100/50 shadow-amber-50 text-amber-700 hover:shadow-amber-100',
    'bg-rose-50/70 border-rose-100/50 shadow-rose-50 text-rose-700 hover:shadow-rose-100',
    'bg-emerald-50/70 border-emerald-100/50 shadow-emerald-50 text-emerald-700 hover:shadow-emerald-100',
    'bg-sky-50/70 border-sky-100/50 shadow-sky-50 text-sky-700 hover:shadow-sky-100',
    'bg-indigo-50/70 border-indigo-100/50 shadow-indigo-50 text-indigo-700 hover:shadow-indigo-100',
    'bg-pink-50/70 border-pink-100/50 shadow-pink-50 text-pink-700 hover:shadow-pink-100'
  ];

  // Build a fresh full-week seed starting from TODAY (offset 0) through +6 days
  const buildWeekSeed = () =>
    [0, 1, 2, 3, 4, 5, 6].map((offset) => ({
      id: `note_${offset + 1}`,
      title:
        offset === 0
          ? `${getDayName(0)} (Today)`
          : offset === 1
          ? `${getDayName(1)} (Tomorrow)`
          : getDayName(offset),
      color: WEEK_COLORS[offset],
      items: []
    }));

  const [stickyNotes, setStickyNotes] = useState(() => {
    const saved = localStorage.getItem('zenvora_sticky_notes');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all 7 days exist (guard against old 4-day data)
      if (parsed.length >= 7) return parsed;
    }
    return buildWeekSeed();
  });
  const [stickyItemInputs, setStickyItemInputs] = useState({});

  useEffect(() => {
    const todayStr = new Date().toDateString();
    const lastDate = localStorage.getItem('zenvora_sticky_last_date');
    if (lastDate !== todayStr) {
      // Day has rolled over – refresh the full 7-day week starting from the new Today.
      // Preserve any items from old notes that match the same day title so users don't
      // lose work they added; fresh days start empty.
      const freshWeek = buildWeekSeed();
      setStickyNotes(freshWeek);
      localStorage.setItem('zenvora_sticky_notes', JSON.stringify(freshWeek));
      localStorage.setItem('zenvora_sticky_last_date', todayStr);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('zenvora_sticky_notes', JSON.stringify(stickyNotes));
  }, [stickyNotes]);
  
  // Pomodoro timer states
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroMode, setPomodoroMode] = useState('focus'); // 'focus' | 'break'
  const [pomodoroTask, setPomodoroTask] = useState(null);

  // Canvas celebration references
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  // Active hover AI reason tooltips
  const [activeTooltipTaskId, setActiveTooltipTaskId] = useState(null);

  // Drag & drop floating indicators
  const [draggedOverColumnId, setDraggedOverColumnId] = useState(null);

  // 1. Particle explosion canvas loop
  const triggerCelebration = (x, y) => {
    const newParticles = [];
    const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#C084FC'];
    for (let i = 0; i < 75; i++) {
      newParticles.push({
        x: x || window.innerWidth / 2,
        y: y || window.innerHeight / 3,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.5) * 16 - 6,
        size: Math.random() * 5 + 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: Math.random() * 0.02 + 0.015,
        gravity: 0.25
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  };

  useEffect(() => {
    let animationId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particlesRef.current.splice(idx, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
      animationId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // 2. Pomodoro core timer execution loop
  useEffect(() => {
    let timerId;
    if (pomodoroActive && pomodoroTime > 0) {
      timerId = setInterval(() => {
        setPomodoroTime(t => {
          if (t <= 1) {
            playAlertSound();
            if (pomodoroMode === 'focus') {
              setPomodoroMode('break');
              addXP(50);
              showXpNotice(50, "Focus Zone Accomplished", "Logged Pomodoro deep work slot!");
              triggerCelebration();
              return 5 * 60; // 5 min break
            } else {
              setPomodoroMode('focus');
              showXpNotice(10, "Break Done", "Ready to start next deep focus block");
              return 25 * 60; // 25 min focus
            }
          }
          if (t % 60 === 0 || t <= 5) {
            playTickSound();
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerId);
    }
    return () => clearInterval(timerId);
  }, [pomodoroActive, pomodoroTime, pomodoroMode]);

  const playTickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(900, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.02);
    } catch (e) {}
  };

  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  };

  const showXpNotice = (amount, title, subtitle) => {
    setXpNotice({ amount, title, subtitle });
    setTimeout(() => {
      setXpNotice(null);
    }, 4000);
  };

  // 3. Day-wise Sticky Notes Checklist Actions
  const handleToggleStickyItem = (noteId, itemId) => {
    const updated = stickyNotes.map(note => {
      if (note.id === noteId) {
        const nextItems = note.items.map(item => {
          if (item.id === itemId) {
            const nextVal = !item.completed;
            if (nextVal) {
              addXP(15);
              showXpNotice(15, "Sticky checkmark resolved", "Earned 15 XP on daily schedule tracker!");
              triggerCelebration();
              playTickSound();
            }
            return { ...item, completed: nextVal };
          }
          return item;
        });
        return { ...note, items: nextItems };
      }
      return note;
    });
    setStickyNotes(updated);
  };

  const handleAddStickyItem = (noteId, text) => {
    if (!text.trim()) return;
    const updated = stickyNotes.map(note => {
      if (note.id === noteId) {
        const newItem = {
          id: `item_${Math.random().toString()}`,
          text: text.trim(),
          completed: false
        };
        return { ...note, items: [...note.items, newItem] };
      }
      return note;
    });
    setStickyNotes(updated);
  };

  const handleAddStickyNote = (title, colorClass) => {
    const colors = [
      'bg-purple-50/70 border-purple-100/50 shadow-purple-50 text-purple-700 hover:shadow-purple-100',
      'bg-amber-50/70 border-amber-100/50 shadow-amber-50 text-amber-700 hover:shadow-amber-100',
      'bg-rose-50/70 border-rose-100/50 shadow-rose-50 text-rose-700 hover:shadow-rose-100',
      'bg-emerald-50/70 border-emerald-100/50 shadow-emerald-50 text-emerald-700 hover:shadow-emerald-100',
      'bg-sky-50/70 border-sky-100/50 shadow-sky-50 text-sky-700 hover:shadow-sky-100'
    ];
    
    const nextColor = colorClass || colors[stickyNotes.length % colors.length];
    const newNote = {
      id: `note_${Math.random().toString()}`,
      title: title || `Custom Notes ${stickyNotes.length + 1}`,
      color: nextColor,
      items: []
    };
    setStickyNotes([...stickyNotes, newNote]);
    triggerCelebration();
  };

  const handleDeleteStickyNote = (noteId) => {
    const updated = stickyNotes.filter(n => n.id !== noteId);
    setStickyNotes(updated);
  };

  // 4. Natural Language Parser engine
  const handleNlpParse = (text) => {
    if (!text.trim()) return;

    let parsedTitle = text;
    let parsedPriority = 'medium';
    let parsedCategory = 'productivity';
    let parsedDueDate = null;
    let estimatedTime = 30;

    const lowerText = text.toLowerCase();
    
    // Urgency priority scan
    if (lowerText.includes('critical') || lowerText.includes('urgent')) {
      parsedPriority = 'critical';
      parsedTitle = parsedTitle.replace(/critical|urgent/gi, '');
    } else if (lowerText.includes('high')) {
      parsedPriority = 'high';
      parsedTitle = parsedTitle.replace(/high/gi, '');
    } else if (lowerText.includes('low')) {
      parsedPriority = 'low';
      parsedTitle = parsedTitle.replace(/low/gi, '');
    }

    // Schedule deadline scan
    const today = new Date();
    if (lowerText.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);
      parsedDueDate = tomorrow;
      parsedTitle = parsedTitle.replace(/tomorrow/gi, '');
    } else if (lowerText.includes('today')) {
      const todayDate = new Date(today);
      todayDate.setHours(18, 0, 0, 0);
      parsedDueDate = todayDate;
      parsedTitle = parsedTitle.replace(/today/gi, '');
    } else if (lowerText.includes('next week')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(9, 0, 0, 0);
      parsedDueDate = nextWeek;
      parsedTitle = parsedTitle.replace(/next week/gi, '');
    }

    // Category parsing tags
    const catMatches = lowerText.match(/category:\s*(\w+)/i);
    if (catMatches && catMatches[1]) {
      parsedCategory = catMatches[1];
      parsedTitle = parsedTitle.replace(catMatches[0], '');
    } else {
      if (lowerText.includes('code') || lowerText.includes('build') || lowerText.includes('debug')) {
        parsedCategory = 'coding';
      } else if (lowerText.includes('design') || lowerText.includes('ui') || lowerText.includes('ux')) {
        parsedCategory = 'design';
      } else if (lowerText.includes('write') || lowerText.includes('draft') || lowerText.includes('blog')) {
        parsedCategory = 'writing';
      } else if (lowerText.includes('wellness') || lowerText.includes('relax') || lowerText.includes('meditate')) {
        parsedCategory = 'wellness';
      }
    }

    parsedTitle = parsedTitle.replace(/\s+/g, ' ').trim();
    if (!parsedTitle) parsedTitle = "Natural Language Objective Entry";

    const newTaskPayload = {
      title: parsedTitle,
      description: `Automatically created by Zenvora NLP scheduler from query: "${text}"`,
      priority: parsedPriority,
      status: 'todo',
      dueDate: parsedDueDate ? parsedDueDate.toISOString() : null,
      category: parsedCategory,
      estimatedTime: estimatedTime,
      tags: ['nlp-auto', 'quick-schedule'],
      subtasks: []
    };

    addNewTaskDirectly(newTaskPayload);
    setNlpInput('');
    showXpNotice(10, "NLP Scheduling Solved", `Created task: "${parsedTitle}"`);
    triggerCelebration();
  };

  const addNewTaskDirectly = async (taskPayload) => {
    try {
      const res = await fetch(`${API_HOST}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskPayload)
      });
      if (res.ok) {
        const task = await res.json();
        saveState([...tasks, task]);
      } else {
        throw new Error();
      }
    } catch (err) {
      const mockTask = {
        _id: `task_${Math.random().toString()}`,
        ...taskPayload,
        tags: taskPayload.tags || []
      };
      saveState([...tasks, mockTask]);
      addXP(10);
    }
  };

  // 5. Intelligent AI Task Breakdown Creator
  const handleAiBreakdown = async (task) => {
    if (breakingDownTaskId) return;
    setBreakingDownTaskId(task._id);

    setTimeout(() => {
      const computedBreakdowns = [
        { title: "⚡ Wireframe UX layout blueprint", completed: false },
        { title: "🧬 Configure backend model controllers", completed: false },
        { title: "🔮 Layer satin glassmorphic UI interfaces", completed: false },
        { title: "🧪 Run automated telemetry quality tests", completed: false },
        { title: "🚀 Launch live compiler & verify metrics", completed: false }
      ];

      const updated = tasks.map(t => {
        if (t._id === task._id) {
          const ex = t.subtasks || [];
          return { ...t, subtasks: [...ex, ...computedBreakdowns] };
        }
        return t;
      });

      saveState(updated);
      setBreakingDownTaskId(null);
      showXpNotice(20, "AI breakdown resolved", "Injected 5-step detailed subtask list!");
      triggerCelebration();

      try {
        fetch(`${API_HOST}/api/tasks/${task._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ subtasks: [...(task.subtasks || []), ...computedBreakdowns] })
        });
      } catch (err) {}
    }, 1200);
  };

  // 6. Data Synchronization
  const loadTasks = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.warn('Utilizing local storage for offline state:');
      const saved = localStorage.getItem('zenvora_tasks_v2');
      if (saved) {
        setTasks(JSON.parse(saved));
      } else {
        const initialTasks = [
          { 
            _id: 't1', 
            title: 'Verify cluster database connection nodes', 
            description: '# Technical scope\n\nConfigure primary database structures and verify TLS socket pipelines.', 
            status: 'todo', 
            priority: 'critical', 
            category: 'coding', 
            estimatedTime: 45,
            dueDate: new Date(Date.now() - 86400000 * 2).toISOString(), 
            subtasks: [{ title: 'Design models schemas', completed: true }, { title: 'Test latency', completed: false }],
            tags: ['mern', 'database']
          },
          { 
            _id: 't2', 
            title: 'Design premium glassmorphic sidebar layout', 
            description: 'Apply backdrop blurs, HSL lavender glows, and layout spacing structures.', 
            status: 'in_progress', 
            priority: 'high', 
            category: 'design', 
            estimatedTime: 60,
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), 
            subtasks: [],
            tags: ['ui-polish']
          },
          { 
            _id: 't3', 
            title: 'Audit telemetry static import indexes', 
            description: 'Archive landing illustrations and clean up local imports.', 
            status: 'done', 
            priority: 'low', 
            category: 'admin', 
            estimatedTime: 20,
            dueDate: new Date().toISOString(), 
            subtasks: [],
            tags: ['cleanup']
          }
        ];
        setTasks(initialTasks);
        localStorage.setItem('zenvora_tasks_v2', JSON.stringify(initialTasks));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [token]);

  const saveState = (updatedTasks) => {
    setTasks(updatedTasks);
    localStorage.setItem('zenvora_tasks_v2', JSON.stringify(updatedTasks));
  };

  // CRUD actions
  const handleOpenCreate = () => {
    setTaskTitle('');
    setTaskDetail('');
    setTaskPriority('medium');
    setTaskStatus('todo');
    setTaskDueDate('');
    setTaskCategory('');
    setTaskTags('');
    setTaskEstimatedTime('30');
    setSubtaskList([]);
    setIsCreateOpen(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle) return;

    const tagsArr = taskTags ? taskTags.split(',').map(t => t.trim()) : [];
    const formattedDueDate = taskDueDate ? new Date(taskDueDate).toISOString() : null;

    const newTaskPayload = {
      title: taskTitle,
      description: taskDetail,
      priority: taskPriority,
      status: taskStatus,
      dueDate: formattedDueDate,
      category: taskCategory || 'general',
      estimatedTime: parseInt(taskEstimatedTime) || 30,
      tags: tagsArr,
      subtasks: subtaskList
    };

    try {
      const res = await fetch(`${API_HOST}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTaskPayload)
      });
      if (res.ok) {
        const task = await res.json();
        saveState([...tasks, task]);
      } else {
        throw new Error();
      }
    } catch (err) {
      const mockTask = {
        _id: `task_${Math.random().toString()}`,
        ...newTaskPayload,
        tags: tagsArr
      };
      saveState([...tasks, mockTask]);
      addXP(10);
    }

    setIsCreateOpen(false);
    showXpNotice(10, "Objective Scheduled", `Added task: "${taskTitle}"`);
    triggerCelebration();
  };

  const handleOpenEdit = (task) => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDetail(task.description || '');
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setTaskDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setTaskCategory(task.category || '');
    setTaskTags(task.tags ? task.tags.join(', ') : '');
    setTaskEstimatedTime(String(task.estimatedTime || 30));
    setIsEditOpen(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    const tagsArr = taskTags ? taskTags.split(',').map(t => t.trim()) : [];
    const formattedDueDate = taskDueDate ? new Date(taskDueDate).toISOString() : null;

    const updatedPayload = {
      title: taskTitle,
      description: taskDetail,
      priority: taskPriority,
      status: taskStatus,
      dueDate: formattedDueDate,
      category: taskCategory || 'general',
      estimatedTime: parseInt(taskEstimatedTime) || 30,
      tags: tagsArr
    };

    const updatedTasks = tasks.map(t => {
      if (t._id === selectedTask._id) {
        if (t.status !== 'done' && taskStatus === 'done') {
          addXP(25);
          showXpNotice(25, "System Objective Completed", "+25 XP Multiplier activated!");
          triggerCelebration();
        }
        return { ...t, ...updatedPayload };
      }
      return t;
    });

    saveState(updatedTasks);
    setIsEditOpen(false);

    try {
      await fetch(`${API_HOST}/api/tasks/${selectedTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedPayload)
      });
    } catch (err) {}
  };

  const handleDeleteTask = async (taskId) => {
    const target = tasks.find(t => t._id === taskId);
    if (!target) return;

    setDeletedTaskCache(target);
    setShowUndoSnackbar(true);

    const updated = tasks.filter(t => t._id !== taskId);
    saveState(updated);

    setTimeout(() => {
      setShowUndoSnackbar(false);
    }, 6000);

    try {
      await fetch(`${API_HOST}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {}
  };

  const handleUndoDelete = async () => {
    if (!deletedTaskCache) return;
    saveState([...tasks, deletedTaskCache]);
    
    const target = { ...deletedTaskCache };
    setDeletedTaskCache(null);
    setShowUndoSnackbar(false);

    try {
      await fetch(`${API_HOST}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(target)
      });
    } catch (err) {}
  };

  const handleToggleCompletion = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    
    const updated = tasks.map(t => {
      if (t._id === task._id) {
        if (newStatus === 'done') {
          addXP(25);
          showXpNotice(25, "System Objective Completed", "+25 XP loaded!");
          triggerCelebration(window.innerWidth / 2, window.innerHeight / 3);
        }
        return { ...t, status: newStatus };
      }
      return t;
    });
    saveState(updated);

    try {
      await fetch(`${API_HOST}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {}
  };

  const handleMoveStatus = async (task, newStatus) => {
    const updated = tasks.map(t => {
      if (t._id === task._id) {
        if (task.status !== 'done' && newStatus === 'done') {
          addXP(25);
          showXpNotice(25, "System Objective Completed", "+25 XP Multiplier activated!");
          triggerCelebration(window.innerWidth / 2, window.innerHeight / 3);
        }
        return { ...t, status: newStatus };
      }
      return t;
    });
    saveState(updated);

    try {
      await fetch(`${API_HOST}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {}
  };

  const addSubtask = () => {
    if (!newSubtaskTitle) return;
    setSubtaskList([...subtaskList, { title: newSubtaskTitle, completed: false }]);
    setNewSubtaskTitle('');
  };

  // Due Date Countdown calculations
  const getDateDiagnostics = (dueDateStr, status) => {
    if (!dueDateStr) return null;
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isOverdue = dueDate < today && status !== 'done';
    const diffTime = Math.abs(today - dueDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let countdownText = '';
    if (dueDate.toDateString() === today.toDateString()) {
      countdownText = 'Due Today';
    } else if (isOverdue) {
      countdownText = `Overdue by ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else {
      countdownText = `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }

    return { isOverdue, countdownText, dateFormatted: dueDate.toLocaleDateString() };
  };

  // Filters mapping
  const uniqueCategories = Array.from(new Set(tasks.map(t => t.category ? t.category.toLowerCase().trim() : '').filter(Boolean)));

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'pending' && t.status !== 'done') || 
                          (statusFilter === 'done' && t.status === 'done');
    
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

    return matchesSearch && matchesPriority && matchesStatus && matchesCategory;
  });

  // Priority Styles mapping
  const priorityBadgeStyle = (tier) => {
    switch (tier) {
      case 'low': return 'bg-cyan-50 border border-cyan-100 text-cyan-600 shadow-sm shadow-cyan-50/50';
      case 'medium': return 'bg-purple-50 border border-purple-100 text-zenvora-600';
      case 'high': return 'bg-amber-50 border border-amber-100 text-amber-600';
      case 'critical': return 'bg-gradient-to-r from-rose-500 to-red-600 text-white border-none shadow-md shadow-rose-200/50 font-black animate-pulse-subtle';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  // 7. Pomodoro quick launch from Focus Zone header
  const handleLaunchFocusPomodoro = () => {
    const activeTasks = tasks.filter(t => t.status === 'in_progress');
    const targetTask = activeTasks.find(t => t.priority === 'critical') || 
                       activeTasks.find(t => t.priority === 'high') || 
                       activeTasks[0] || 
                       null;
    
    setPomodoroTask(targetTask);
    setPomodoroTime(25 * 60);
    setPomodoroMode('focus');
    setPomodoroActive(false);
    setPomodoroOpen(true);
  };

  // Productivity index variables
  const tCount = tasks.length;
  const cCount = tasks.filter(t => t.status === 'done').length;
  const pCount = tasks.filter(t => t.status !== 'done').length;
  const activeCount = tasks.filter(t => t.status === 'in_progress').length;
  const completionPercent = tCount > 0 ? Math.round((cCount / tCount) * 100) : 0;
  const focusPointsScore = Math.max(10, Math.min(100, (cCount * 20) - (tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()).length * 15) + 65));

  // Calendar parameters
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const totalMonthDays = new Date(year, month + 1, 0).getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let i = 1; i <= totalMonthDays; i++) calendarCells.push(i);

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto relative h-screen bg-zenvora-bg text-left">
      <ZenvoraBackground mode="vertical" />

      {/* Floating Canvas for Particle explosions */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />

      {/* Futuristic floating XP alert notifier */}
      {xpNotice && (
        <div className="fixed top-6 right-6 glass-panel px-6 py-4 rounded-2xl shadow-xl z-50 flex items-center gap-3 border border-emerald-100/50 bg-emerald-50/20 backdrop-blur-md animate-float">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
            <Award className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">{xpNotice.title}</h4>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{xpNotice.subtitle}</p>
          </div>
          <span className="ml-auto text-emerald-600 font-black text-sm">+{xpNotice.amount} XP</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-6xl mx-auto space-y-6 z-10 relative">
        
        {/* Header Controls */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>Task Command Center</span>
              <Sparkles className="w-5 h-5 text-purple-500 animate-pulse-subtle" />
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Automated deep focus and dynamic smart queue engine</p>
          </div>

          {/* Interactive Layout switcher */}
          <div className="flex bg-white/40 border border-purple-100/50 p-1.5 rounded-2xl glass-panel shrink-0 shadow-sm self-start md:self-auto">
            {[
              { id: 'kanban', name: 'Kanban', icon: BoardIcon },
              { id: 'list', name: 'List', icon: ListIcon },
              { id: 'table', name: 'Table', icon: TableIcon },
              { id: 'calendar', name: 'Calendar', icon: CalIcon }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveLayout(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeLayout === tab.id
                    ? 'bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white shadow-md'
                    : 'text-slate-500 hover:text-zenvora-600'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </div>
        </header>

         {/* 📌 DAY-WISE STICKY NOTES PLANNER GRID */}
        <section className="glass-panel p-6 rounded-3xl border border-white/60 text-left space-y-6 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span>📌 Day-wise Sticky Notes Planner</span>
                <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Quick daily scratchpad checkpoints. Mark items complete directly on the sticky note.</p>
            </div>

            {/* Quick Note Adders – all 7 days from Today */}
            <div className="flex gap-1.5 flex-nowrap overflow-x-auto pb-1 shrink-0">
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const dayNameLabel = getDayName(offset);
                const suffix = offset === 0 ? ' (Today)' : offset === 1 ? ' (Tomorrow)' : '';
                const alreadyExists = stickyNotes.some(n => n.title === `${dayNameLabel}${suffix}` || n.title === dayNameLabel);
                return (
                  <button
                    key={offset}
                    type="button"
                    onClick={() => handleAddStickyNote(`${dayNameLabel}${suffix}`, WEEK_COLORS[offset % WEEK_COLORS.length])}
                    disabled={alreadyExists}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black border flex items-center gap-1 transition-all shrink-0 ${
                      alreadyExists
                        ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-default'
                        : 'bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-100/50 hover:scale-105'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>{dayNameLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horizontal scrollable sticky notes board */}
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'thin' }}>
            {stickyNotes.map((note) => {
              const activeInputVal = stickyItemInputs[note.id] || '';
              const completedCount = note.items.filter(i => i.completed).length;
              const totalCount = note.items.length;
              const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div
                  key={note.id}
                  className={`flex-shrink-0 w-[200px] p-4 rounded-3xl border flex flex-col gap-3 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative group ${note.color}`}
                  style={{ minHeight: '300px' }}
                >
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteStickyNote(note.id)}
                    className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-white/40 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Day title + progress */}
                  <div className="pr-5 text-left">
                    <h3 className="font-extrabold text-[10px] uppercase tracking-widest block leading-tight">{note.title}</h3>
                    {totalCount > 0 && (
                      <>
                        <span className="text-[8px] font-bold opacity-60 block mt-0.5">{completedCount}/{totalCount} done</span>
                        <div className="w-full h-1 rounded-full bg-white/50 mt-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-current opacity-40 transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Checklist Items – scrollable */}
                  <div className="flex-1 space-y-1.5 overflow-y-auto pr-0.5" style={{ maxHeight: '180px' }}>
                    {note.items.length > 0 ? (
                      note.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleStickyItem(note.id, item.id)}
                          className="flex items-start gap-2 p-2 rounded-xl bg-white/70 border border-white/50 cursor-pointer hover:bg-white transition-all text-left"
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            readOnly
                            className="w-3.5 h-3.5 rounded border-purple-200 text-purple-600 focus:ring-purple-400 shrink-0 mt-0.5"
                          />
                          <span className={`text-[9px] font-extrabold leading-snug break-words flex-1 ${
                            item.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                          }`}>
                            {item.text}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-5 text-[8px] font-bold text-slate-400 italic">Empty — pin items below!</div>
                    )}
                  </div>

                  {/* Inline item adder */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddStickyItem(note.id, activeInputVal);
                      setStickyItemInputs(prev => ({ ...prev, [note.id]: '' }));
                    }}
                    className="flex gap-1.5 shrink-0 border-t border-current/10 pt-2.5 mt-auto"
                  >
                    <input
                      type="text"
                      placeholder="Add item..."
                      value={activeInputVal}
                      onChange={(e) => setStickyItemInputs(prev => ({ ...prev, [note.id]: e.target.value }))}
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl border border-white/40 bg-white/60 focus:bg-white text-[9px] font-bold text-slate-700 shadow-inner outline-none"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[9px] shadow-sm shrink-0 transition-colors"
                    >
                      Pin
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>

        {/* ----------------------------------------------------
           SEARCH & FILTERS PANEL
           ---------------------------------------------------- */}
        <section className="glass-panel p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4 border border-white/60">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
            <input
              type="text"
              placeholder="Search scope objectives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl glass-input text-slate-700 font-bold"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-3 w-full sm:w-auto items-center">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl glass-input text-slate-600 font-bold bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl glass-input text-slate-600 font-bold bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="done">Completed</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl glass-input text-slate-600 font-bold bg-white capitalize"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 ml-auto sm:ml-0"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule</span>
            </button>
          </div>
        </section>

        {/* ----------------------------------------------------
           TWO-COLUMN GRID LAYOUT: MAIN VIEW & INSIGHTS PANEL
           ---------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* LEFT SIDE AREA: MAIN ACTIVE WORKSPACE LAYOUT VIEW */}
          <div className="lg:col-span-3 space-y-6">

            {/* VIEW A: KANBAN BOARD */}
            {activeLayout === 'kanban' && (
              <main className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { id: 'todo', title: 'To Do', color: 'border-purple-200 bg-purple-50/20', desc: 'Newly scheduled objectives' },
                  { id: 'in_progress', title: 'Focus Zone', color: 'border-violet-300/60 bg-violet-50/30 shadow-lg shadow-purple-100/30 relative border-2', desc: 'Active deep concentration slot', focus: true },
                  { id: 'review', title: 'Smart Queue', color: 'border-indigo-200 bg-indigo-50/20', desc: 'AI reordered priority weight', queue: true },
                  { id: 'done', title: 'Finished Systems', color: 'border-emerald-200 bg-emerald-50/20', desc: 'Gamified reward archive' }
                ].map(col => {
                  let colTasks = filteredTasks.filter(t => t.status === col.id);

                  // Smart Queue sorting algorithm (priority weight + deadline urgency)
                  if (col.queue) {
                    colTasks = [...colTasks].sort((a, b) => {
                      const getScore = (task) => {
                        let score = 0;
                        if (task.priority === 'critical') score += 15;
                        else if (task.priority === 'high') score += 10;
                        else if (task.priority === 'medium') score += 5;
                        else score += 1;

                        if (task.dueDate) {
                          const diff = new Date(task.dueDate) - new Date();
                          if (diff < 0) score += 20; // Overdue weight
                          else if (diff < 86400000) score += 10; // Due today
                          else if (diff < 86400000 * 3) score += 5;
                        }
                        return score;
                      };
                      return getScore(b) - getScore(a);
                    });
                  }

                  const estimatedColMinutes = colTasks.reduce((sum, t) => sum + (t.estimatedTime || 30), 0);

                  return (
                    <div 
                      key={col.id} 
                      onDragOver={(e) => { e.preventDefault(); setDraggedOverColumnId(col.id); }}
                      onDragLeave={() => setDraggedOverColumnId(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDraggedOverColumnId(null);
                        const taskId = e.dataTransfer.getData('text/plain');
                        const task = tasks.find(t => t._id === taskId);
                        if (task && task.status !== col.id) {
                          handleMoveStatus(task, col.id);
                        }
                      }}
                      className={`p-4 rounded-3xl border transition-all duration-300 backdrop-blur-md flex flex-col min-h-[500px] text-left relative ${col.color} ${
                        draggedOverColumnId === col.id ? 'border-dashed border-purple-400 bg-purple-50/60 scale-[1.01]' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1 px-1">
                        <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                          {col.focus && <Clock className="w-4 h-4 text-purple-600 animate-pulse" />}
                          {col.queue && <Compass className="w-4 h-4 text-indigo-500" />}
                          <span>{col.title}</span>
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-white/60 text-purple-700 text-[10px] font-extrabold shadow-sm">{colTasks.length}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 px-1 pb-3 border-b border-purple-50">
                        <span className="truncate max-w-[80px]">{col.desc}</span>
                        {estimatedColMinutes > 0 && (
                          <span className="text-[8px] bg-purple-50 text-purple-500 px-1.5 py-0.5 rounded-md font-extrabold">⏱️ {estimatedColMinutes}m est</span>
                        )}
                      </div>

                      {/* Pomodoro quick trigger button directly inside Focus Zone header */}
                      {col.focus && colTasks.length > 0 && (
                        <button
                          onClick={handleLaunchFocusPomodoro}
                          className="mt-3 py-1.5 rounded-xl border border-purple-100 hover:bg-purple-100 text-purple-600 font-extrabold text-[10px] transition-all text-center flex items-center justify-center gap-1 shadow-sm bg-white"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Pomodoro Focus ({colTasks.length})</span>
                        </button>
                      )}

                      <div className="flex-1 space-y-4 overflow-y-auto max-h-[35rem] pr-1 mt-4">
                        {colTasks.map(task => {
                          const dates = getDateDiagnostics(task.dueDate, task.status);
                          const totalSub = task.subtasks ? task.subtasks.length : 0;
                          const completedSub = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
                          const subPercent = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

                          // Generate recommendation tag for Smart Queue
                          let recommendationTag = null;
                          let whyTooltip = "";
                          if (col.queue) {
                            if (task.priority === 'critical') {
                              recommendationTag = "🚨 Urgent Target";
                              whyTooltip = "AI Analysis: Critical priority with a looming deadline. Finish this now to prevent bottleneck logs.";
                            } else if (task.estimatedTime <= 30) {
                              recommendationTag = "⚡ Quick momentum";
                              whyTooltip = "AI Analysis: Low estimated work slot. Complete this rapidly to build XP streaks!";
                            } else {
                              recommendationTag = "🧬 High Impact";
                              whyTooltip = "AI Analysis: Substantial objective weight. Promotes significant performance level gains.";
                            }
                          }

                          return (
                            <div 
                              key={task._id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', task._id);
                              }}
                              className={`p-4 rounded-2xl bg-white border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative group flex flex-col gap-3 cursor-grab active:cursor-grabbing border-purple-100/40`}
                            >
                              {/* Urgency prediction border highlight */}
                              {dates?.isOverdue && (
                                <div className="absolute inset-0 rounded-2xl border-2 border-rose-500 pointer-events-none animate-pulse-subtle shadow-lg shadow-rose-100" />
                              )}

                              <div className="flex justify-between items-center">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${priorityBadgeStyle(task.priority)}`}>
                                  {task.priority}
                                </span>
                                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                  {/* AI breakdown wizard trigger */}
                                  {totalSub === 0 && (
                                    <button 
                                      onClick={() => handleAiBreakdown(task)} 
                                      title="AI Auto-breakdown subtasks"
                                      className="p-1 text-slate-400 hover:text-purple-600 transition-colors"
                                    >
                                      {breakingDownTaskId === task._id ? (
                                        <span className="w-3.5 h-3.5 block border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                      )}
                                    </button>
                                  )}
                                  <button onClick={() => handleOpenEdit(task)} className="p-1 text-slate-400 hover:text-zenvora-600 transition-colors">
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDeleteTask(task._id)} className="p-1 text-slate-400 hover:text-rose-500 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-start gap-2.5 cursor-pointer" onClick={() => { setSelectedTask(task); setIsDetailOpen(true); }}>
                                <input
                                  type="checkbox"
                                  checked={task.status === 'done'}
                                  onChange={() => handleToggleCompletion(task)}
                                  className="w-4.5 h-4.5 rounded border-purple-200 text-zenvora-600 focus:ring-purple-400 mt-0.5 shrink-0"
                                />
                                <div className="text-left overflow-hidden">
                                  <h4 className={`font-black text-xs leading-snug truncate ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                    {task.title}
                                  </h4>
                                  {task.description && (
                                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                                  )}
                                </div>
                              </div>

                              {/* Smart Queue recommendation tags & Why Tooltips */}
                              {col.queue && recommendationTag && (
                                <div className="relative">
                                  <div 
                                    onMouseEnter={() => setActiveTooltipTaskId(task._id)}
                                    onMouseLeave={() => setActiveTooltipTaskId(null)}
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 text-[8px] font-extrabold cursor-pointer"
                                  >
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>{recommendationTag}</span>
                                    <Info className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                                  </div>
                                  
                                  {activeTooltipTaskId === task._id && (
                                    <div className="absolute left-0 bottom-6 bg-slate-900 text-white rounded-xl p-3 text-[9px] leading-relaxed font-semibold shadow-xl border border-white/10 z-30 max-w-[200px] w-48 transition-all">
                                      {whyTooltip}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Subtask checklist progress bar */}
                              {totalSub > 0 && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[8px] font-extrabold text-slate-400">
                                    <span>AI Checklist</span>
                                    <span>{completedSub}/{totalSub}</span>
                                  </div>
                                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-300" style={{ width: `${subPercent}%` }} />
                                  </div>
                                </div>
                              )}

                              {/* Footer details (estimated duration, due countdown) */}
                              <div className="border-t border-purple-50/50 pt-2 flex items-center justify-between gap-1 text-[9px] font-extrabold text-slate-400">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-purple-400 shrink-0" />
                                  <span>{task.estimatedTime || 30} mins</span>
                                </div>
                                
                                {dates ? (
                                  <span className={dates.isOverdue ? 'text-rose-500 bg-rose-50 px-1 rounded animate-pulse' : 'text-slate-400 bg-slate-50 px-1 rounded'}>
                                    {dates.countdownText}
                                  </span>
                                ) : (
                                  <span>No deadline</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </main>
            )}

            {/* VIEW B: COMPACT LIST VIEW */}
            {activeLayout === 'list' && (
              <main className="glass-panel p-6 rounded-3xl space-y-3 border border-white text-left">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map(task => {
                    const dates = getDateDiagnostics(task.dueDate, task.status);
                    return (
                      <div 
                        key={task._id} 
                        className={`p-4 rounded-2xl bg-white border flex items-center justify-between gap-4 shadow-sm hover:shadow transition-all ${
                          dates?.isOverdue ? 'border-2 border-rose-400' : 'border-purple-100/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <input
                            type="checkbox"
                            checked={task.status === 'done'}
                            onChange={() => handleToggleCompletion(task)}
                            className="w-4.5 h-4.5 rounded border-purple-200 text-zenvora-600 focus:ring-zenvora-400 mt-0.5 shrink-0"
                          />
                          <div className="overflow-hidden">
                            <h4 className={`font-black text-xs ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                              {task.title}
                            </h4>
                            <span className="text-[9px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wider">#{task.category}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${priorityBadgeStyle(task.priority)}`}>
                            {task.priority}
                          </span>
                          {dates && (
                            <span className={`text-[10px] font-bold ${dates.isOverdue ? 'text-rose-600' : 'text-slate-400'}`}>
                              {dates.countdownText}
                            </span>
                          )}
                          <div className="flex gap-1">
                            <button onClick={() => handleOpenEdit(task)} className="p-1 text-slate-400 hover:text-zenvora-600">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteTask(task._id)} className="p-1 text-slate-400 hover:text-rose-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs font-bold">No active tasks logged.</div>
                )}
              </main>
            )}

            {/* VIEW C: TABLE VIEW */}
            {activeLayout === 'table' && (
              <main className="glass-panel rounded-3xl overflow-hidden border border-white text-left shadow-sm">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-purple-100/40 border-b border-purple-100/50">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Objective</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100/20 bg-white/45 backdrop-blur-md">
                    {filteredTasks.map(task => {
                      const dates = getDateDiagnostics(task.dueDate, task.status);
                      return (
                        <tr key={task._id} className="hover:bg-white/70 transition-colors">
                          <td className="px-6 py-4 max-w-xs">
                            <span className={`font-bold text-xs truncate block ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                              {task.title}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-purple-50 px-2 py-0.5 rounded">
                              {task.category || 'coding'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${priorityBadgeStyle(task.priority)}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-slate-600">{task.estimatedTime || 30} mins</span>
                          </td>
                          <td className="px-6 py-4">
                            {dates ? (
                              <span className={`text-xs font-bold ${dates.isOverdue ? 'text-rose-500' : 'text-slate-600'}`}>
                                {dates.dateFormatted} ({dates.countdownText})
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">--</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => handleOpenEdit(task)} className="p-1 text-slate-400 hover:text-zenvora-600">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteTask(task._id)} className="p-1 text-slate-400 hover:text-rose-500">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </main>
            )}

            {/* VIEW D: CALENDAR VIEW */}
            {activeLayout === 'calendar' && (
              <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                      <CalIcon className="w-5 h-5 text-zenvora-600" />
                      <span>{monthNames[month]} {year}</span>
                    </h3>
                    <div className="flex gap-2">
                      <button onClick={() => setCalDate(new Date(year, month - 1, 1))} className="p-2 rounded-xl bg-white hover:bg-purple-50 border border-purple-100 text-slate-600">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => setCalDate(new Date(year, month + 1, 1))} className="p-2 rounded-xl bg-white hover:bg-purple-50 border border-purple-100 text-slate-600">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2.5 text-center">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-1.5">{day}</div>
                    ))}
                    {calendarCells.map((day, idx) => {
                      if (day === null) return <div key={`empty-${idx}`} className="aspect-square bg-transparent" />;
                      
                      const thisDate = new Date(year, month, day);
                      const dayTasks = filteredTasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === thisDate.toDateString());

                      return (
                        <div 
                          key={`day-${day}`} 
                          className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-1 relative hover:bg-purple-50/50 transition-colors ${
                            dayTasks.length > 0 ? 'border-purple-200 bg-purple-50/40 text-zenvora-700' : 'border-transparent bg-white/40 text-slate-600'
                          }`}
                        >
                          <span className="text-xs font-bold">{day}</span>
                          {dayTasks.length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-zenvora-500 absolute bottom-1.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* List for active selected month dates */}
                <div className="glass-panel p-6 rounded-3xl text-left flex flex-col">
                  <h3 className="font-extrabold text-slate-800 text-base">Schedule Highlights</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tasks due this month</p>
                  
                  <div className="mt-4 flex-1 space-y-3 overflow-y-auto max-h-[22rem] pr-1">
                    {filteredTasks.filter(t => t.dueDate && new Date(t.dueDate).getMonth() === month && new Date(t.dueDate).getFullYear() === year).map(t => (
                      <div key={t._id} className="p-3 bg-white/75 rounded-2xl border border-purple-100 flex justify-between items-center gap-2 shadow-sm">
                        <div className="overflow-hidden">
                          <span className="text-[10px] font-black text-slate-700 block truncate">{t.title}</span>
                          <span className="text-[8px] font-extrabold text-slate-400 uppercase mt-0.5">{new Date(t.dueDate).toLocaleDateString()}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 ${priorityBadgeStyle(t.priority)}`}>
                          {t.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </main>
            )}

          </div>

          {/* RIGHT SIDE AREA: GAMIFIED PRODUCTIVITY INSIGHTS SIDEBAR */}
          <aside className="lg:col-span-1 space-y-6">

            {/* Stats Summary Panel */}
            <div className="glass-panel p-6 rounded-3xl border border-white/60 text-left space-y-5 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-sm">Operator Core</h3>
                <Activity className="w-4 h-4 text-purple-500 animate-pulse" />
              </div>

              {/* XP Level details */}
              {user && (
                <div className="p-4 bg-purple-50/50 border border-purple-100/50 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-black shadow-md">
                      LV {user.level}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">{user.username}</h4>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 mt-0.5">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>Streak: {user.streak} days</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <span>XP Progress</span>
                      <span>{user.xp % 100}/100 XP</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-purple-100 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${user.xp % 100}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Completion vectors gauge */}
              <div className="space-y-1.5 pt-2 border-t border-purple-50">
                <div className="flex justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <span>Scope Solved</span>
                  <span>{completionPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-purple-50 overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${completionPercent}%` }} />
                </div>
              </div>

              {/* Burnout meter */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <span>Burnout Diagnostic</span>
                  <span className={activeCount >= 4 ? 'text-rose-500 font-extrabold' : 'text-emerald-500 font-extrabold'}>
                    {activeCount >= 4 ? 'High Risk' : 'Optimal'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-purple-50 overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${activeCount >= 4 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (activeCount / 5) * 100)}%` }} />
                </div>
                <p className="text-[8px] font-bold text-slate-400 leading-relaxed mt-1">
                  {activeCount >= 4 
                    ? "Warning: Too many tasks active in Focus Zone. Focus on single critical objectives to protect health."
                    : "Workload balances perfectly. Focus slots available."
                  }
                </p>
              </div>
            </div>

            {/* Smart next suggested task from AI */}
            {pCount > 0 && (
              <div className="glass-panel p-5 rounded-3xl border border-white/60 text-left space-y-3 shadow-sm bg-gradient-to-br from-white/90 via-purple-50/20 to-indigo-50/20">
                <span className="text-[8px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded uppercase tracking-widest block w-max">AI Recommendation</span>
                
                {(() => {
                  const target = tasks.find(t => t.status !== 'done' && t.priority === 'critical') || 
                                 tasks.find(t => t.status !== 'done' && t.priority === 'high') || 
                                 tasks.find(t => t.status !== 'done') || 
                                 null;
                  
                  if (!target) return null;

                  return (
                    <div className="space-y-2.5">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 leading-snug line-clamp-2">{target.title}</h4>
                        <p className="text-[9px] text-slate-400 mt-1">Priority: <span className="uppercase text-purple-500 font-bold">{target.priority}</span></p>
                      </div>

                      <div className="p-3 bg-white/70 border border-purple-100 rounded-2xl text-[9px] leading-relaxed font-semibold text-slate-600">
                        🔥 Recommended: High urgency parameters. Completing this solves scheduled checkpoints.
                      </div>

                      <button
                        onClick={() => {
                          setPomodoroTask(target);
                          setPomodoroTime(25 * 60);
                          setPomodoroMode('focus');
                          setPomodoroActive(true);
                          setPomodoroOpen(true);
                        }}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-extrabold text-xs shadow hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Lock Deep Focus</span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

          </aside>

        </div>

        {/* ----------------------------------------------------
           MODAL A: CREATE NEW TASK
           ---------------------------------------------------- */}
        {isCreateOpen && (
          <div className="fixed inset-0 bg-slate-900/15 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-md lavender-glass-panel p-6 rounded-3xl space-y-4 border border-purple-200/50 text-left relative animate-scale-up text-slate-800 shadow-2xl">
              <div>
                <h3 className="font-black text-violet-955 text-xl flex items-center gap-1.5">
                  <Plus className="w-5 h-5 text-purple-600" />
                  <span>Assemble Objective</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure scope parameters and active checkpoints</p>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4 max-h-[35rem] overflow-y-auto pr-1">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Objective title..."
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-755"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">Description details</label>
                  <textarea
                    placeholder="Provide modular scope checklists..."
                    value={taskDetail}
                    onChange={(e) => setTaskDetail(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl glass-input text-xs font-medium text-slate-755 h-20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">Category</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Coding, Writing"
                      value={taskCategory}
                      onChange={(e) => setTaskCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-755"
                    />
                  </div>

                  {/* Due Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">Due Date</label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-700 font-bold bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Starting Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">Starting Status</label>
                    <select
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl glass-input text-slate-700 font-bold bg-white"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">Focus Zone</option>
                      <option value="review">Smart Queue</option>
                      <option value="done">Finished Systems</option>
                    </select>
                  </div>

                  {/* Estimated Time */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">Est. Duration (Mins)</label>
                    <input
                      type="number"
                      value={taskEstimatedTime}
                      onChange={(e) => setTaskEstimatedTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-755"
                    />
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1 block">Priority Level</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high', 'critical'].map(p => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setTaskPriority(p)}
                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg border uppercase transition-all ${
                          taskPriority === p 
                            ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-sm font-black' 
                            : 'bg-white text-slate-500 border-purple-100 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-purple-600" />
                    <span>Labels (comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. mern, core, ui"
                    value={taskTags}
                    onChange={(e) => setTaskTags(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-755"
                  />
                </div>

                {/* Subtasks checklist */}
                <div className="space-y-2 border-t border-purple-100/50 pt-3">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">Subtasks Checklist</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add system subtask item..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl glass-input text-xs font-semibold text-slate-755"
                    />
                    <button
                      type="button"
                      onClick={addSubtask}
                      className="px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-250 text-purple-750 font-extrabold text-xs"
                    >
                      Add
                    </button>
                  </div>

                  {subtaskList.length > 0 && (
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {subtaskList.map((sub, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-1.5 pl-2 bg-purple-100/30 border border-purple-200/20 rounded-lg">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 animate-pulse" />
                          <span className="text-[10px] font-extrabold text-slate-700 truncate">{sub.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-purple-150 text-slate-600 font-bold text-xs hover:bg-purple-100/60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-extrabold text-xs shadow-md shadow-purple-200 hover:scale-102 active:scale-98 transition-transform"
                  >
                    Assemble
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
           MODAL B: EDIT DEDICATED TASK
           ---------------------------------------------------- */}
        {isEditOpen && selectedTask && (
          <div className="fixed inset-0 bg-slate-900/15 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-md lavender-glass-panel p-6 rounded-3xl space-y-4 border border-purple-200/50 text-left relative animate-scale-up text-slate-800 shadow-2xl">
              <div>
                <h3 className="font-black text-violet-955 text-xl">Modify Objective</h3>
                <p className="text-xs text-slate-500 mt-0.5">Update scope parameters and schedules</p>
              </div>

              <form onSubmit={handleUpdateTask} className="space-y-4 max-h-[35rem] overflow-y-auto pr-1">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Objective..."
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-755"
                  />
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">Scope details</label>
                  <textarea
                    placeholder="Details..."
                    value={taskDetail}
                    onChange={(e) => setTaskDetail(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl glass-input text-xs font-medium text-slate-755 h-20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">Category</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Coding, Writing"
                      value={taskCategory}
                      onChange={(e) => setTaskCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-755"
                    />
                  </div>

                  {/* Due Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">Due Date</label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-700 font-bold bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Objective Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">Objective Status</label>
                    <select
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl glass-input text-slate-700 font-bold bg-white"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">Focus Zone</option>
                      <option value="review">Smart Queue</option>
                      <option value="done">Finished Systems</option>
                    </select>
                  </div>

                  {/* Estimated Time */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">Est. Duration (Mins)</label>
                    <input
                      type="number"
                      value={taskEstimatedTime}
                      onChange={(e) => setTaskEstimatedTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-semibold text-slate-755"
                    />
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1 block">Priority Level</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high', 'critical'].map(p => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setTaskPriority(p)}
                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg border uppercase transition-all ${
                          taskPriority === p 
                            ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-sm font-black' 
                            : 'bg-white text-slate-500 border-purple-100 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-white/40 border border-purple-150 rounded-xl hover:bg-purple-100/60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-purple-500 rounded-xl shadow-md hover:scale-102 active:scale-98 transition-transform"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
           MODAL C: DETAILED PREVIEW WITH CHECKS & HISTORY
           ---------------------------------------------------- */}
        {isDetailOpen && selectedTask && (
          <div className="fixed inset-0 bg-slate-900/15 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-left animate-fade-in">
            <div className="w-full max-w-md lavender-glass-panel p-6 rounded-3xl space-y-4 border border-purple-200/50 relative animate-scale-up text-slate-800 shadow-2xl">
              
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-purple-100/60 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex justify-between items-start pt-2">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${priorityBadgeStyle(selectedTask.priority)}`}>
                  {selectedTask.priority}
                </span>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">#{selectedTask.category}</span>
              </div>

              <div>
                <h3 className="font-black text-violet-955 text-xl leading-snug">{selectedTask.title}</h3>
                {selectedTask.dueDate && (
                  <span className="text-[10px] font-extrabold text-slate-500 mt-1 block">
                    Check Date: {new Date(selectedTask.dueDate).toDateString()}
                  </span>
                )}
              </div>

              {/* Subtasks toggles */}
              {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                <div className="space-y-2 border-t border-purple-100/50 pt-3">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">Checked Checkpoints</label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {selectedTask.subtasks.map((sub, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => {
                          const updatedSubtasks = selectedTask.subtasks.map((s, sIdx) => 
                            sIdx === idx ? { ...s, completed: !s.completed } : s
                          );
                          const updated = tasks.map(t => t._id === selectedTask._id ? { ...t, subtasks: updatedSubtasks } : t);
                          saveState(updated);
                          setSelectedTask({ ...selectedTask, subtasks: updatedSubtasks });
                          
                          // Sync changes
                          try {
                            fetch(`${API_HOST}/api/tasks/${selectedTask._id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                              body: JSON.stringify({ subtasks: updatedSubtasks })
                            });
                          } catch (err) {}
                        }}
                        className="flex items-center gap-2.5 p-2 bg-purple-100/30 border border-purple-200/20 rounded-xl cursor-pointer hover:bg-purple-100/60 transition-all shadow-sm"
                      >
                        <input
                          type="checkbox"
                          checked={sub.completed}
                          readOnly
                          className="w-4 h-4 rounded border-purple-300 text-purple-650 focus:ring-purple-400"
                        />
                        <span className={`text-[10px] font-extrabold ${sub.completed ? 'text-slate-400 line-through' : 'text-slate-750'}`}>{sub.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Markdown details description */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/40 overflow-y-auto max-h-40 min-h-[6rem] border-t border-purple-100/50 shadow-inner">
                <label className="text-[9px] font-black text-purple-800 uppercase tracking-wider block mb-2">Scope Log Details</label>
                {selectedTask.description ? (
                  <div className="text-[11px] font-bold text-slate-700 leading-relaxed space-y-2 whitespace-pre-line font-mono">
                    {selectedTask.description}
                  </div>
                ) : (
                  <span className="text-xs text-slate-450 italic">No description logged.</span>
                )}
              </div>

              {/* Simulated history log */}
              <div className="space-y-1.5 border-t border-purple-100/50 pt-3">
                <label className="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">Activity Log</label>
                <div className="text-[8px] font-extrabold text-slate-500 space-y-1 bg-purple-50/40 p-2.5 rounded-xl border border-purple-200/20 shadow-sm">
                  <div className="flex justify-between">
                    <span>⚡ Created via console entry</span>
                    <span>Just now</span>
                  </div>
                  <div className="flex justify-between border-t border-purple-100/30 pt-1 mt-1">
                    <span>🧬 Urgency parsed: {selectedTask.priority}</span>
                    <span>Just now</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-extrabold text-xs shadow-md shadow-purple-200 hover:shadow-purple-300 transition-all hover:scale-102 active:scale-98"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
           MODAL D: INTERACTIVE POMODORO TIMER OVERLAY
           ---------------------------------------------------- */}
        {pomodoroOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-sm lavender-glass-panel p-8 rounded-3xl space-y-6 border border-purple-200/50 text-center relative animate-scale-up shadow-2xl text-slate-800">
              <button 
                onClick={() => { setPomodoroActive(false); setPomodoroOpen(false); }}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-purple-100/60 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <span className="text-[9px] font-black text-purple-800 bg-purple-100/60 border border-purple-200/30 px-2.5 py-1 rounded-full uppercase tracking-widest">
                  {pomodoroMode === 'focus' ? '🔥 Deep Focus Slot' : '🧘 System Break period'}
                </span>
                {pomodoroTask && (
                  <h4 className="text-xs font-extrabold text-slate-600 mt-3 truncate max-w-[250px] mx-auto">
                    Focusing on: {pomodoroTask.title}
                  </h4>
                )}
              </div>

              {/* Radial countdown ring */}
              <div className="relative w-44 h-44 flex items-center justify-center mx-auto my-2">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="88" cy="88" r="74" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="8" fill="transparent" />
                  <circle 
                    cx="88" cy="88" r="74" 
                    stroke={pomodoroMode === 'focus' ? '#8B5CF6' : '#10B981'} strokeWidth="8" fill="transparent" 
                    strokeDasharray="465"
                    strokeDashoffset={465 - (465 * (pomodoroTime / (pomodoroMode === 'focus' ? 25 * 60 : 5 * 60)))}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-violet-955 tracking-tight">
                    {Math.floor(pomodoroTime / 60)}:{(pomodoroTime % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mt-1">minutes remaining</span>
                </div>
              </div>

              {/* Pomodoro controls */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setPomodoroActive(!pomodoroActive)}
                  className={`px-6 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all ${
                    pomodoroActive 
                      ? 'bg-rose-500 text-white hover:bg-rose-600'
                      : 'bg-gradient-to-r from-violet-600 to-purple-500 text-white hover:scale-102 hover:shadow-purple-300'
                  }`}
                >
                  {pomodoroActive ? 'Pause Slot' : 'Begin Slot'}
                </button>
                <button
                  onClick={() => {
                    setPomodoroActive(false);
                    setPomodoroTime(pomodoroMode === 'focus' ? 25 * 60 : 5 * 60);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-purple-150 text-slate-650 bg-white hover:bg-purple-100/60 font-bold text-xs hover:scale-102 transition-transform"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
           UNDO DELETE FLOATING SNACKBAR
           ---------------------------------------------------- */}
        {showUndoSnackbar && deletedTaskCache && (
          <div className="fixed bottom-6 right-6 bg-slate-900/90 text-white px-5 py-4 rounded-2xl shadow-xl z-50 flex items-center justify-between gap-4 border border-white/10 glass-panel animate-pulse-subtle">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white">Objective removed</span>
                <span className="text-[10px] text-slate-400 truncate max-w-[12rem]">{deletedTaskCache.title}</span>
              </div>
            </div>
            
            <button
              onClick={handleUndoDelete}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          </div>
        )}

        {/* Placeholder space for clean bottom footer margins */}
        <div className="h-4" />

      </div>
    </div>
  );
};

export default TaskBoardPage;
