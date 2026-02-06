# 🚀 Quick Start Guide - Smart Task Manager

## ✅ Installation Status

### Backend Packages ✅
- **Status**: Installed successfully
- **Packages**: 
  - Express.js, MongoDB driver, Mongoose
  - JWT, bcryptjs
  - node-cron, nodemailer
  - OpenAI (optional)
- **Note**: 1 moderate vulnerability (can be fixed later with `npm audit fix`)

### Frontend Packages ✅
- **Status**: Installed successfully
- **Packages**: 
  - React 18, React Router, Vite
  - **Tailwind CSS ✅** (v3.4.19)
  - **PostCSS ✅** (v8.5.6)
  - **Autoprefixer ✅** (v10.4.24)
  - Axios, React Beautiful DnD, Recharts
  - React Hot Toast, Date-fns, Lucide Icons
- **Note**: 2 moderate vulnerabilities, react-beautiful-dnd is deprecated (but still works)

### Configuration Files ✅
- ✅ `postcss.config.js` - Fixed and working
- ✅ `tailwind.config.js` - Properly configured
- ✅ `vite.config.js` - Ready
- ✅ `.env` file created in backend

## ⚠️ MongoDB Required

**MongoDB is NOT installed or not in PATH**

You have 2 options:

### Option 1: Install MongoDB Locally (Recommended for Development)
1. Download MongoDB Community Server:
   https://www.mongodb.com/try/download/community
   
2. Install and add to PATH, or use MongoDB Compass

3. Start MongoDB service:
   ```powershell
   net start MongoDB
   ```

### Option 2: Use MongoDB Atlas (Cloud - Free Tier)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `backend\.env` with your Atlas connection string

## 📝 Configuration Steps

### 1. Configure Backend Environment
Edit `backend\.env`:

```env
# REQUIRED - Update these
MONGODB_URI=mongodb://localhost:27017/smart-task-manager
# OR for Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/smart-task-manager

JWT_SECRET=your_super_secret_key_change_this_in_production

# OPTIONAL - For AI features
OPENAI_API_KEY=sk-your-openai-api-key-here

# OPTIONAL - For email notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 2. Start the Application

**Terminal 1 - Backend:**
```powershell
cd "c:\Users\jheev\OneDrive\Desktop\Smart dashbroad\backend"
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd "c:\Users\jheev\OneDrive\Desktop\Smart dashbroad\frontend"
npm run dev
```

## 🎯 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## ✨ Tailwind CSS Verification

Tailwind CSS is properly configured:
- ✅ Installed: v3.4.19
- ✅ PostCSS config: Working
- ✅ Autoprefixer: Working
- ✅ Content paths: Configured for all JSX/TSX files
- ✅ Custom theme: Primary colors defined

Your `index.css` already has the correct Tailwind directives:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 🔧 Troubleshooting

### If Tailwind styles don't work:
```powershell
cd frontend
npm run dev
# Vite will process Tailwind CSS automatically
```

### If MongoDB connection fails:
1. Check MongoDB is running: `net start MongoDB`
2. Verify connection string in `backend\.env`
3. Check MongoDB Compass can connect

### Port already in use:
```powershell
# Find process using port 5000
netstat -ano | findstr :5000
# Kill the process (replace PID)
taskkill /PID <PID> /F
```

## 📦 Optional: Fix Vulnerabilities
```powershell
# Backend
cd backend
npm audit fix

# Frontend
cd frontend
npm audit fix
```

## 🎉 You're Ready!

Once MongoDB is set up:
1. Start backend server (Terminal 1)
2. Start frontend dev server (Terminal 2)
3. Open http://localhost:3000
4. Register a new account
5. Start creating tasks!

The AI Priority Engine will automatically calculate priorities based on:
- Deadline urgency
- Category importance
- Estimated time
- Tags and keywords
