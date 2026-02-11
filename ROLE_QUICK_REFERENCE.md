# Role Identification System - Quick Reference

## 🎯 Quick Overview

### Roles
- `MANAGER` - First registered user, full system control
- `TEAM_MEMBER` - All other users, limited access

---

## 🔑 JWT Token Payload

```javascript
{
  id: "user-mongodb-id",
  role: "MANAGER" | "TEAM_MEMBER",
  iat: 1738800000,
  exp: 1741392000
}
```

---

## 🛡️ Middleware Usage

### Protect Routes (Authentication)
```javascript
const { protect } = require('../middleware/auth.middleware');
router.get('/tasks', protect, getTasks);
```

### Manager Only
```javascript
const { protect, requireManager } = require('../middleware/auth.middleware');
router.post('/tasks', protect, requireManager, createTask);
```

### Flexible Authorization
```javascript
const { protect, authorize } = require('../middleware/auth.middleware');
router.get('/analytics', protect, authorize('MANAGER'), getAnalytics);
```

---

## 🚦 Frontend Routes

### Manager Routes
- `/manager/dashboard` - Manager dashboard
- `/manager/kanban` - Kanban board
- `/manager/analytics` - Analytics

### Team Member Routes
- `/team/dashboard` - Team member dashboard

### Public Routes
- `/login` - Login page
- `/register` - Registration page

---

## 📊 Role Permissions

| Feature | Manager | Team Member |
|---------|---------|-------------|
| Create tasks | ✅ | ❌ |
| Edit tasks | ✅ | ❌ |
| Delete tasks | ✅ | ❌ |
| View all tasks | ✅ | ❌ |
| View assigned tasks | ✅ | ✅ |
| Update status | ✅ | ✅ |
| Add comments | ✅ | ✅ |
| View analytics | ✅ | ❌ |
| View team | ✅ | ❌ |

---

## 🔄 Registration Logic

```javascript
// First user becomes MANAGER
const userCount = await User.countDocuments();
const role = userCount === 0 ? 'MANAGER' : 'TEAM_MEMBER';
```

---

## 📱 Frontend Role Check

```javascript
// In components
const { user } = useAuth();

if (user.role === 'MANAGER') {
  // Show manager features
} else {
  // Show team member features
}
```

---

## 🔐 API Request with Token

```javascript
// Automatic with axios interceptor
const response = await axios.get('/api/tasks', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

## 🚀 Testing Checklist

- [ ] First user gets MANAGER role
- [ ] Subsequent users get TEAM_MEMBER role
- [ ] Login returns token with role
- [ ] Manager can create tasks
- [ ] Team member cannot create tasks
- [ ] Manager redirects to /manager/dashboard
- [ ] Team member redirects to /team/dashboard
- [ ] Protected routes require authentication
- [ ] Role-specific routes enforce authorization
- [ ] Token expires after 30 days

---

## 📝 Common Code Snippets

### Controller: Check User Role
```javascript
exports.someAction = async (req, res) => {
  // req.user is attached by protect middleware
  if (req.user.role === 'MANAGER') {
    // Manager logic
  } else {
    // Team member logic
  }
};
```

### Frontend: Conditional Rendering
```javascript
{user?.role === 'MANAGER' && (
  <button onClick={createTask}>Create Task</button>
)}
```

### Route Protection Pattern
```javascript
// 1. Authenticate
// 2. Authorize
// 3. Execute
router.post('/tasks', protect, requireManager, createTask);
```

---

**🎉 Role system is fully implemented and working!**
