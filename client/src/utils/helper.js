import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

// Format date for display
export const formatDate = (date) => {
  const dateObj = new Date(date);
  
  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'HH:mm')}`;
  }
  
  if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, 'HH:mm')}`;
  }
  
  return format(dateObj, 'MMM dd, yyyy HH:mm');
};

// Format relative time
export const formatRelativeTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Generate avatar URL
export const getAvatarUrl = (name, size = 150) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=${size}`;
};

// Generate initials from name
export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate random color
export const getRandomColor = () => {
  const colors = [
    '#0079bf', '#d29034', '#519839', '#b04632',
    '#89609e', '#cd5a91', '#4bbf6b', '#00aecc'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Check if user is online
export const isUserOnline = (user, onlineUsers) => {
  return onlineUsers.some(onlineUser => onlineUser.userId === user.id);
};

// Sort tasks by position
export const sortTasksByPosition = (tasks) => {
  return [...tasks].sort((a, b) => a.position - b.position);
};

// Group tasks by column
export const groupTasksByColumn = (tasks) => {
  return tasks.reduce((acc, task) => {
    if (!acc[task.columnId]) {
      acc[task.columnId] = [];
    }
    acc[task.columnId].push(task);
    return acc;
  }, {});
}