import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Send, Mic, MicOff, MessageSquare, X, Trash2, Play } from 'lucide-react';

const FloatingAIAssistant = () => {
  const { token, API_HOST, user } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    { 
      sender: 'ai', 
      text: `Greetings ${user?.username || 'Operator'}. I am your ZENVORA Productivity Intelligence Core. How can I facilitate your productivity workflows today?` 
    }
  ]);
  const [typing, setTyping] = useState(false);
  
  // Voice speech states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const scrollRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  }, [messages, typing, isOpen]);

  // Speech Recognition Initializer
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          // Auto submit spoken transcription
          handleVoiceSubmit(transcript);
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Voice recording toggle
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Voice speech recognition is unsupported in this browser node. We recommend Google Chrome.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleVoiceSubmit = async (transcriptText) => {
    if (!transcriptText.trim()) return;
    submitMessage(transcriptText);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    submitMessage(inputText);
    setInputText('');
  };

  const submitMessage = async (textToSend) => {
    const userText = textToSend;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setTyping(true);

    try {
      const res = await fetch(`${API_HOST}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userText })
      });

      if (res.ok) {
        const data = await res.json();
        setTyping(false);
        setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);

        // Automatic Page Redirect Actions (e.g. Navigation Focus)
        if (data.action === 'start_focus') {
          setTimeout(() => {
            navigate('/focus');
            setIsOpen(false);
          }, 1500);
        }
      } else {
        throw new Error("API Connection Node Rejected");
      }
    } catch (err) {
      console.warn("Backend offline, utilizing local MERN NLP parser.");
      setTimeout(() => {
        setTyping(false);
        let reply = "I can only assist with productivity management and workspace-related actions inside ZENVORA. Try typing: 'Plan my day' or 'What tasks are overdue?'";
        
        const norm = userText.toLowerCase().trim();
        
        // Offline filters
        const outOfScopeKeywords = [
          'code', 'javascript', 'python', 'java', 'html', 'css', 'react', 'function', 'class', 'loop',
          'president', 'trivia', 'joke', 'funny', 'math', 'solve', 'equation', 'politics', 'movie', 'game'
        ];
        
        const isOutOfScopeOffline = outOfScopeKeywords.some(k => norm.includes(k));
        
        if (isOutOfScopeOffline) {
          reply = "I can only assist with productivity management and workspace-related actions inside ZENVORA.";
        } else if (norm.includes('hello') || norm.includes('hi') || norm.includes('hey')) {
          reply = `Hello ${user?.username || 'Operator'}. I suggest a short Pomodoro stopwatch slot to sync today's focus goals.`;
        } else if (norm.includes('overdue') || norm.includes('late')) {
          // Read local tasks
          try {
            const local = localStorage.getItem('zenvora_tasks_v2');
            if (local) {
              const tasksParsed = JSON.parse(local);
              const overdueTasks = tasksParsed.filter(t => {
                if (t.status === 'done' || !t.dueDate) return false;
                return new Date(t.dueDate) < new Date();
              });
              if (overdueTasks.length > 0) {
                reply = `You currently have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} (offline sync):\n` +
                  overdueTasks.map(t => `• **${t.title}** (Priority: *${t.priority.toUpperCase()}*)`).join('\n');
              } else {
                reply = "Fantastic! You have no overdue tasks on your offline local board database.";
              }
            } else {
              reply = "You have no tasks on your offline local Kanban database.";
            }
          } catch (e) {
            reply = "You have no overdue tasks currently mapped.";
          }
        } else if (norm.includes('start focus') || norm.includes('launch focus') || norm.includes('focus mode')) {
          reply = "Launching deep focus stopwatch session...";
          setTimeout(() => {
            navigate('/focus');
            setIsOpen(false);
          }, 1500);
        } else if (norm.includes('plan today') || norm.includes('plan my day') || norm.includes('schedule')) {
          reply = `Suggested Schedule:\n• **9:00 AM** → Focus Session: UI Refining\n• **11:00 AM** → Pomodoro Deep Focus Stopwatch\n• **1:00 PM** → Focus Session: Database Sync\n• **3:00 PM** → Wellness breathing recovery`;
        } else if (norm.includes('score') || norm.includes('productivity')) {
          try {
            const local = localStorage.getItem('zenvora_tasks_v2');
            let countTotal = 0;
            let countDone = 0;
            if (local) {
              const parsed = JSON.parse(local);
              countTotal = parsed.length;
              countDone = parsed.filter(t => t.status === 'done').length;
            }
            const ratio = countTotal > 0 ? Math.round((countDone / countTotal) * 100) : 0;
            reply = `Your offline workspace productivity score is **${ratio}%**. Completed **${countDone}** out of **${countTotal}** tasks.`;
          } catch (e) {
            reply = "Productivity metrics are clean. Focus mode stopwatch active.";
          }
        } else if (norm.startsWith('create') || norm.startsWith('add') || norm.startsWith('finish') || norm.startsWith('build')) {
          // Offline task creation
          try {
            const local = localStorage.getItem('zenvora_tasks_v2') || '[]';
            const tasksList = JSON.parse(local);
            const titleVal = userText.replace(/^(create|add|new)\s+(task|objective)?\s*/i, '');
            const newTask = {
              _id: `offline_${Math.random()}`,
              title: titleVal || 'Offline AI Task',
              status: 'todo',
              priority: 'high',
              dueDate: new Date(Date.now() + 86400000).toISOString(),
              labels: ['offline-ai'],
              subtasks: [
                { title: 'Outline parameters', completed: false },
                { title: 'Functional prototype', completed: false },
                { title: 'Conduct validation review', completed: false }
              ]
            };
            tasksList.push(newTask);
            localStorage.setItem('zenvora_tasks_v2', JSON.stringify(tasksList));
            reply = `Objective assembled! I have registered your new task offline:\n🎯 **Title**: ${newTask.title}\n⏰ **Due Date**: Tomorrow\n⚡ **Priority**: HIGH\n\n*AI Subtask Checklist Breakdown generated:*` +
              newTask.subtasks.map(s => `\n- [ ] ${s.title}`).join('');
          } catch (err) {
            reply = "Failed saving task to local database.";
          }
        }

        setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
      }, 1000);
    }
  };

  const handleClearHistory = () => {
    setMessages([{ 
      sender: 'ai', 
      text: 'Zenvora chat history refreshed. Workspace intelligence online.' 
    }]);
  };

  return (
    <>
      {/* ═══════════════════════ CHAT SIDEBAR PANEL ═══════════════════════ */}
      {isOpen && (
        <div className="w-[25rem] h-screen fixed top-0 right-0 z-50 lavender-glass-panel rounded-l-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-right text-left border-l border-purple-300/40">
          
          {/* Header Panel */}
          <header className="p-4 bg-gradient-to-r from-violet-600 to-purple-500 text-white flex justify-between items-center shadow shrink-0">
            <div className="flex items-center gap-2.5">
              {/* Glowing Orb Animation */}
              <div className="relative w-7 h-7 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-white animate-ping" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight leading-tight">Productivity Core</h3>
                <span className="text-[9px] font-bold text-violet-200 uppercase tracking-widest block mt-0.5">Workspace AI</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={handleClearHistory}
                title="Clear logs"
                className="p-1.5 rounded-lg hover:bg-white/10 text-violet-200 hover:text-white transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-violet-200 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-purple-50/10">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-3.5 rounded-2xl text-[11px] font-semibold leading-relaxed whitespace-pre-line shadow-sm border ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-violet-600 to-purple-500 border-violet-400 text-white rounded-tr-none'
                    : 'bg-white/95 border-purple-200/60 text-slate-800 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing thinking indicator */}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white/95 border border-purple-200/60 p-3.5 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.18s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.36s]" />
                </div>
              </div>
            )}
            
            <div ref={scrollRef} />
          </div>

          {/* Input Panel Form */}
          <form onSubmit={handleFormSubmit} className="p-3 bg-white/80 border-t border-purple-200/40 flex gap-2 items-center shrink-0 pb-6">
            {/* Real-time Voice Speech Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              title={isListening ? "Stop listening" : "Start voice task"}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                isListening 
                  ? 'bg-rose-500 border-rose-600 text-white animate-pulse'
                  : 'bg-white hover:bg-purple-50 border-purple-200 text-slate-400 hover:text-violet-600'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              required
              placeholder="e.g. Finish UI tomorrow at 7 PM"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl glass-input text-[11px] font-semibold text-slate-800 placeholder-slate-400"
            />
            
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow hover:opacity-90 active:scale-95 transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

      {/* ═══════════════════════ TRIGGER & CLOSE ACTION FLOATER ═══════════════════════ */}
      <div 
        className={`fixed bottom-6 z-50 flex items-center gap-3 transition-all duration-300 ease-out ${
          isOpen ? 'right-[26.5rem]' : 'right-6'
        }`}
      >
        {isOpen && (
          <button
            onClick={() => setIsOpen(false)}
            className="px-5 py-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-extrabold text-xs shadow-lg shadow-rose-200/50 hover:shadow-rose-300/50 active:scale-95 hover:scale-105 transition-all duration-200 uppercase tracking-wider flex items-center gap-1.5 border border-rose-400/20 animate-scale-up"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close Chat</span>
          </button>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          title="AI Companion"
          className="w-20 h-20 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 relative group"
          style={{
            boxShadow: '0 0 30px rgba(124, 58, 237, 0.45), 0 0 0 4px rgba(167, 139, 250, 0.15)'
          }}
        >
          <Sparkles className="w-9 h-9 animate-float" />
          {/* Soft blur overlay ring */}
          <span className="absolute inset-0 rounded-full bg-violet-600/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>
    </>
  );
};

export default FloatingAIAssistant;
