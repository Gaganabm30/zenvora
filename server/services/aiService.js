// Advanced Natural Language Processing and AI Heuristics Service
// Emulates deep contextual productivity insights and intelligent parsing.

export const predictPriority = (title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase();
  
  const highKeywords = ['urgent', 'deploy', 'fix', 'broken', 'critical', 'asap', 'crash', 'client', 'deadline', 'prod', 'production', 'security', 'hotfix'];
  const lowKeywords = ['read', 'explore', 'maybe', 'trivial', 'casual', 'cleanup', 'optional', 'some day', 'wishlist', 'minor', 'low-priority'];

  const hasHigh = highKeywords.some(keyword => text.includes(keyword));
  const hasLow = lowKeywords.some(keyword => text.includes(keyword));

  if (hasHigh) return 'high';
  if (hasLow) return 'low';
  return 'medium';
};

export const parseNaturalLanguageTask = (input = '') => {
  let text = input.trim();
  let priority = 'medium';
  let dueDate = null;
  let label = null;

  // Extract Priority: e.g. "priority high", "high priority", "/priority low", "p:high"
  const priorityRegex = /(?:priority\s+|p:|\/priority\s+)(high|medium|low)|(high|medium|low)\s+priority/i;
  const priorityMatch = text.match(priorityRegex);
  if (priorityMatch) {
    priority = (priorityMatch[1] || priorityMatch[2]).toLowerCase();
    text = text.replace(priorityRegex, '');
  } else {
    // Basic priority guess based on word content
    priority = predictPriority(text);
  }

  // Extract Due Date: e.g. "by 2026-06-01", "due tomorrow", "by next Friday", "due: 10/12/2026"
  const today = new Date();
  const dateRegex = /(?:due\s+|by\s+|due:\s*|by\s*Date:\s*)(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|tomorrow|today|next\s+week|next\s+friday)/i;
  const dateMatch = text.match(dateRegex);
  
  if (dateMatch) {
    const timeWord = dateMatch[1].toLowerCase();
    if (timeWord === 'today') {
      dueDate = new Date();
    } else if (timeWord === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      dueDate = tomorrow;
    } else if (timeWord === 'next week') {
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      dueDate = nextWeek;
    } else if (timeWord === 'next friday') {
      const nextFriday = new Date();
      const currentDay = today.getDay();
      const daysUntilFriday = (5 - currentDay + 7) % 7 || 7;
      nextFriday.setDate(today.getDate() + daysUntilFriday);
      dueDate = nextFriday;
    } else {
      dueDate = new Date(timeWord);
    }
    text = text.replace(dateRegex, '');
  }

  // Extract Label/Category inside brackets or tags: e.g. "[design]" or "#coding"
  const tagRegex = /(?:#|\[)(coding|design|marketing|finance|health|admin|study)(?:\])?/i;
  const tagMatch = text.match(tagRegex);
  if (tagMatch) {
    label = tagMatch[1].toLowerCase();
    text = text.replace(tagRegex, '');
  }

  // Cleanup extra spaces and special symbols
  let title = text
    .replace(/\s+/g, ' ')
    .replace(/^\s*-\s*/, '')
    .trim();

  // Capitalize first letter
  if (title) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  } else {
    title = 'New AI Task';
  }

  return {
    title,
    priority,
    dueDate,
    labels: label ? [label] : [],
    aiSuggestedPriority: priority
  };
};

export const generateTaskBreakdown = (title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('auth') || text.includes('login') || text.includes('signup')) {
    return [
      'Design frosted glass input forms and fields',
      'Create database schema and define secure hashing triggers',
      'Implement API authentication routes & validation logic',
      'Configure JWT token creation & secure client headers',
      'Test error handling, matching rules, and social login flow'
    ];
  }
  
  if (text.includes('ui') || text.includes('css') || text.includes('frontend') || text.includes('page') || text.includes('component')) {
    return [
      'Establish responsive grid systems and cinematic layouts',
      'Add backdrop blur values and glowing lavender shadows',
      'Integrate smooth Framer Motion/GSAP slide transitions',
      'Implement interactive light/dark mode overrides',
      'Review typography and click targets for visual balance'
    ];
  }

  if (text.includes('database') || text.includes('api') || text.includes('backend') || text.includes('server')) {
    return [
      'Define database models & Mongoose relation mappings',
      'Create custom Express middleware handlers for requests',
      'Write backend controller operations with validation catches',
      'Verify schema constraints and connection response cycles',
      'Establish visual console logs for active server triggers'
    ];
  }

  if (text.includes('test') || text.includes('bug') || text.includes('fix')) {
    return [
      'Replicate reported issue and record error stack trace',
      'Verify relevant code variables and state outputs',
      'Write automated assertion specs or API script tests',
      'Apply secure validation modifications',
      'Confirm functional performance post-update'
    ];
  }

  // Default breakdown checklist
  return [
    `Outline core parameters and requirements for "${title}"`,
    'Setup draft file assets or logic blueprints',
    'Develop initial functional prototype',
    'Review formatting, spacing, and styling details',
    'Conduct validation runs and mark task complete'
  ];
};

export const getAIProductivitySuggestions = (completedCount = 0, stressLevel = 5, mood = '🧘') => {
  if (stressLevel >= 8) {
    return {
      insight: 'Stress overload detected.',
      recommendation: 'You have logged high stress level today. We suggest pausing your work. Try launching "Focus Mode", toggle the "Lo-Fi Beats" track, and follow the 4-7-8 breathing exercises inside the Wellness Hub.',
      actionable: 'wellness_break'
    };
  }

  if (completedCount > 5) {
    return {
      insight: 'Outstanding streak achieved!',
      recommendation: 'You have finished a substantial number of goals today. Take a quick step outside or check out your streak levels in the Achievements catalog. Prevent cognitive fatigue!',
      actionable: 'view_achievements'
    };
  }

  if (mood === '😴' || mood === '🤯') {
    return {
      insight: 'Fatigue warning.',
      recommendation: 'Your mood indicates exhaustion or burnout. Consider scheduling your low-priority tasks for tomorrow and focus only on one major priority for the rest of today.',
      actionable: 'focus_pomodoro'
    };
  }

  // Default energetic recommendation
  return {
    insight: 'Optimal workspace state.',
    recommendation: 'Your focus and stress rates are in harmony! Utilize this session to build your core features and use natural language inputs to schedule your upcoming team cards.',
    actionable: 'task_board'
  };
};

export const analyzeWorkload = (tasks = []) => {
  const activeTasks = tasks.filter(t => t.status !== 'done');
  const highPriorityCount = activeTasks.filter(t => t.priority === 'high').length;
  
  if (activeTasks.length > 10) {
    return {
      status: 'warning',
      message: `Workload overload alert. You have ${activeTasks.length} active tasks. Focus on splitting larger goals into subtasks.`,
      action: 'Break down tasks'
    };
  }

  if (highPriorityCount >= 4) {
    return {
      status: 'warning',
      message: `High priority bottleneck. You have ${highPriorityCount} high priority items pending. AI suggests shifting at least two of these to medium priority or scheduling them later.`,
      action: 'Reschedule priorities'
    };
  }

  return {
    status: 'optimal',
    message: 'Your workload is perfectly balanced. Keep utilizing focus slots!',
    action: 'Continue focus'
  };
};
