import api from './api';

export const tasksAPI = {
  // Create task
  createTask: async (boardId, taskData) => {
    const response = await api.post(`/tasks/board/${boardId}`, taskData);
    return response.data;
  },

  // Get task
  getTask: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  // Update task
  updateTask: async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  // Delete task
  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  // Move task
  moveTask: async (taskId, moveData) => {
    const response = await api.patch(`/tasks/${taskId}/move`, moveData);
    return response.data;
  },

  // Add comment
  addComment: async (taskId, commentData) => {
    const response = await api.post(`/tasks/${taskId}/comments`, commentData);
    return response.data;
  },

  // Update checklist item
  updateChecklistItem: async (taskId, itemId, itemData) => {
    const response = await api.patch(`/tasks/${taskId}/checklist/${itemId}`, itemData);
    return response.data;
  }
};