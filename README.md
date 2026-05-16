# TaskFlow — Team Task Manager

A full-stack team task management application with role-based access control, built with React + Node.js + PostgreSQL.

## 🚀 Live Demo

- **Frontend:** `https://your-frontend.railway.app`
- **Backend API:** `https://your-backend.railway.app/api`

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@taskmanager.com | admin123 |
| Member | alice@taskmanager.com | member123 |
| Member | bob@taskmanager.com | member123 |

---

## ✨ Features

- **Authentication** — JWT-based signup/login with bcrypt password hashing
- **Role-Based Access Control** — Global Admin vs Member roles; project-level Admin/Member roles
- **Projects** — Create, update, delete projects with team membership management
- **Tasks** — Full CRUD: create, assign, update status/priority, due dates, delete
- **Dashboard** — Task stats, completion rate, overdue detection, upcoming tasks, recent activity
- **Comments** — Per-task comment threads
- **Team Management** — Admin panel to manage users and change roles
- **Profile** — Update name, avatar color, and password

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS (dark mode, glassmorphism) |
| State | React Context |
| Backend | Node.js + Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Deployment | Railway |

---

## 📦 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET in .env
npm install
npx prisma db push
node src/seed.js   # optional: seed demo data
npm run dev
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:5000/api for local dev
npm install
npm run dev
```

---

## 🚂 Railway Deployment

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create taskflow --public --push
```

### Step 2 — Deploy Backend
1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo** → choose your repo
3. Set **Root Directory** to `backend`
4. Add a **PostgreSQL** plugin/service
5. Set environment variables:
   ```
   DATABASE_URL=<from Railway PostgreSQL>
   JWT_SECRET=<random 64-char string>
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   FRONTEND_URL=<your frontend Railway URL>
   ```
6. After deploy: run migrations via Railway shell:
   ```bash
   npx prisma migrate deploy
   node src/seed.js
   ```

### Step 3 — Deploy Frontend
1. In same Railway project → **New Service** → GitHub repo
2. Set **Root Directory** to `frontend`
3. Set environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```
4. Railway auto-detects Vite and builds static site

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/signup | ❌ | Register |
| POST | /api/auth/login | ❌ | Login |
| GET | /api/auth/me | ✅ | Current user |
| GET | /api/projects | ✅ | My projects |
| POST | /api/projects | ✅ | Create project |
| GET | /api/projects/:id | ✅ | Project detail |
| PUT | /api/projects/:id | ✅ Admin | Update project |
| DELETE | /api/projects/:id | ✅ Admin | Delete project |
| POST | /api/projects/:id/members | ✅ Admin | Add member |
| DELETE | /api/projects/:id/members/:uid | ✅ Admin | Remove member |
| GET | /api/tasks | ✅ | All visible tasks |
| POST | /api/tasks | ✅ | Create task |
| GET | /api/tasks/:id | ✅ | Task detail |
| PUT | /api/tasks/:id | ✅ | Update task |
| DELETE | /api/tasks/:id | ✅ | Delete task |
| POST | /api/tasks/:id/comments | ✅ | Add comment |
| GET | /api/dashboard | ✅ | Dashboard stats |
| GET | /api/users | ✅ Admin | All users |
| GET | /api/users/search?q= | ✅ | Search users |
| PUT | /api/users/:id | ✅ | Update user |
| DELETE | /api/users/:id | ✅ Admin | Delete user |

---

## 🗄 Database Schema

```
users ──< project_members >── projects ──< tasks ──< comments
                                 │                       │
                                 └──────── users ────────┘
```

---

## 🔐 Role-Based Access

| Action | Member | Project Admin | Global Admin |
|--------|--------|---------------|--------------|
| View own projects | ✅ | ✅ | ✅ |
| Create project | ✅ | ✅ | ✅ |
| Edit/Delete project | ❌ | ✅ | ✅ |
| Manage members | ❌ | ✅ | ✅ |
| Create/Edit tasks | ✅ | ✅ | ✅ |
| Delete any task | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View team page | ❌ | ❌ | ✅ |

---

## 📁 Project Structure

```
TASK MANAGER/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── index.js
│   │   ├── middleware/auth.js
│   │   ├── routes/ (auth, users, projects, tasks, dashboard)
│   │   └── seed.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js
│   │   ├── context/AuthContext.jsx
│   │   ├── components/ (Layout, Sidebar, ProtectedRoute)
│   │   └── pages/ (Login, Signup, Dashboard, Projects, Tasks, Team, Profile)
│   └── package.json
└── README.md
```
