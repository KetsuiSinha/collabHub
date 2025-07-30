import { create } from 'zustand';
import socketService from '../services/socket';

export const useChatStore = create((set, get) => ({
  messages: [],
  onlineUsers: [],
  typingUsers: [],
  loading: false,

  // Send message
  sendMessage: (messageData) => {
    socketService.sendMessage(messageData);
  },

  // Add message to local state
  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message]
    }));
  },

  // Set messages (for initial load)
  setMessages: (messages) => {
    set({ messages });
  },

  // Set online users
  setOnlineUsers: (users) => {
    set({ onlineUsers: users });
  },

  // Add online user
  addOnlineUser: (user) => {
    set((state) => ({
      onlineUsers: [...state.onlineUsers.filter(u => u.userId !== user.userId), user]
    }));
  },

  // Remove online user
  removeOnlineUser: (userId) => {
    set((state) => ({
      onlineUsers: state.onlineUsers.filter(u => u.userId !== userId)
    }));
  },

  // Typing indicators
  addTypingUser: (user) => {
    set((state) => ({
      typingUsers: [...state.typingUsers.filter(u => u.userId !== user.userId), user]
    }));
  },

  removeTypingUser: (userId) => {
    set((state) => ({
      typingUsers: state.typingUsers.filter(u => u.userId !== userId)
    }));
  },

  // Socket event handlers
  handleSocketEvents: () => {
    // Message events
    socketService.on('new-message', (message) => {
      get().addMessage(message);
    });

    socketService.on('board-messages', (messages) => {
      get().setMessages(messages);
    });

    // User events
    socketService.on('online-users', (users) => {
      get().setOnlineUsers(users);
    });

    socketService.on('user-online', (user) => {
      get().addOnlineUser(user);
    });

    socketService.on('user-offline', (data) => {
      get().removeOnlineUser(data.userId);
    });

    // Typing events
    socketService.on('user-typing', (user) => {
      get().addTypingUser(user);
    });

    socketService.on('user-stop-typing', (data) => {
      get().removeTypingUser(data.userId);
    });
  },

  // Clear chat data
  clearChat: () => {
    set({
      messages: [],
      onlineUsers: [],
      typingUsers: []
    });
  }
}));