import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Authentication
  authenticate(userData) {
    if (this.socket) {
      this.socket.emit('authenticate', userData);
    }
  }

  // Board operations
  joinBoard(boardId, userId) {
    if (this.socket) {
      this.socket.emit('join-board', { boardId, userId });
    }
  }

  leaveBoard(boardId) {
    if (this.socket) {
      this.socket.emit('leave-board', { boardId });
    }
  }

  // Messages
  sendMessage(messageData) {
    if (this.socket) {
      this.socket.emit('send-message', messageData);
    }
  }

  // Task events
  taskCreated(taskData) {
    if (this.socket) {
      this.socket.emit('task-created', taskData);
    }
  }

  taskUpdated(taskData) {
    if (this.socket) {
      this.socket.emit('task-updated', taskData);
    }
  }

  taskMoved(taskData) {
    if (this.socket) {
      this.socket.emit('task-moved', taskData);
    }
  }

  taskDeleted(taskData) {
    if (this.socket) {
      this.socket.emit('task-deleted', taskData);
    }
  }

  // Typing indicators
  startTyping(boardId) {
    if (this.socket) {
      this.socket.emit('typing-start', { boardId });
    }
  }

  stopTyping(boardId) {
    if (this.socket) {
      this.socket.emit('typing-stop', { boardId });
    }
  }

  // Event listeners
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;