const Task = require('../models/Task');
const Board = require('../models/Board');

// @desc    Create new task
// @route   POST /api/tasks/board/:boardId
// @access  Private
const createTask = async (req, res) => {
  try {
    const { title, description, columnId, assignedTo, priority, dueDate } = req.body;
    const { boardId } = req.params;

    // Verify board exists and user has access
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    if (!board.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get position for new task (add to end of column)
    const tasksInColumn = await Task.countDocuments({ boardId, columnId });

    const task = await Task.create({
      title,
      description,
      boardId,
      columnId,
      assignedTo,
      priority,
      dueDate,
      position: tasksInColumn,
      createdBy: req.user.id
    });

    await task.populate([
      { path: 'assignedTo', select: 'username email avatar' },
      { path: 'createdBy', select: 'username email avatar' }
    ]);

    res.status(201).json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task'
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'username email avatar')
      .populate('createdBy', 'username email avatar')
      .populate('comments.author', 'username email avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify board access
    const board = await Board.findById(task.boardId);
    if (!board || !board.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task'
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify board access
    const board = await Board.findById(task.boardId);
    if (!board || !board.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'assignedTo', select: 'username email avatar' },
      { path: 'createdBy', select: 'username email avatar' }
    ]);

    res.status(200).json({
      success: true,
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task'
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify board access and permissions
    const board = await Board.findById(task.boardId);
    if (!board || !board.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only task creator or board admin can delete
    if (task.createdBy.toString() !== req.user.id && !board.isAdmin(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task'
    });
  }
};

// @desc    Move task to different column/position
// @route   PATCH /api/tasks/:id/move
// @access  Private
const moveTask = async (req, res) => {
  try {
    const { columnId, position } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify board access
    const board = await Board.findById(task.boardId);
    if (!board || !board.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const oldColumnId = task.columnId;
    const oldPosition = task.position;

    // Update task position and column
    task.columnId = columnId;
    task.position = position;

    // If moving to 'done' column, mark as complete
    if (columnId === 'done' && task.status !== 'done') {
      task.markComplete();
    }

    await task.save();

    // Update positions of other tasks
    if (oldColumnId !== columnId) {
      // Decrement positions of tasks after old position in old column
      await Task.updateMany(
        { 
          boardId: task.boardId, 
          columnId: oldColumnId, 
          position: { $gt: oldPosition } 
        },
        { $inc: { position: -1 } }
      );

      // Increment positions of tasks at/after new position in new column
      await Task.updateMany(
        { 
          boardId: task.boardId, 
          columnId: columnId, 
          position: { $gte: position },
          _id: { $ne: task._id }
        },
        { $inc: { position: 1 } }
      );
    } else {
      // Moving within same column
      if (position > oldPosition) {
        // Moving down: decrement positions between old and new
        await Task.updateMany(
          { 
            boardId: task.boardId, 
            columnId: columnId, 
            position: { $gt: oldPosition, $lte: position },
            _id: { $ne: task._id }
          },
          { $inc: { position: -1 } }
        );
      } else if (position < oldPosition) {
        // Moving up: increment positions between new and old
        await Task.updateMany(
          { 
            boardId: task.boardId, 
            columnId: columnId, 
            position: { $gte: position, $lt: oldPosition },
            _id: { $ne: task._id }
          },
          { $inc: { position: 1 } }
        );
      }
    }

    await task.populate([
      { path: 'assignedTo', select: 'username email avatar' },
      { path: 'createdBy', select: 'username email avatar' }
    ]);

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Move task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error moving task'
    });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify board access
    const board = await Board.findById(task.boardId);
    if (!board || !board.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    task.comments.push({
      text,
      author: req.user.id
    });

    await task.save();
    await task.populate('comments.author', 'username email avatar');

    res.status(201).json({
      success: true,
      comment: task.comments[task.comments.length - 1]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
};

// @desc    Update checklist item
// @route   PATCH /api/tasks/:id/checklist/:itemId
// @access  Private
const updateChecklistItem = async (req, res) => {
  try {
    const { completed } = req.body;
    const { itemId } = req.params;
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify board access
    const board = await Board.findById(task.boardId);
    if (!board || !board.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const checklistItem = task.checklist.id(itemId);
    if (!checklistItem) {
      return res.status(404).json({
        success: false,
        message: 'Checklist item not found'
      });
    }

    checklistItem.completed = completed;
    if (completed) {
      checklistItem.completedBy = req.user.id;
      checklistItem.completedAt = new Date();
    } else {
      checklistItem.completedBy = undefined;
      checklistItem.completedAt = undefined;
    }

    await task.save();

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Update checklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating checklist item'
    });
  }
};

module.exports = {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  moveTask,
  addComment,
  updateChecklistItem
};