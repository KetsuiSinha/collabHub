import api from './api';

export const boardsAPI = {
  // Get all user boards
  getBoards: async () => {
    const response = await api.get('/boards');
    return response.data;
  },

  // Get single board
  getBoard: async (boardId) => {
    const response = await api.get(`/boards/${boardId}`);
    return response.data;
  },

  // Create board
  createBoard: async (boardData) => {
    const response = await api.post('/boards', boardData);
    return response.data;
  },

  // Update board
  updateBoard: async (boardId, boardData) => {
    const response = await api.put(`/boards/${boardId}`, boardData);
    return response.data;
  },

  // Delete board
  deleteBoard: async (boardId) => {
    const response = await api.delete(`/boards/${boardId}`);
    return response.data;
  },

  // Add member to board
  addMember: async (boardId, memberData) => {
    const response = await api.post(`/boards/${boardId}/members`, memberData);
    return response.data;
  },

  // Remove member from board
  removeMember: async (boardId, memberId) => {
    const response = await api.delete(`/boards/${boardId}/members/${memberId}`);
    return response.data;
  }
};