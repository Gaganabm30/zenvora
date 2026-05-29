import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ZenvoraBackground from '../components/ZenvoraBackground';
import { Sparkles, Send, Trash2, ShieldCheck, ArrowRight } from 'lucide-react';

const AIAssistantPage = () => {
  const { token, API_HOST, user } = useAuth();
  
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Greeting operator. I am your ZENVORA core. How can I facilitate your productivity cycle today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText;
    const updatedMsgs = [...messages, { sender: 'user', text: userText }];
    setMessages(updatedMsgs);
    setInputText('');
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

        // If NLP task was parsed, notify user
        if (data.parsedTask) {
          setMessages(prev => [...prev, { 
            sender: 'ai', 
            text: `[SYSTEM] NLP Shortcut Activated! Created high priority task: "${data.parsedTask.title}" due tomorrow. Checked in task board.`,
            isSystem: true 
          }]);
        }
      } else {
        throw new Error();
      }
    } catch (err) {
      setTimeout(() => {
        setTyping(false);
        // Fallback local assistant response
        let reply = 'Backend offline, using local MERN NLP. Try typing: "/task Review PR #123 high priority" to test local parser!';
        const text = userText.toLowerCase();

        if (text.startsWith('/task')) {
          reply = `NLP Shortcut Triggered! Local engine parsed task: "${userText.replace('/task', '').trim()}" and synced to client board storage. Check the Task Board!`;
          // Trigger local task addition
          const saved = localStorage.getItem('zenvora_tasks') || '[]';
          const tasks = JSON.parse(saved);
          tasks.push({
            _id: Math.random().toString(),
            title: userText.replace('/task', '').trim(),
            status: 'todo',
            priority: 'high',
            labels: ['nlp'],
            subtasks: [{ title: 'Design hook', completed: false }]
          });
          localStorage.setItem('zenvora_tasks', JSON.stringify(tasks));
        } else if (text.includes('hello') || text.includes('hi')) {
          reply = `Hello ${user?.username || 'Operator'}. Baseline mindfulness logged at pure balance. I suggest a short lo-fi Pomodoro slot to sync outputs.`;
        } else if (text.includes('stress') || text.includes('tired')) {
          reply = 'High burnout markers detected. Wellness Core suggests starting a 5-minute breathing session in Focus Mode immediately.';
        }

        setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
      }, 1000);
    }
  };

  const handleClearChat = () => {
    setMessages([{ sender: 'ai', text: 'Zenvora chat history refreshed.' }]);
  };

  return (
    <div className="flex-1 p-8 overflow-hidden relative h-screen flex flex-col">
      <ZenvoraBackground mode="diagonal" />

      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col z-10 relative overflow-hidden space-y-6">
        
        {/* Header bar */}
        <header className="flex justify-between items-center shrink-0">
          <div className="text-left">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>Cognitive Assistant</span>
              <Sparkles className="w-5 h-5 text-zenvora-500" />
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Simulated neural feedback and automation command logs</p>
          </div>

          <button
            onClick={handleClearChat}
            className="p-2.5 rounded-xl bg-white hover:bg-rose-50 border border-purple-100 text-slate-400 hover:text-rose-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </header>

        {/* ----------------------------------------------------
           CHAT CHANNELS CONTAINER
           ---------------------------------------------------- */}
        <div className="flex-1 glass-panel rounded-3xl p-6 overflow-y-auto flex flex-col space-y-4">
          
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] p-4 rounded-2xl text-left text-xs leading-relaxed font-semibold ${
                msg.isSystem
                  ? 'bg-purple-100 border border-purple-200 text-zenvora-700'
                  : msg.sender === 'user'
                  ? 'bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white rounded-tr-none shadow-md'
                  : 'bg-white border border-purple-100/60 text-slate-700 rounded-tl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing placeholder */}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-white border border-purple-100/60 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Smart Prompts Chips */}
        <div className="flex flex-wrap gap-2 pt-1 justify-start shrink-0">
          {[
            { label: 'Create high task', text: '/task Implement JWT login schema high priority' },
            { label: 'Analyze Stress Index', text: 'My stress rates are slightly high today, suggest mindfulness break' },
            { label: 'Explore Achievements', text: 'How do I unlock Level 3 Ascendant badges?' }
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(prompt.text)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-purple-50 text-slate-500 hover:text-zenvora-600 border border-purple-100/50 text-[10px] font-bold transition-all"
            >
              {prompt.label}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="flex gap-3 shrink-0">
          <input
            type="text"
            required
            placeholder="Type your instruction or use NLP shortcut `/task ...`"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-3.5 rounded-2xl glass-input text-xs font-semibold text-slate-700 shadow-sm"
          />
          <button
            type="submit"
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white font-extrabold shadow-md hover:shadow-purple-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

export default AIAssistantPage;
