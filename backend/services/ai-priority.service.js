/**
 * AI Priority Engine
 * Calculates task priority score based on multiple factors
 * Returns a score from 0-100
 */

// Import OpenAI (optional - for advanced AI features)
let openai = null;
try {
  const { OpenAI } = require('openai');
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
} catch (error) {
  console.log('OpenAI not configured, using rule-based priority engine');
}

/**
 * Calculate AI Priority Score using rule-based algorithm
 * @param {Object} taskData - Task data including deadline, category, estimatedTime
 * @returns {Number} Priority score (0-100)
 */
exports.calculateAIPriority = async (taskData) => {
  try {
    // If OpenAI is configured, use it for advanced priority calculation
    if (openai && taskData.title && taskData.description) {
      return await calculateAIPriorityWithOpenAI(taskData);
    }

    // Otherwise, use rule-based algorithm
    return calculateRuleBasedPriority(taskData);
  } catch (error) {
    console.error('Error calculating AI priority:', error);
    // Fallback to rule-based if AI fails
    return calculateRuleBasedPriority(taskData);
  }
};

/**
 * Rule-based priority calculation
 * Factors: deadline urgency, category, estimated time, tags
 */
function calculateRuleBasedPriority(taskData) {
  let score = 50; // Base score

  // 1. Deadline urgency (max +40 points)
  if (taskData.deadline) {
    const deadline = new Date(taskData.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    if (daysUntilDeadline < 0) {
      // Overdue
      score += 40;
    } else if (daysUntilDeadline <= 1) {
      // Due today or tomorrow
      score += 35;
    } else if (daysUntilDeadline <= 3) {
      // Due within 3 days
      score += 25;
    } else if (daysUntilDeadline <= 7) {
      // Due within a week
      score += 15;
    } else if (daysUntilDeadline <= 14) {
      // Due within 2 weeks
      score += 5;
    }
  }

  // 2. Category importance (max +20 points)
  const categoryScores = {
    'Urgent': 20,
    'Important': 15,
    'Work': 10,
    'Personal': 5,
    'Other': 0
  };
  score += categoryScores[taskData.category] || 0;

  // 3. Estimated time (max +15 points)
  // Shorter tasks get higher priority (quick wins)
  if (taskData.estimatedTime) {
    if (taskData.estimatedTime <= 30) {
      score += 15; // Quick task (< 30 min)
    } else if (taskData.estimatedTime <= 60) {
      score += 10; // Medium task (< 1 hour)
    } else if (taskData.estimatedTime <= 120) {
      score += 5; // Long task (< 2 hours)
    }
  }

  // 4. Priority tags (max +10 points)
  if (taskData.tags && Array.isArray(taskData.tags)) {
    const urgentTags = ['urgent', 'important', 'critical', 'asap', 'high-priority'];
    const hasUrgentTag = taskData.tags.some(tag => 
      urgentTags.includes(tag.toLowerCase())
    );
    if (hasUrgentTag) {
      score += 10;
    }
  }

  // 5. Manual priority boost (max +15 points)
  if (taskData.priority === 'High') {
    score += 15;
  } else if (taskData.priority === 'Medium') {
    score += 5;
  }

  // Ensure score is within 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * OpenAI-based priority calculation (Advanced)
 * Uses GPT to analyze task context and suggest priority
 */
async function calculateAIPriorityWithOpenAI(taskData) {
  try {
    const prompt = `
Analyze this task and assign a priority score from 0-100 based on urgency and importance.

Task Title: ${taskData.title}
Description: ${taskData.description || 'No description'}
Deadline: ${taskData.deadline ? new Date(taskData.deadline).toLocaleDateString() : 'No deadline'}
Category: ${taskData.category || 'Other'}
Estimated Time: ${taskData.estimatedTime || 'Unknown'} minutes

Consider:
- Deadline urgency (overdue, due soon, future)
- Task importance and impact
- Category priority
- Time investment required

Respond with ONLY a number between 0-100.
    `.trim();

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a task priority analyzer. Respond only with a number between 0-100.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 10,
      temperature: 0.3
    });

    const aiScore = parseInt(response.choices[0].message.content.trim());

    // Validate AI response
    if (isNaN(aiScore) || aiScore < 0 || aiScore > 100) {
      console.warn('Invalid AI score, falling back to rule-based');
      return calculateRuleBasedPriority(taskData);
    }

    return aiScore;
  } catch (error) {
    console.error('OpenAI priority calculation failed:', error.message);
    return calculateRuleBasedPriority(taskData);
  }
}

/**
 * Get task recommendations based on current tasks
 * Suggests which tasks to focus on next
 */
exports.getTaskRecommendations = async (tasks) => {
  try {
    if (!tasks || tasks.length === 0) {
      return {
        recommendations: [],
        message: 'No tasks to analyze'
      };
    }

    // Sort tasks by priority score
    const sortedTasks = tasks
      .filter(t => t.status !== 'Done')
      .sort((a, b) => (b.aiPriorityScore || 0) - (a.aiPriorityScore || 0));

    // Get top 5 recommended tasks
    const recommendations = sortedTasks.slice(0, 5).map(task => ({
      id: task._id,
      title: task.title,
      priority: task.priority,
      aiPriorityScore: task.aiPriorityScore,
      reason: getRecommendationReason(task)
    }));

    return {
      recommendations,
      message: 'Focus on these high-priority tasks first'
    };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return {
      recommendations: [],
      message: 'Unable to generate recommendations'
    };
  }
};

/**
 * Get human-readable reason for task recommendation
 */
function getRecommendationReason(task) {
  const reasons = [];

  if (task.deadline) {
    const deadline = new Date(task.deadline);
    const now = new Date();
    const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      reasons.push('Overdue');
    } else if (daysUntil <= 1) {
      reasons.push('Due very soon');
    } else if (daysUntil <= 3) {
      reasons.push('Due within 3 days');
    }
  }

  if (task.category === 'Urgent' || task.category === 'Important') {
    reasons.push(`${task.category} category`);
  }

  if (task.estimatedTime && task.estimatedTime <= 30) {
    reasons.push('Quick win (< 30 min)');
  }

  if (task.priority === 'High') {
    reasons.push('High priority');
  }

  return reasons.length > 0 ? reasons.join(', ') : 'Good to complete soon';
}
