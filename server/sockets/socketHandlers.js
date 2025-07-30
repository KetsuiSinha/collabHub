const Message = require('../models/Message');
const User = require('../models/User');
const Board = require('../models/Board');

const socketHandlers = (io) => {
  // Store active users
  const activeUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User authentication for socket
    socket.on('authenticate', async (data) => {
      try {
        const { userId, username } = data;
        socket.userId = userId;
        socket.username = username;
        
        // Update user online status
        await User.findByIdAndUpdate(userId, { 
          isOnline: true,
          lastSeen: new Date()
        });

        activeUsers.set(userId, {
          socketId: socket.id,
          username,
          joinedAt: new Date()
        });

        console.log(`User ${username} authenticated`);
      } catch (error) {
        console.error('Socket authentication error:', error);
      }
    });

    // Join board room
    socket.on('join-board', async (data) => {
      try {
        const { boardId, userId } = data;
        
        // Verify user has access to board
        const board = await Board.findById(boardId);
        if (!board || !board.isMember(userId)) {
          socket.emit('error', { message: 'Access denied to board' });
          return;
        }

        socket.join(boardId);
        socket.currentBoardId = boardId;

        // Get recent messages for this board
        const messages = await Message.find({ boardId })
          .populate('sender', 'username avatar')
          .sort({ createdAt: -1 })
          .limit(50);

        socket.emit('board-messages', messages.reverse());

        // Notify others in the board about user joining
        socket.to(boardId).emit('user-joined', {
          userId,
          username: socket.username,
          message: `${socket.username} joined the board`
        });

        // Send list of online users in this board
        const onlineUsers = Array.from(activeUsers.values())
          .filter(user => {
            const userSocket = io.sockets.sockets.get(user.socketId);
            return userSocket && userSocket.rooms.has(boardId);
          });

        socket.emit('online-users', onlineUsers);
        socket.to(boardId).emit('user-online', {
          userId,
          username: socket.username
        });

        console.log(`User ${socket.username} joined board ${boardId}`);
      } catch (error) {
        console.error('Join board error:', error);
        socket.emit('error', { message: 'Failed to join board' });
      }
    });

    // Leave board room
    socket.on('leave-board', (data) => {
      const { boardId } = data;
      socket.leave(boardId);
      
      if (socket.currentBoardId === boardId) {
        socket.currentBoardId = null;
      }

      // Notify others about user leaving
      socket.to(boardId).emit('user-left', {
        userId: socket.userId,
        username: socket.username,
        message: `${socket.username} left the board`
      });
    });

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { content, boardId, messageType = 'text', fileUrl, fileName } = data;

        if (!socket.userId || !socket.currentBoardId) {
          socket.emit('error', { message: 'Not authenticated or not in a board' });
          return;
        }

        // Verify user has access to board
        const board = await Board.findById(boardId);
        if (!board || !board.isMember(socket.userId)) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        const message = await Message.create({
          content,
          sender: socket.userId,
          boardId,
          messageType,
          fileUrl,
          fileName
        });

        await message.populate('sender', 'username avatar');

        // Broadcast to all users in the board
        io.to(boardId).emit('new-message', message);

        console.log(`Message sent in board ${boardId} by ${socket.username}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Task-related events
    socket.on('task-created', (data) => {
      if (socket.currentBoardId) {
        socket.to(socket.currentBoardId).emit('task-created', {
          ...data,
          createdBy: socket.username
        });
      }
    });

    socket.on('task-updated', (data) => {
      if (socket.currentBoardId) {
        socket.to(socket.currentBoardId).emit('task-updated', {
          ...data,
          updatedBy: socket.username
        });
      }
    });

    socket.on('task-moved', (data) => {
      if (socket.currentBoardId) {
        socket.to(socket.currentBoardId).emit('task-moved', {
          ...data,
          movedBy: socket.username
        });
      }
    });

    socket.on('task-deleted', (data) => {
      if (socket.currentBoardId) {
        socket.to(socket.currentBoardId).emit('task-deleted', {
          ...data,
          deletedBy: socket.username
        });
      }
    });

    // Typing indicators
    socket.on('typing-start', (data) => {
      if (socket.currentBoardId) {
        socket.to(socket.currentBoardId).emit('user-typing', {
          userId: socket.userId,
          username: socket.username
        });
      }
    });

    socket.on('typing-stop', (data) => {
      if (socket.currentBoardId) {
        socket.to(socket.currentBoardId).emit('user-stop-typing', {
          userId: socket.userId
        });
      }
    });

    // Cursor position sharing (for collaborative features)
    socket.on('cursor-position', (data) => {
      if (socket.currentBoardId) {
        socket.to(socket.currentBoardId).emit('user-cursor', {
          userId: socket.userId,
          username: socket.username,
          position: data.position
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id}`);
      
      if (socket.userId) {
        try {
          // Update user offline status
          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            lastSeen: new Date()
          });

          // Remove from active users
          activeUsers.delete(socket.userId);

          // Notify board members if user was in a board
          if (socket.currentBoardId) {
            socket.to(socket.currentBoardId).emit('user-offline', {
              userId: socket.userId,
              username: socket.username
            });
          }
        } catch (error) {
          console.error('Disconnect cleanup error:', error);
        }
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Handle io errors
  io.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });
};

module.exports = socketHandlers;