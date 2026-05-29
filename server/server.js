import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import User from './models/User.js';
import Task from './models/Task.js';
import Team from './models/Team.js';
import Wellness from './models/Wellness.js';
import { 
  parseNaturalLanguageTask, 
  generateTaskBreakdown, 
  getAIProductivitySuggestions, 
  analyzeWorkload 
} from './services/aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, './.env') });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'zenvora_cosmic_secret_key';

// Middleware
app.use(cors());
app.use(express.json());

// Graceful Database Connection
connectDB();

// ----------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// ----------------------------------------------------
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Calibrate active daily active streak helper
const calibrateStreak = async (user) => {
  if (!user) return;
  const today = new Date();
  today.setHours(0,0,0,0);
  
  if (!user.lastActiveDate) {
    user.streak = 1;
    user.lastActiveDate = new Date();
    return;
  }
  
  const lastActive = new Date(user.lastActiveDate);
  lastActive.setHours(0,0,0,0);
  
  const diffTime = today.getTime() - lastActive.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    user.streak += 1;
    user.xp += 50; // Give +50 XP for consecutive streak days!
  } else if (diffDays > 1) {
    user.streak = 1;
  }
  user.lastActiveDate = new Date();
};

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'Username or Email already registered' });
    }

    const user = await User.create({
      username,
      email,
      password
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        achievements: user.achievements,
        avatar: user.avatar,
        onboardingCompleted: user.onboardingCompleted
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'No account found with that email. Please sign up first.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Calibrate and update active streak
    await calibrateStreak(user);
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        achievements: user.achievements,
        avatar: user.avatar,
        onboardingCompleted: user.onboardingCompleted
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get User Profile
app.get('/api/auth/me', protect, async (req, res) => {
  res.json({
    _id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    xp: req.user.xp,
    level: req.user.level,
    streak: req.user.streak,
    achievements: req.user.achievements,
    avatar: req.user.avatar,
    onboardingCompleted: req.user.onboardingCompleted
  });
});

// Update Onboarding/Profile Settings
app.put('/api/auth/profile', protect, async (req, res) => {
  const { avatar, onboardingCompleted, username } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (avatar) user.avatar = avatar;
    if (username) user.username = username;
    if (onboardingCompleted !== undefined) user.onboardingCompleted = onboardingCompleted;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete User Account & Associated Telemetry
app.delete('/api/auth/profile', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    // 1. Purge all user tasks
    await Task.deleteMany({ user: userId });
    // 2. Purge all user wellness logs
    await Wellness.deleteMany({ user: userId });
    // 3. Purge user profile record
    await User.findByIdAndDelete(userId);
    
    res.json({ message: 'User account and all associated telemetry deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Evaluate and sync user achievements
app.post('/api/achievements/evaluate', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Calibrate streak on check
    await calibrateStreak(user);

    const allTasks = await Task.find({ user: req.user._id });
    const completedTasks = allTasks.filter(t => t.status === 'done');
    const completedCount = completedTasks.length;

    const wellnessLogs = await Wellness.find({ user: req.user._id });
    const focusSessions = wellnessLogs.filter(w => w.focusTimeMinutes > 0);
    const focusCount = focusSessions.length;
    const totalFocusMinutes = focusSessions.reduce((acc, curr) => acc + curr.focusTimeMinutes, 0);
    const totalFocusHours = parseFloat((totalFocusMinutes / 60).toFixed(1));

    // Dynamic Achievements check
    let newlyUnlocked = [];

    // 1. Task Master
    if (completedCount >= 50 && !user.achievements.some(a => a.id === 'task_master')) {
      const achObj = { id: 'task_master', title: 'Task Master', description: 'Conquered and archived 50 deep focus objectives.' };
      user.achievements.push(achObj);
      newlyUnlocked.push(achObj);
      user.xp += 100;
    }

    // 2. Focus Champion
    if (focusCount >= 20 && !user.achievements.some(a => a.id === 'focus_champion')) {
      const achObj = { id: 'focus_champion', title: 'Focus Champion', description: 'Logged 20 deep focus countdown blocks.' };
      user.achievements.push(achObj);
      newlyUnlocked.push(achObj);
      user.xp += 80;
    }

    // 3. Streak Legend
    if (user.streak >= 7 && !user.achievements.some(a => a.id === 'streak_legend')) {
      const achObj = { id: 'streak_legend', title: 'Streak Legend', description: 'Maintained a legendary 7-day focus streak.' };
      user.achievements.push(achObj);
      newlyUnlocked.push(achObj);
      user.xp += 50;
    }

    // 4. Deadline Hero
    const tasksDoneBeforeDeadline = completedTasks.filter(t => t.dueDate && new Date(t.updatedAt || Date.now()) <= new Date(t.dueDate));
    if (tasksDoneBeforeDeadline.length > 0 && !user.achievements.some(a => a.id === 'deadline_hero')) {
      const achObj = { id: 'deadline_hero', title: 'Deadline Hero', description: 'Defeated time by archiving an objective before the deadline.' };
      user.achievements.push(achObj);
      newlyUnlocked.push(achObj);
      user.xp += 40;
    }

    // 5. Consistency King
    if (completedCount >= 15 && user.streak >= 3 && !user.achievements.some(a => a.id === 'consistency_king')) {
      const achObj = { id: 'consistency_king', title: 'Consistency King', description: 'Showed outstanding workplace stability and task flow consistency.' };
      user.achievements.push(achObj);
      newlyUnlocked.push(achObj);
      user.xp += 60;
    }

    // 6. First Task check
    if (completedCount >= 1 && !user.achievements.some(a => a.id === 'first_task')) {
      const achObj = { id: 'first_task', title: 'First Quantum Step', description: 'Successfully archived your first focus objective.' };
      user.achievements.push(achObj);
      newlyUnlocked.push(achObj);
      user.xp += 20;
    }

    // 7. Celestial Scholar (Level 5)
    if (user.level >= 5 && !user.achievements.some(a => a.id === 'level_5')) {
      const achObj = { id: 'level_5', title: 'Celestial Scholar', description: 'Ascend to Level 5 tier.' };
      user.achievements.push(achObj);
      newlyUnlocked.push(achObj);
      user.xp += 100;
    }

    // Update level based on XP
    const calculatedLevel = Math.floor(user.xp / 100) + 1;
    let LeveledUp = false;
    if (calculatedLevel > user.level) {
      user.level = calculatedLevel;
      LeveledUp = true;
      if (!user.achievements.some(a => a.id === `level_${calculatedLevel}`)) {
        user.achievements.push({
          id: `level_${calculatedLevel}`,
          title: `Ascendant Level ${calculatedLevel}`,
          description: `Unlocked by climbing to level ${calculatedLevel}!`
        });
      }
    }

    await user.save();

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        achievements: user.achievements,
        avatar: user.avatar
      },
      stats: {
        completedTasks: completedCount,
        focusSessions: focusCount,
        focusHours: totalFocusHours,
        totalTasks: allTasks.length
      },
      newlyUnlocked,
      leveledUp: LeveledUp
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Real registered users sorted by XP
app.get('/api/users/leaderboard', protect, async (req, res) => {
  try {
    const users = await User.find({})
      .select('username xp level streak avatar')
      .sort({ xp: -1 })
      .limit(10);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------------------------------------
// TASK BOARD ROUTES
// ----------------------------------------------------

// Get All Tasks for a User
app.get('/api/tasks', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create New Task (optionally parsed using NLP or custom breakdowns)
app.post('/api/tasks', protect, async (req, res) => {
  const { title, description, status, priority, dueDate, labels, isNlpInput } = req.body;
  
  try {
    let taskData = {
      user: req.user._id,
      title,
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      labels: labels || []
    };

    // If input is flagged for natural language NLP parsing
    if (isNlpInput && title) {
      const parsed = parseNaturalLanguageTask(title);
      taskData = {
        ...taskData,
        title: parsed.title,
        priority: parsed.priority,
        dueDate: parsed.dueDate || taskData.dueDate,
        labels: parsed.labels.length > 0 ? parsed.labels : taskData.labels,
        aiSuggestedPriority: parsed.aiSuggestedPriority
      };
    }

    // Automatically generate AI Subtask Checklist Breakdown
    taskData.aiBreakdown = generateTaskBreakdown(taskData.title, taskData.description);
    taskData.subtasks = taskData.aiBreakdown.map(subTitle => ({
      title: subTitle,
      completed: false
    }));

    const task = await Task.create(taskData);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Task (including Kanban column transitions)
app.put('/api/tasks/:id', protect, async (req, res) => {
  const { title, description, status, priority, dueDate, subtasks } = req.body;
  try {
    const activeTask = await Task.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!activeTask) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    if (title) activeTask.title = title;
    if (description !== undefined) activeTask.description = description;
    if (status) activeTask.status = status;
    if (priority) activeTask.priority = priority;
    if (dueDate !== undefined) activeTask.dueDate = dueDate;
    if (subtasks) activeTask.subtasks = subtasks;

    // Gamification: Give user XP when moving a task to 'done'
    const wasDone = activeTask.status === 'done';
    const isDoneNow = status === 'done';
    
    await activeTask.save();

    if (!wasDone && isDoneNow) {
      const user = await User.findById(req.user._id);
      
      // XP: Completing high-priority task → +25 XP, standard → +10 XP
      const xpReward = activeTask.priority === 'high' ? 25 : 10;
      user.xp += xpReward;
      
      const allTasks = await Task.find({ user: req.user._id });
      const completedTasks = allTasks.filter(t => t.status === 'done');
      const completedCount = completedTasks.length;

      // Deadline Hero check
      if (activeTask.dueDate && new Date() <= new Date(activeTask.dueDate)) {
        if (!user.achievements.some(a => a.id === 'deadline_hero')) {
          user.achievements.push({
            id: 'deadline_hero',
            title: 'Deadline Hero',
            description: 'Defeated time by archiving an objective before the deadline.'
          });
        }
      }

      // Task Master check
      if (completedCount >= 50 && !user.achievements.some(a => a.id === 'task_master')) {
        user.achievements.push({
          id: 'task_master',
          title: 'Task Master',
          description: 'Conquered and archived 50 deep focus objectives.'
        });
      }

      // First Task check
      if (completedCount >= 1 && !user.achievements.some(a => a.id === 'first_task')) {
        user.achievements.push({
          id: 'first_task',
          title: 'First Quantum Step',
          description: 'Successfully archived your first focus objective.'
        });
      }

      // Consistency King check
      if (completedCount >= 15 && user.streak >= 3 && !user.achievements.some(a => a.id === 'consistency_king')) {
        user.achievements.push({
          id: 'consistency_king',
          title: 'Consistency King',
          description: 'Showed outstanding workplace stability and task flow consistency.'
        });
      }

      // Level calibration
      const calculatedLevel = Math.floor(user.xp / 100) + 1;
      if (calculatedLevel > user.level) {
        user.level = calculatedLevel;
        if (!user.achievements.some(a => a.id === `level_${calculatedLevel}`)) {
          user.achievements.push({
            id: `level_${calculatedLevel}`,
            title: `Ascendant Level ${calculatedLevel}`,
            description: `Unlocked by climbing to level ${calculatedLevel}!`
          });
        }
      }

      await user.save();
    }

    res.json(activeTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Task
app.delete('/api/tasks/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------------------------------------
// WELLNESS ROUTING
// ----------------------------------------------------

// Log a new wellness entry
app.post('/api/wellness', protect, async (req, res) => {
  const { mood, stressLevel, sleepHours, focusTimeMinutes, notes } = req.body;
  try {
    // Burnout risk is calculated: (stressLevel * 8) - (sleepHours * 4) + (focusTimeMinutes > 120 ? 15 : 0)
    let burnoutRiskScore = (stressLevel * 8) - (sleepHours * 4) + (focusTimeMinutes > 120 ? 15 : 0);
    burnoutRiskScore = Math.max(0, Math.min(100, burnoutRiskScore)); // Clamped between 0-100

    const wellnessEntry = await Wellness.create({
      user: req.user._id,
      mood,
      stressLevel,
      sleepHours,
      focusTimeMinutes,
      burnoutRiskScore,
      notes
    });

    // Gamification XP: focus session log → +20 XP, general self-care → +15 XP
    const user = await User.findById(req.user._id);
    if (focusTimeMinutes > 0) {
      user.xp += 20;
    } else {
      user.xp += 15;
    }
    
    // Check if stress is optimal and mood is meditative
    if (mood === '🧘' && !user.achievements.some(a => a.id === 'zen_seeker')) {
      user.achievements.push({
        id: 'zen_seeker',
        title: 'Zen Seeker',
        description: 'Mindfulness rating logged at pure state of balance.'
      });
    }

    // Focus Champion check (20 focus sessions)
    const wellnessLogs = await Wellness.find({ user: req.user._id });
    const focusSessions = wellnessLogs.filter(w => w.focusTimeMinutes > 0);
    const focusCount = focusSessions.length + (focusTimeMinutes > 0 ? 1 : 0);
    if (focusCount >= 20 && !user.achievements.some(a => a.id === 'focus_champion')) {
      user.achievements.push({
        id: 'focus_champion',
        title: 'Focus Champion',
        description: 'Logged 20 deep focus countdown blocks.'
      });
    }

    // Level calibration
    const calculatedLevel = Math.floor(user.xp / 100) + 1;
    if (calculatedLevel > user.level) {
      user.level = calculatedLevel;
    }

    await user.save();
    res.status(201).json(wellnessEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch Wellness History & Overviews
app.get('/api/wellness', protect, async (req, res) => {
  try {
    const logs = await Wellness.find({ user: req.user._id }).sort({ date: -1 }).limit(10);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------------------------------------
// AI ASSISTANT CHAT ROUTING
// ----------------------------------------------------
app.post('/api/ai/chat', protect, async (req, res) => {
  const { message } = req.body;
  try {
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content required.' });
    }

    const text = message.toLowerCase().trim();

    // 1. OUT-OF-SCOPE FILTERING (Jokes, general knowledge, math equations, code generation, random chat)
    const outOfScopeKeywords = [
      'code', 'javascript', 'python', 'java', 'html', 'css', 'react', 'function', 'class', 'loop', 'write a script',
      'president', 'capital of', 'trivia', 'joke', 'funny', 'math', 'equation', 'solve', 'algebra', 'calculus', '+', '*',
      'politics', 'election', 'movie', 'song', 'actor', 'music', 'game', 'weather', 'news', 'recipe', 'cooking', 'who is'
    ];
    
    // Check if the user is asking an obviously unrelated question
    const isOutOfScope = outOfScopeKeywords.some(keyword => {
      // Avoid false positives for workspace-related terms like "css" or "task priority"
      if (keyword === 'css' && (text.includes('task') || text.includes('workspace') || text.includes('ui'))) return false;
      return text.includes(keyword);
    });

    if (isOutOfScope) {
      return res.json({
        reply: "I can only assist with productivity management and workspace-related actions inside ZENVORA. Please ask questions related to task management, focus mode, productivity scores, schedules, or workflows."
      });
    }

    // 2. FETCH REAL CONTEXT DATA
    const tasks = await Task.find({ user: req.user._id });
    const wellnessLogs = await Wellness.find({ user: req.user._id }).sort({ date: -1 });

    const totalCount = tasks.length;
    const doneCount = tasks.filter(t => t.status === 'done').length;
    const pendingCount = tasks.filter(t => t.status !== 'done').length;
    
    const overdueTasks = tasks.filter(t => {
      if (t.status === 'done' || !t.dueDate) return false;
      return new Date(t.dueDate) < new Date();
    });

    // 3. VALID TOPIC HANDLERS
    let reply = "";
    let action = null;
    let createdTask = null;

    // A. OVERDUE TASKS INQUIRY
    if (text.includes('overdue') || text.includes('late') || text.includes('delayed')) {
      if (overdueTasks.length > 0) {
        reply = `You currently have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}:\n` + 
          overdueTasks.map(t => `• **${t.title}** (Priority: *${t.priority.toUpperCase()}*, Due: ${new Date(t.dueDate).toLocaleDateString()})`).join('\n');
      } else {
        reply = "Splendid! You have no overdue tasks on your Kanban board. Your deadline discipline is top notch.";
      }
    }
    // B. START FOCUS MODE / LAUNCH POMODORO
    else if (text.includes('start focus') || text.includes('launch focus') || text.includes('start pomodoro') || text.includes('focus mode')) {
      reply = "Launching a 45-minute deep focus session. Initializing stopwatch and locking distraction blocks...";
      action = "start_focus";
    }
    // C. PLAN MY DAY / SUGGEST SCHEDULE
    else if (text.includes('plan my day') || text.includes('suggest schedule') || text.includes('my schedule') || text.includes('plan today')) {
      const activeList = tasks.filter(t => t.status !== 'done').slice(0, 2);
      const slot1 = activeList[0] ? activeList[0].title : "UI Component Refining";
      const slot2 = activeList[1] ? activeList[1].title : "Database Pipeline Sync";
      
      reply = `Suggested Schedule:\n` +
        `• **9:00 AM** → Focus Session: *${slot1}*\n` +
        `• **11:00 AM** → Pomodoro Deep Focus Chamber (Stopwatch Mode)\n` +
        `• **1:00 PM** → Focus Session: *${slot2}*\n` +
        `• **3:00 PM** → Wellness breathing & Checkpoints Review`;
    }
    // D. PRODUCTIVITY SCORE / ANALYTICS
    else if (text.includes('productivity score') || text.includes('my score') || text.includes('analytics') || text.includes('completion rate')) {
      const score = totalCount > 0 ? Math.min(100, Math.max(10, doneCount * 15 - overdueTasks.length * 20 + 70)) : 0;
      const ratio = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
      reply = `Your current productivity score is **${score}%**.\nYou have completed **${doneCount}** out of **${totalCount}** tasks, yielding a **${ratio}%** completion consistency rate this week.`;
    }
    // E. NATURAL LANGUAGE TASK CREATION & BREAKDOWNS
    else if (text.startsWith('create') || text.startsWith('add') || text.startsWith('finish') || text.startsWith('build') || text.includes('tomorrow') || text.includes('by next')) {
      // Use NLP parser to extract values
      const parsed = parseNaturalLanguageTask(message.replace(/^(create|add|new)\s+(task|objective)?\s*/i, ''));
      
      const taskData = {
        user: req.user._id,
        title: parsed.title,
        description: `Assembled automatically via AI Productivity Assistant`,
        status: 'todo',
        priority: parsed.priority || 'medium',
        dueDate: parsed.dueDate || new Date(Date.now() + 86400000), // Default tomorrow
        labels: parsed.labels.length > 0 ? parsed.labels : ['ai-assistant']
      };

      // Automatically generate subtasks breakdown
      const subtaskTitles = generateTaskBreakdown(taskData.title, '');
      taskData.subtasks = subtaskTitles.map(tTitle => ({
        title: tTitle,
        completed: false
      }));

      const created = await Task.create(taskData);
      createdTask = created;

      reply = `Objective assembled! I have registered your new task on the Kanban board:\n` +
        `🎯 **Title**: ${created.title}\n` +
        `⏰ **Due Date**: ${new Date(created.dueDate).toLocaleDateString()}\n` +
        `⚡ **Priority**: ${created.priority.toUpperCase()}\n\n` +
        `*AI Subtask Checklist Breakdown generated:*` +
        created.subtasks.map(s => `\n- [ ] ${s.title}`).join('');
    }
    // F. PRODUCTIVITY INSIGHTS
    else if (text.includes('insight') || text.includes('recommendation') || text.includes('burnout') || text.includes('tips')) {
      reply = `ZENVORA Workspace Insights:\n` +
        `• **Evening Peak**: You log focus blocks more consistently during evening slots.\n` +
        `• **Fatigue Markers**: Your focus accuracy declines after 90 minutes. We recommend a 5-minute breathing recovery.\n` +
        `• **Priority Drift**: High-priority tasks are delayed 22% more frequently. Break them down early!`;
    }
    // G. DEFAULT HELP / GREETING
    else {
      reply = `Hello ${req.user.username}. I am your ZENVORA Core companion. I can assist you with:\n` +
        `• Checking overdue deadlines (*"What tasks are overdue?"*)\n` +
        `• Planning your workflow (*"Plan my day"*)\n` +
        `• Creating new objectives (*"Finish UI redesign tomorrow at 7 PM"*)\n` +
        `• Tracking productivity score (*"What is my productivity score?"*)\n` +
        `• Launching pomodoro focus blocks (*"Start focus mode"*)`;
    }

    res.json({
      reply,
      action,
      parsedTask: createdTask
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------------------------------------
// TEAM COLLABORATION ROUTES
// ----------------------------------------------------

// Create Team Workspace
app.post('/api/teams', protect, async (req, res) => {
  const { name } = req.body;
  try {
    const team = await Team.create({
      name,
      owner: req.user._id,
      members: [req.user._id]
    });
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Join Team
app.post('/api/teams/join', protect, async (req, res) => {
  const { teamId } = req.body;
  try {
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team workspace not found' });

    if (team.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already a member of this workspace' });
    }

    team.members.push(req.user._id);
    await team.save();

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get User's Joined Teams
app.get('/api/teams', protect, async (req, res) => {
  try {
    const teams = await Team.find({ members: req.user._id })
      .populate('members', 'username email avatar')
      .populate('owner', 'username email avatar');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------------------------------------
// REAL-TIME WEBSOCKET HANDLERS
// ----------------------------------------------------
io.on('connection', (socket) => {
  console.log(`Socket Client Connected: ${socket.id}`);

  socket.on('join_team', ({ teamId, user }) => {
    socket.join(teamId);
    console.log(`User ${user} joined workspace room: ${teamId}`);
  });

  socket.on('send_message', async ({ teamId, sender, content }) => {
    try {
      const team = await Team.findById(teamId);
      if (team) {
        const messageObject = { sender, content, createdAt: new Date() };
        team.messages.push(messageObject);
        await team.save();

        const populatedTeam = await Team.findById(teamId)
          .populate('messages.sender', 'username avatar');
        const latestMessage = populatedTeam.messages[populatedTeam.messages.length - 1];

        io.to(teamId).emit('receive_message', latestMessage);
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('update_notes', async ({ teamId, notes }) => {
    try {
      const team = await Team.findById(teamId);
      if (team) {
        team.notes = notes;
        await team.save();
        socket.to(teamId).emit('receive_notes_update', notes);
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket Client Disconnected: ${socket.id}`);
  });
});

// Public Stats Route (no auth needed — for landing page)
app.get('/api/stats', async (req, res) => {
  try {
    const [totalUsers, totalTasks] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
    ]);
    res.json({ totalUsers, totalTasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Root Route
app.get('/', (req, res) => {
  res.send('Zenvora Futuristic API Server Active.');
});


// Bootstrapper
server.listen(PORT, () => {
  console.log(`Zenvora MERN Server listening on Port: ${PORT}`);
});
