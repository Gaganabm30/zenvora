import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ZenvoraBackground from '../components/ZenvoraBackground';
import { io } from 'socket.io-client';
import { Sparkles, Users, MessageSquare, Send, CheckSquare, Plus, FileText } from 'lucide-react';

const TeamCollaborationPage = () => {
  const { user, token, API_HOST } = useAuth();
  
  // Teams and Active selections
  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [joinTeamId, setJoinTeamId] = useState('');

  // Live Sync states
  const [chatMessages, setChatMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [collaborativeNotes, setCollaborativeNotes] = useState('');
  
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  // 1. Load Joins and Workspace Lists
  const loadWorkspaces = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/teams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
        if (data.length > 0) {
          handleSelectTeam(data[0]);
        }
      }
    } catch (err) {
      console.warn('Backend offline, utilizing client collaboration fallback panels:');
      const defaultTeams = [
        { _id: 'team_alpha', name: 'Quantum Core Developers', members: [{ username: 'omegaCoder' }], notes: '# Quantum Core Notes\n\n- [x] Configure websocket nodes\n- [ ] Design glass sliders' }
      ];
      setTeams(defaultTeams);
      handleSelectTeam(defaultTeams[0]);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, [token]);

  // 2. Select Team and Socket join
  const handleSelectTeam = (team) => {
    setActiveTeam(team);
    setCollaborativeNotes(team.notes || '');
    setChatMessages(team.messages || [
      { sender: { username: 'System Core' }, content: `Welcome to the ${team.name} workspace. live sync channel engaged.` }
    ]);

    // Establish WebSocket Connection
    if (socketRef.current) socketRef.current.disconnect();

    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.emit('join_team', {
      teamId: team._id,
      user: user?.username
    });

    // Message listener
    socketRef.current.on('receive_message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    // Collaborative Notepad notes listener
    socketRef.current.on('receive_notes_update', (updatedNotes) => {
      setCollaborativeNotes(updatedNotes);
    });
  };

  // Clean socket connections on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName) return;

    try {
      const res = await fetch(`${API_HOST}/api/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newTeamName })
      });
      if (res.ok) {
        const team = await res.json();
        setTeams([...teams, team]);
        handleSelectTeam(team);
      }
    } catch (err) {
      // Local fallback
      const mockTeam = {
        _id: `team_${Math.random().toString()}`,
        name: newTeamName,
        members: [{ username: user?.username }],
        notes: `# ${newTeamName} Notes\n\nStart typing collaborative logs!`
      };
      setTeams([...teams, mockTeam]);
      handleSelectTeam(mockTeam);
    }
    setNewTeamName('');
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!joinTeamId) return;

    try {
      const res = await fetch(`${API_HOST}/api/teams/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ teamId: joinTeamId })
      });
      if (res.ok) {
        const team = await res.json();
        setTeams([...teams, team]);
        handleSelectTeam(team);
      } else {
        alert('Invalid Team ID or already joined.');
      }
    } catch (err) {
      alert('Workspace joining requires active server node.');
    }
    setJoinTeamId('');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeTeam) return;

    const messagePayload = {
      teamId: activeTeam._id,
      sender: user?._id || 'mock_user_123',
      content: inputText
    };

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_message', messagePayload);
    } else {
      // Offline fallback
      setChatMessages(prev => [...prev, {
        sender: { username: user?.username || 'You' },
        content: inputText,
        createdAt: new Date()
      }]);
    }
    setInputText('');
  };

  const handleNotesChange = (e) => {
    const updated = e.target.value;
    setCollaborativeNotes(updated);

    if (activeTeam) {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('update_notes', {
          teamId: activeTeam._id,
          notes: updated
        });
      } else {
        // Offline save
        const updatedTeams = teams.map(t => {
          if (t._id === activeTeam._id) {
            return { ...t, notes: updated };
          }
          return t;
        });
        setTeams(updatedTeams);
      }
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto relative h-screen">
      <ZenvoraBackground mode="diagonal" />

      <div className="max-w-6xl mx-auto space-y-6 z-10 relative">
        <header className="text-left shrink-0">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Team Collaboration Space</span>
            <Users className="w-6 h-6 text-zenvora-500" />
          </h1>
          <p className="text-slate-400 text-sm mt-1">Live WebSocket synchronized channels and collaborative notepads</p>
        </header>

        {/* Outer Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Column 1: Workspace Creator / Switcher lists */}
          <div className="space-y-6 lg:col-span-1 text-left">
            
            {/* Create Team card */}
            <div className="glass-panel p-4 rounded-3xl space-y-3">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider pl-1">Create Team</h4>
              <form onSubmit={handleCreateTeam} className="space-y-2">
                <input
                  type="text"
                  required
                  placeholder="Team Name..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-semibold text-slate-700"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white font-extrabold text-xs shadow"
                >
                  Create Channel
                </button>
              </form>
            </div>

            {/* Join Team card */}
            <div className="glass-panel p-4 rounded-3xl space-y-3">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider pl-1">Join Team ID</h4>
              <form onSubmit={handleJoinTeam} className="space-y-2">
                <input
                  type="text"
                  required
                  placeholder="ID string..."
                  value={joinTeamId}
                  onChange={(e) => setJoinTeamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-semibold text-slate-700"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-white hover:bg-purple-50 border border-purple-100 text-zenvora-600 font-extrabold text-xs"
                >
                  Join Channel
                </button>
              </form>
            </div>

            {/* Workspaces List Switcher */}
            <div className="glass-panel p-4 rounded-3xl flex flex-col gap-3">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider pl-1">Workspaces</h4>
              <div className="space-y-1.5 max-h-[14rem] overflow-y-auto">
                {teams.map(t => (
                  <button
                    key={t._id}
                    onClick={() => handleSelectTeam(t)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                      activeTeam?._id === t._id
                        ? 'bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white shadow'
                        : 'bg-white hover:bg-purple-50/50 text-slate-600 border border-purple-50/50'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Column 2-4: Active Team Space */}
          {activeTeam ? (
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              
              {/* Box A: WS Chat Room */}
              <div className="glass-panel p-6 rounded-3xl flex flex-col text-left h-[500px]">
                <div className="flex justify-between items-center border-b border-purple-50 pb-3 shrink-0">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                      <MessageSquare className="w-5 h-5 text-zenvora-600" />
                      <span>{activeTeam.name} Chat</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">Live chat ID: {activeTeam._id}</p>
                  </div>
                </div>

                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto my-4 space-y-3.5 pr-1">
                  {chatMessages.map((msg, idx) => {
                    const isSelf = msg.sender?.username === user?.username;
                    return (
                      <div key={idx} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] font-bold text-slate-400 pl-1 mb-0.5">{msg.sender?.username}</span>
                        <div className={`p-3 rounded-2xl text-[11px] font-semibold text-left max-w-[85%] leading-relaxed ${
                          isSelf 
                            ? 'bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white rounded-tr-none' 
                            : 'bg-white border border-purple-100/60 text-slate-700 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>

                {/* Chat input form */}
                <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
                  <input
                    type="text"
                    required
                    placeholder="Enter chat message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl glass-input text-xs font-semibold text-slate-700"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-zenvora-600 to-zenvora-500 text-white font-extrabold text-xs shadow hover:opacity-90"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Box B: WS Collaborative Markdown Notepad */}
              <div className="glass-panel p-6 rounded-3xl flex flex-col text-left h-[500px]">
                <div className="flex justify-between items-center border-b border-purple-50 pb-3 shrink-0">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                      <FileText className="w-5 h-5 text-zenvora-600" />
                      <span>Collaborative Notepad</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">Edits update in real-time across users</p>
                  </div>
                </div>

                <div className="flex-1 my-4 flex flex-col overflow-hidden">
                  <textarea
                    value={collaborativeNotes}
                    onChange={handleNotesChange}
                    placeholder="# Markdown Core Workspace Notes..."
                    className="w-full flex-1 p-4 rounded-2xl glass-input text-xs font-mono text-slate-700 resize-none h-full"
                  />
                </div>
              </div>

            </div>
          ) : (
            <div className="lg:col-span-3 glass-panel p-16 rounded-3xl flex flex-col items-center justify-center text-center text-slate-400 gap-3">
              <Users className="w-16 h-16 text-purple-200 animate-float" />
              <h3 className="font-extrabold text-slate-700 text-lg">No Workspace Selected</h3>
              <p className="text-slate-400 text-sm max-w-sm">
                Create a new team channel or join an existing workspace ID to activate WS synchronization.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TeamCollaborationPage;
