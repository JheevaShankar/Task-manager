# Smart Task Manager with AI Priority

A full-stack MERN application for intelligent task management with AI-driven priority assignment, Kanban board, and analytics dashboard.

## Features

### Core Functionality
- **JWT Authentication** - Secure user registration and login
- **AI Priority Engine** - Automatic task prioritization based on multiple factors
- **Kanban Board** - Drag & drop interface for task management
- **Task Analytics** - Comprehensive insights into productivity and task completion
- **Deadline Reminders** - Automated email notifications for upcoming deadlines
- **Smart Recommendations** - AI-powered task suggestions

### Task Management
- Create, read, update, and delete tasks
- Set priorities (High, Medium, Low)
- Add categories, tags, and descriptions
- Set deadlines and estimated completion time
- Track task status (Todo, In Progress, Done)
- Add comments and subtasks
- File attachments support

### Analytics & Insights
- Task completion rates
- Priority distribution charts
- Productivity trends over time
- Overdue task tracking
- Daily completion statistics

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **node-cron** - Scheduled tasks for reminders
- **nodemailer** - Email notifications
- **OpenAI API** (Optional) - Advanced AI features

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **react-beautiful-dnd** - Drag & drop functionality
- **Recharts** - Data visualization
- **react-hot-toast** - Notifications
- **date-fns** - Date utilities
- **lucide-react** - Icon library

## Project Structure

```
smart-task-manager/
├── backend/
│   ├── controllers/          # Request handlers
│   │   ├── auth.controller.js
│   │   ├── task.controller.js
│   │   ├── user.controller.js
│   │   ├── analytics.controller.js
│   │   └── notification.controller.js
│   ├── models/              # MongoDB models
│   │   ├── User.model.js
│   │   └── Task.model.js
│   ├── routes/              # API routes
│   │   ├── auth.routes.js
│   │   ├── task.routes.js
│   │   ├── user.routes.js
│   │   ├── analytics.routes.js
│   │   └── notification.routes.js
│   ├── middleware/          # Custom middleware
│   │   └── auth.middleware.js
│   ├── services/            # Business logic
│   │   ├── ai-priority.service.js
│   │   └── notification.service.js
│   ├── .env.example         # Environment variables template
│   ├── server.js            # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── Layout.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   └── TaskModal.jsx
│   │   ├── pages/           # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── KanbanBoard.jsx
│   │   │   └── Analytics.jsx
│   │   ├── context/         # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── services/        # API services
│   │   │   └── api.js
│   │   ├── App.jsx          # Root component
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd smart-task-manager
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from template
copy .env.example .env    # Windows
# OR
cp .env.example .env      # Linux/Mac

# Edit .env file with your configuration
# Required: MONGODB_URI, JWT_SECRET
# Optional: OPENAI_API_KEY, EMAIL_* for notifications
```

**Environment Variables (.env):**
```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/smart-task-manager

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=30d

# OpenAI (Optional - for advanced AI features)
OPENAI_API_KEY=sk-your-openai-api-key

# Email (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@smarttaskmanager.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

```bash
# Start backend server
npm run dev    # Development mode with nodemon
# OR
npm start      # Production mode
```

Backend will run on http://localhost:5000

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on http://localhost:3000

## Usage

### 1. Register/Login
- Navigate to http://localhost:3000
- Create a new account or login with existing credentials

### 2. Create Tasks
- Click "New Task" button
- Fill in task details:
  - Title (required)
  - Description
  - Priority (High/Medium/Low)
  - Category (Work/Personal/Urgent/Important/Other)
  - Deadline
  - Estimated time
  - Tags
- AI Priority Engine will automatically calculate priority score

### 3. Manage Tasks
- **Dashboard**: View all tasks organized by status
- **Kanban Board**: Drag and drop tasks between columns (Todo → In Progress → Done)
- **Edit/Delete**: Click icons on task cards

### 4. View Analytics
- Navigate to Analytics page
- View productivity metrics, completion rates, priority distribution
- Filter by time period (7/14/30 days)

## AI Priority Engine

The AI Priority Engine calculates a score (0-100) for each task based on:

### Rule-Based Algorithm (Default)
1. **Deadline Urgency** (max +40 points)
   - Overdue: +40
   - Due today/tomorrow: +35
   - Due within 3 days: +25
   - Due within 7 days: +15
   - Due within 14 days: +5

2. **Category Importance** (max +20 points)
   - Urgent: +20
   - Important: +15
   - Work: +10
   - Personal: +5
   - Other: 0

3. **Estimated Time** (max +15 points)
   - < 30 min: +15 (quick wins)
   - < 1 hour: +10
   - < 2 hours: +5

4. **Tags** (max +10 points)
   - Contains urgent keywords: +10

5. **Manual Priority** (max +15 points)
   - High: +15
   - Medium: +5
   - Low: 0

### OpenAI Integration (Optional)
If `OPENAI_API_KEY` is configured, the system uses GPT-3.5 to analyze task context and provide intelligent priority scoring.

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/update-profile` - Update profile (Protected)
- `PUT /api/auth/update-password` - Update password (Protected)

### Tasks
- `GET /api/tasks` - Get all tasks (Protected)
- `GET /api/tasks/:id` - Get single task (Protected)
- `POST /api/tasks` - Create task (Protected)
- `PUT /api/tasks/:id` - Update task (Protected)
- `DELETE /api/tasks/:id` - Delete task (Protected)
- `PUT /api/tasks/:id/status` - Update task status (Protected)
- `PUT /api/tasks/:id/priority` - Recalculate AI priority (Protected)
- `POST /api/tasks/:id/comments` - Add comment (Protected)
- `PUT /api/tasks/bulk/update-order` - Update task order (Protected)

### Analytics
- `GET /api/analytics/overview` - Get analytics overview (Protected)
- `GET /api/analytics/productivity` - Get productivity metrics (Protected)
- `GET /api/analytics/priority-distribution` - Get priority distribution (Protected)
- `GET /api/analytics/completion-rate` - Get completion rate (Protected)

### Notifications
- `GET /api/notifications` - Get upcoming deadlines (Protected)
- `POST /api/notifications/send-reminder/:taskId` - Send reminder (Protected)

## Scheduled Tasks

The backend runs automated cron jobs:
- **Deadline Reminders**: Checks every hour for tasks due within 24 hours and sends email notifications

## Development

### Backend Development
```bash
cd backend
npm run dev  # Runs with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

### Build for Production

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build   # Creates optimized build in dist/
npm run preview # Preview production build
```

## Environment Configuration

### Development
- Backend: http://localhost:5000
- Frontend: http://localhost:3000
- MongoDB: localhost:27017

### Production
- Set `NODE_ENV=production`
- Use MongoDB Atlas or hosted database
- Configure proper CORS settings
- Use environment variables for sensitive data
- Enable HTTPS

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check MongoDB service
- Verify connection string in `.env`
- For MongoDB Atlas, whitelist your IP address

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Email Notifications Not Working
- Verify EMAIL_* variables in `.env`
- For Gmail: Enable "Less secure app access" or use App Password
- Check spam folder

### AI Priority Not Working
- Rule-based algorithm works without API key
- For OpenAI: Verify `OPENAI_API_KEY` is correct
- Check OpenAI account has available credits

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

MIT License - feel free to use this project for learning and development.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with ❤️ using the MERN Stack**
