export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  REVIEW: 'review',
  DONE: 'done'
};

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

export const BOARD_MEMBER_ROLES = {
  MEMBER: 'member',
  ADMIN: 'admin'
};

export const MESSAGE_TYPES = {
  TEXT: 'text',
  FILE: 'file',
  SYSTEM: 'system',
  TASK_UPDATE: 'task-update'
};

export const DEFAULT_BOARD_COLUMNS = [
  { id: 'todo', title: 'To Do', position: 0 },
  { id: 'in-progress', title: 'In Progress', position: 1 },
  { id: 'done', title: 'Done', position: 2 }
];

export const PRIORITY_COLORS = {
  [TASK_PRIORITIES.LOW]: 'bg-green-100 text-green-800',
  [TASK_PRIORITIES.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [TASK_PRIORITIES.HIGH]: 'bg-orange-100 text-orange-800',
  [TASK_PRIORITIES.URGENT]: 'bg-red-100 text-red-800'
};

export const STATUS_COLORS = {
  [TASK_STATUS.TODO]: 'bg-gray-100 text-gray-800',
  [TASK_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [TASK_STATUS.REVIEW]: 'bg-purple-100 text-purple-800',
  [TASK_STATUS.DONE]: 'bg-green-100 text-green-800'
};