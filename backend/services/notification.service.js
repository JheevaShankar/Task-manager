const nodemailer = require('nodemailer');
const Task = require('../models/Task.model');
const User = require('../models/User.model');

// Create email transporter
let transporter = null;

// Initialize transporter if email credentials are provided
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} else {
  console.log('⚠️  Email not configured. Notifications will be logged only.');
}

/**
 * Check for tasks with approaching deadlines and send reminders
 * This function is called by cron job
 */
exports.checkDeadlines = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find tasks due within 24 hours that haven't been reminded
    const upcomingTasks = await Task.find({
      status: { $ne: 'Done' },
      deadline: {
        $gte: now,
        $lte: tomorrow
      },
      reminderSent: false,
      isArchived: false
    })
    .populate('assignedTo', 'name email preferences')
    .populate('assignedBy', 'name email');

    console.log(`Found ${upcomingTasks.length} tasks with approaching deadlines`);

    // Send reminders
    for (const task of upcomingTasks) {
      // Send notification to the team member who has to complete the task
      if (task.assignedTo && task.assignedTo.preferences && task.assignedTo.preferences.emailNotifications) {
        await this.sendDeadlineReminder(task);
        
        // Mark reminder as sent
        task.reminderSent = true;
        await task.save();
      }
    }

    console.log('✅ Deadline check completed');
  } catch (error) {
    console.error('❌ Error checking deadlines:', error);
  }
};

/**
 * Send deadline reminder email
 */
exports.sendDeadlineReminder = async (task) => {
  try {
    // Send reminder to the person who needs to complete the task (assignedTo)
    if (!task.assignedTo || !task.assignedTo.email) {
      console.log('No assignedTo user email found for task:', task._id);
      return;
    }

    const deadline = new Date(task.deadline);
    const formattedDeadline = deadline.toLocaleString();

    const emailContent = {
      from: process.env.EMAIL_FROM || 'noreply@smarttaskmanager.com',
      to: task.assignedTo.email,
      subject: `⏰ Reminder: Task "${task.title}" is due soon`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Task Deadline Reminder</h2>
          <p>Hi ${task.assignedTo.name},</p>
          <p>This is a reminder that the following task is due soon:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">${task.title}</h3>
            ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
            <p><strong>Priority:</strong> <span style="color: ${getPriorityColor(task.priority)}">${task.priority}</span></p>
            <p><strong>Deadline:</strong> ${formattedDeadline}</p>
            <p><strong>Status:</strong> ${task.status}</p>
            ${task.assignedBy ? `<p><strong>Assigned By:</strong> ${task.assignedBy.name}</p>` : ''}
          </div>
          
          <p>Don't forget to complete this task before the deadline!</p>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/tasks/${task._id}" 
             style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Task
          </a>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            Smart Task Manager - AI-Powered Task Management<br>
            You're receiving this because you have email notifications enabled.
          </p>
        </div>
      `
    };

    if (transporter) {
      await transporter.sendMail(emailContent);
      console.log(`✅ Reminder email sent to ${task.assignedTo.email} for task: ${task.title}`);
    } else {
      console.log('📧 [EMAIL WOULD BE SENT]:', {
        to: task.assignedTo.email,
        subject: emailContent.subject,
        taskId: task._id
      });
    }
  } catch (error) {
    console.error('❌ Error sending reminder email:', error);
  }
};

/**
 * Send task assignment notification
 */
exports.sendTaskAssignmentNotification = async (task, assignedUser) => {
  try {
    if (!assignedUser || !assignedUser.email) {
      return;
    }

    const emailContent = {
      from: process.env.EMAIL_FROM || 'noreply@smarttaskmanager.com',
      to: assignedUser.email,
      subject: `📋 New Task Assigned: "${task.title}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Task Assigned</h2>
          <p>Hi ${assignedUser.name},</p>
          <p>A new task has been assigned to you:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">${task.title}</h3>
            ${task.description ? `<p>${task.description}</p>` : ''}
            <p><strong>Priority:</strong> <span style="color: ${getPriorityColor(task.priority)}">${task.priority}</span></p>
            ${task.deadline ? `<p><strong>Deadline:</strong> ${new Date(task.deadline).toLocaleString()}</p>` : ''}
          </div>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/tasks/${task._id}" 
             style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Task
          </a>
        </div>
      `
    };

    if (transporter) {
      await transporter.sendMail(emailContent);
      console.log(`✅ Assignment email sent to ${assignedUser.email}`);
    } else {
      console.log('📧 [ASSIGNMENT EMAIL WOULD BE SENT]:', {
        to: assignedUser.email,
        taskId: task._id
      });
    }
  } catch (error) {
    console.error('❌ Error sending assignment email:', error);
  }
};

/**
 * Get priority color for emails
 */
function getPriorityColor(priority) {
  const colors = {
    'High': '#f44336',
    'Medium': '#ff9800',
    'Low': '#4caf50'
  };
  return colors[priority] || '#666';
}
