<div align="center">

<img src="client/public/logo_icon.png" alt="Zenvora Logo" width="100"/>

# ZENVORA

### 🚀 Smart Task Management & AI-Powered Productivity Workspace

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=flat-square&logo=socket.io)](https://socket.io/)

*A gamified, futuristic productivity platform built with the MERN stack — featuring AI assistance, Kanban task boards, wellness tracking, team collaboration, and real-time focus sessions.*

</div>

---

## ✨ What is Zenvora?

**Zenvora** is a full-stack productivity web application designed for modern professionals and students who want to manage their work smarter, not harder. It combines the power of task management, wellness tracking, and gamification into a single beautiful workspace — with an integrated AI assistant that understands your workflow.

The name *Zenvora* blends **Zen** (focus, calm, mindfulness) with **Vora** (to consume — devouring tasks with precision). The result is a platform that helps you stay focused, productive, and balanced.

---

## 🌟 Key Features

### 🎯 AI-Powered Task Board (Kanban)
- Drag-and-drop Kanban board with **Todo → In Progress → Done** columns
- **Natural Language Task Creation** — type *"Finish UI redesign tomorrow at 7 PM"* and the AI parses it automatically
- **AI Subtask Breakdown** — every task gets an auto-generated checklist of subtasks
- Priority system: Low / Medium / High with color coding
- Due date tracking with overdue highlighting

### 🤖 Zenvora AI Assistant
- Context-aware AI assistant that knows your real task data
- Can answer: *"What tasks are overdue?"*, *"Plan my day"*, *"What's my productivity score?"*
- Natural language task creation directly through chat
- Focus mode launcher via voice commands
- Strictly scoped to productivity — no off-topic distractions

### 🏆 Gamification & XP System
- Earn **XP** for completing tasks (+10 regular, +25 high-priority), logging wellness (+15–20), and maintaining streaks (+50)
- Dynamic **Level progression** (Level = XP ÷ 100 + 1)
- **Daily Active Streak** tracker — consecutive login days rewarded
- Real-time **Leaderboard** showing top 10 users by XP

### 🏅 Achievements System
| Achievement | Requirement |
|---|---|
| 🚀 First Quantum Step | Complete your first task |
| ⚡ Task Master | Complete 50 tasks |
| 🎯 Focus Champion | Log 20 focus sessions |
| 🔥 Streak Legend | Maintain a 7-day daily streak |
| ⏰ Deadline Hero | Complete a task before its deadline |
| 👑 Consistency King | 15 tasks completed + 3-day streak |
| 🧘 Zen Seeker | Log a perfect mindfulness mood |
| ⭐ Celestial Scholar | Reach Level 5 |

### 🧘 Wellness Hub
- Daily wellness check-in: Mood, Stress Level, Sleep Hours, Focus Time
- **Burnout Risk Calculator** — algorithmic score based on stress + sleep + focus data
- Visual wellness trend charts over time
- XP reward for self-care logging

### 📊 Analytics Dashboard
- Comprehensive productivity metrics
- Task completion rate graphs
- Focus time & wellness history charts
- Weekly trend analysis

### 📅 Calendar View
- Monthly calendar displaying all tasks with due dates
- Color-coded by priority and status
- Click to view/edit task details

### ⏱️ Focus Mode (Pomodoro Timer)
- Fullscreen distraction-free focus environment
- Customizable countdown/stopwatch modes
- Session logging tied to Wellness Hub
- Ambient focus UI

### 👥 Team Collaboration
- Create and join team workspaces
- Real-time group chat powered by **Socket.IO**
- Member management with avatars
- Shared workspace notifications

### ⚙️ Settings & Personalization
- Avatar selection (20+ unique pixel avatars)
- Account management (update username, delete account)
- Theme and notification preferences

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TailwindCSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Auth** | JWT (JSON Web Tokens) + bcrypt |
| **Real-time** | Socket.IO |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Routing** | React Router v6 |
| **AI Logic** | Custom NLP rule engine (server-side) |

---

## 📁 Project Structure

```
zenvora/
├── client/                     # React frontend (Vite)
│   ├── public/                 # Static assets (logos, icons)
│   ├── src/
│   │   ├── assets/             # Images used in components
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── FloatingAIAssistant.jsx
│   │   │   └── ZenvoraBackground.jsx
│   │   ├── context/            # React Context (Auth, Global state)
│   │   ├── pages/              # Page-level components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── AuthPages.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TaskBoardPage.jsx
│   │   │   ├── AchievementsPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   ├── CalendarPage.jsx
│   │   │   ├── FocusModePage.jsx
│   │   │   ├── WellnessHubPage.jsx
│   │   │   ├── TeamCollaborationPage.jsx
│   │   │   ├── AIAssistantPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── App.jsx             # Routes & layout
│   │   └── main.jsx            # Entry point
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Express.js backend
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── models/
│   │   ├── User.js             # User schema (XP, level, streak, achievements)
│   │   ├── Task.js             # Task schema (Kanban, subtasks, priority)
│   │   ├── Team.js             # Team workspace + messages schema
│   │   └── Wellness.js         # Daily wellness log schema
│   ├── services/
│   │   └── aiService.js        # NLP parser + task breakdown AI
│   ├── server.js               # Main Express app + Socket.IO + all API routes
│   └── .env.example            # Environment variable template
│
└── package.json                # Root monorepo scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** v9+
- A **MongoDB Atlas** account (free tier works perfectly — [Sign up](https://www.mongodb.com/atlas))

### 1. Clone the Repository

```bash
git clone https://github.com/Gaganabm30/zenvora.git
cd zenvora
```

### 2. Configure Environment Variables

```bash
cd server
cp .env.example .env
```

Open `server/.env` and fill in your values:

```env
PORT=5000
MONGO_URI=mongodb+srv://<your-username>:<your-password>@cluster0.xxxxx.mongodb.net/zenvora?retryWrites=true&w=majority
JWT_SECRET=your_custom_super_secret_key
```

> 💡 **MongoDB Setup**: Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas), add a database user, whitelist your IP (`0.0.0.0/0` for all), and copy the connection string.

### 3. Install Dependencies

From the project root:

```bash
npm run install-all
```

This installs both client and server dependencies in one command.

### 4. Run the Application

```bash
npm run dev
```

This concurrently starts:
- 🌐 **Frontend** at `http://localhost:5173`
- ⚙️ **Backend API** at `http://localhost:5000`

---

## 📖 How to Use Zenvora

### Step 1: Create Your Account
Visit the landing page and click **"Create an Account"**. Sign up with a username, email, and password.

### Step 2: Choose Your Avatar
After signing in, you'll be prompted to pick from 20+ avatar options to personalize your profile.

### Step 3: Create Tasks
Navigate to the **Task Board** and:
- Click **"+ New Task"** to open the task creation dialog
- Or use the AI Assistant to create tasks with natural language:
  > *"Build the login page by Friday with high priority"*

### Step 4: Manage Your Kanban Board
- Drag tasks between **Todo**, **In Progress**, and **Done** columns
- Expand a task to see its AI-generated subtask checklist
- Mark subtasks complete as you progress

### Step 5: Log Your Wellness
Go to **Wellness Hub** daily to log:
- Your mood emoji
- Stress level (1–10)
- Sleep hours
- Focus time spent

This earns you XP and helps calculate your burnout risk score.

### Step 6: Use Focus Mode
Click **Focus Mode** to enter a fullscreen timer environment:
- Set a countdown (e.g., 45 minutes)
- Work distraction-free
- The session is automatically logged to your Wellness Hub

### Step 7: Chat with the AI Assistant
Click the floating AI button (bottom-right) or visit **AI Assistant** to:
- Ask *"What tasks are overdue?"*
- Ask *"Plan my day"*
- Create tasks: *"Add: finish API documentation tomorrow"*
- Check *"What is my productivity score?"*

### Step 8: Track Your Progress
- Visit **Analytics** for charts and completion metrics
- Visit **Achievements** to see unlocked badges and the leaderboard
- Watch your XP grow and level up!

### Step 9: Collaborate with Your Team
Go to **Team Collaboration** to:
- Create a workspace and share the Team ID with colleagues
- Join existing workspaces
- Chat in real-time via the team message feed

---

## 🔗 API Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register new user |
| `POST` | `/api/auth/login` | Login & receive JWT |
| `GET` | `/api/auth/me` | Get current user profile |
| `PUT` | `/api/auth/profile` | Update profile/avatar |
| `DELETE` | `/api/auth/profile` | Delete account |
| `GET` | `/api/tasks` | Get all user tasks |
| `POST` | `/api/tasks` | Create task (supports NLP) |
| `PUT` | `/api/tasks/:id` | Update task / move Kanban column |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `POST` | `/api/wellness` | Log wellness entry |
| `GET` | `/api/wellness` | Get wellness history |
| `POST` | `/api/ai/chat` | Chat with AI assistant |
| `POST` | `/api/achievements/evaluate` | Sync & evaluate achievements |
| `GET` | `/api/users/leaderboard` | Get top 10 XP leaderboard |
| `POST` | `/api/teams` | Create team workspace |
| `POST` | `/api/teams/join` | Join a team by ID |
| `GET` | `/api/teams` | Get user's teams |

---

## 💡 Why Zenvora is Useful

| Challenge | Zenvora's Solution |
|---|---|
| 📋 Scattered task lists | Unified Kanban board with AI auto-breakdown |
| 😵 Feeling overwhelmed | Burnout risk score + wellness tracking |
| 🤔 Don't know where to start | AI daily plan generator |
| ⏰ Missing deadlines | Overdue alerts + deadline tracking |
| 💤 Losing motivation | XP system, levels, streaks, achievements |
| 👥 Team coordination | Real-time team workspaces + chat |
| 📊 No visibility into productivity | Analytics dashboard with charts |
| 🧠 Forgetting to take breaks | Focus mode with session logging |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

Made with 💜 by **Gagana B M**

*"Consume your tasks with zen-like precision."*

⭐ **Star this repo** if Zenvora helps you stay productive!

</div>
