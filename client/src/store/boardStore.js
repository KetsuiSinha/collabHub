import { create } from 'zustand';
import { boardsAPI } from '../services/boards';
import { tasksAPI } from '../services/tasks';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

export const useBoardStore = create((set, get) => ({
  boards: [],
  currentBoard: null,
  tasks: [],
  loading: false,
  error: null,

  // Fetch all boards
  fetchBoards: async () => {
    set({ loading: true, error: null });
    try {
      const response = await boardsAPI.getBoards();
      set({
        boards: response.boards,
        loading: false
      });
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch boards'
      });
    }
  },

  // Fetch single board with tasks
  fetchBoard: async (boardId) => {
    set({ loading: true, error: null });
    try {
      const response = await boardsAPI.getBoard(boardId);
      set({
        currentBoard: response.board,
        tasks: response.tasks,
        loading: false
      });

      // Join board socket room
      socketService.joinBoard(boardId, response.board.owner.id);

      return response;
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch board'
      });
      throw error;
    }
  },

  // Create board
  createBoard: async (boardData) => {
    set({ loading: true });
    try {
      const response = await boardsAPI.createBoard(boardData);
      
      set((state) => ({
        boards: [response.board, ...state.boards],
        loading: false
      }));

      toast.success('Board created successfully!');
      return response;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // Update board
  updateBoard: async (boardId, boardData) => {
    try {
      const response = await boardsAPI.updateBoard(boardId, boardData);
      
      set((state) => ({
        boards: state.boards.map(board => 
          board._id === boardId ? response.board : board
        ),
        currentBoard: state.currentBoard?._id === boardId 
          ? response.board 
          : state.currentBoard
      }));

      toast.success('Board updated successfully!');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete board
  deleteBoard: async (boardId) => {
    try {
      await boardsAPI.deleteBoard(boardId);
      
      set((state) => ({
        boards: state.boards.filter(board => board._id !== boardId),
        currentBoard: state.currentBoard?._id === boardId 
          ? null 
          : state.currentBoard
      }));

      toast.success('Board deleted successfully!');
    } catch (error) {
      throw error;
    }
  },

  // Add member to board
  addMember: async (boardId, memberData) => {
    try {
      const response = await boardsAPI.addMember(boardId, memberData);
      
      set((state) => ({
        currentBoard: response.board,
        boards: state.boards.map(board => 
          board._id === boardId ? response.board : board
        )
      }));

      toast.success('Member added successfully!');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Task operations
  createTask: async (boardId, taskData) => {
    try {
      const response = await tasksAPI.createTask(boardId, taskData);
      
      set((state) => ({
        tasks: [...state.tasks, response.task]
      }));

      // Emit socket event
      socketService.taskCreated({
        boardId,
        task: response.task
      });

      toast.success('Task created successfully!');
      return response;
    } catch (error) {
      throw error;
    }
  },

  updateTask: async (taskId, taskData) => {
    try {
      const response = await tasksAPI.updateTask(taskId, taskData);
      
      set((state) => ({
        tasks: state.tasks.map(task => 
          task._id === taskId ? response.task : task
        )
      }));

      // Emit socket event
      socketService.taskUpdated({
        boardId: get().currentBoard?._id,
        task: response.task
      });

      toast.success('Task updated successfully!');
      return response;
    } catch (error) {
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    try {
      await tasksAPI.deleteTask(taskId);
      
      const task = get().tasks.find(t => t._id === taskId);
      
      set((state) => ({
        tasks: state.tasks.filter(task => task._id !== taskId)
      }));

      // Emit socket event
      socketService.taskDeleted({
        boardId: get().currentBoard?._id,
        taskId,
        taskTitle: task?.title
      });

      toast.success('Task deleted successfully!');
    } catch (error) {
      throw error;
    }
  },

  moveTask: async (taskId, moveData) => {
    try {
      const response = await tasksAPI.moveTask(taskId, moveData);
      
      set((state) => ({
        tasks: state.tasks.map(task => 
          task._id === taskId ? response.task : task
        )
      }));

      // Emit socket event
      socketService.taskMoved({
        boardId: get().currentBoard?._id,
        task: response.task,
        ...moveData
      });

      return response;
    } catch (error) {
      throw error;
    }
  },

  // Socket event handlers
  handleSocketEvents: () => {
    // Task events
    socketService.on('task-created', (data) => {
      set((state) => ({
        tasks: [...state.tasks, data.task]
      }));
      toast.success(`${data.createdBy} created a new task`);
    });

    socketService.on('task-updated', (data) => {
      set((state) => ({
        tasks: state.tasks.map(task => 
          task._id === data.task._id ? data.task : task
        )
      }));
    });

    socketService.on('task-moved', (data) => {
      set((state) => ({
        tasks: state.tasks.map(task => 
          task._id === data.task._id ? data.task : task
        )
      }));
    });

    socketService.on('task-deleted', (data) => {
      set((state) => ({
        tasks: state.tasks.filter(task => task._id !== data.taskId)
      }));
      toast.info(`${data.deletedBy} deleted task "${data.taskTitle}"`);
    });
  },

  // Clear current board
  clearCurrentBoard: () => {
    const currentBoard = get().currentBoard;
    if (currentBoard) {
      socketService.leaveBoard(currentBoard._id);
    }
    set({
      currentBoard: null,
      tasks: []
    });
  },

  // Clear error
  clearError: () => set({ error: null })
}));