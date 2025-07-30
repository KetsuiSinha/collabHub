const Board = require('../models/Board');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Create new board
// @route   POST /api/boards
// @access  Private
const createBoard = async (req, res) => {
  try {
    const { title, description, backgroundColor } = req.body;

    const board = await Board.create({
      title,
      description,
      backgroundColor,
      owner: req.user.id,
      members: [{
        user: req.user.id,
        role: 'admin'
      }],
      columns: [
        { id: 'todo', title: 'To Do', position: 0 },
        { id: 'in-progress', title: 'In Progress', position: 1 },
        { id: 'done', title: 'Done', position: 2 }
      ]
    });

    await board.populate([
      { path: 'owner', select: 'username email avatar' },
      { path: 'members.user', select: 'username email avatar isOnline' }
    ]);

    res.status(201).json({
      success: true,
      board
    });
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating board'
    });
  }
};

// @desc    Get user's boards
// @route   GET /api/boards
// @access  Private
const getUserBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      $and: [
        { isArchived: false },
        {
          $or: [
            { owner: req.user.id },
            { 'members.user': req.user.id }
          ]
        }
      ]
    })
    .populate('owner', 'username email avatar')
    .populate('members.user', 'username email avatar isOnline')
    .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: boards.length,
      boards
    });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching boards'
    });
  }
};

// @desc    Get single board with tasks
// @route   GET /api/boards/:id
// @access  Private
const getBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'username email avatar')
      .populate('members.user', 'username email avatar isOnline');

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check if user has access
    if (!board.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get all tasks for this board
    const tasks = await Task.find({ boardId: board._id })
      .populate('assignedTo', 'username email avatar')
      .populate('createdBy', 'username email avatar')
      .sort({ position: 1 });

    res.status(200).json({
      success: true,
      board,
      tasks
    });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching board'
    });
  }
};

// @desc    Update board
// @route   PUT /api/boards/:id
// @access  Private
const updateBoard = async (req, res) => {
  try {
    const { title, description, backgroundColor, columns } = req.body;

    const board = await Board.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check if user is admin
    if (!board.isAdmin(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this board'
      });
    }

    const updatedBoard = await Board.findByIdAndUpdate(
      req.params.id,
      { title, description, backgroundColor, columns },
      { new: true, runValidators: true }
    ).populate([
      { path: 'owner', select: 'username email avatar' },
      { path: 'members.user', select: 'username email avatar isOnline' }
    ]);

    res.status(200).json({
      success: true,
      board: updatedBoard
    });
  } catch (error) {
    console.error('Update board error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating board'
    });
  }
};

// @desc    Delete board
// @route   DELETE /api/boards/:id
// @access  Private
const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Only owner can delete board
    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only board owner can delete the board'
      });
    }

    // Delete all tasks associated with this board
    await Task.deleteMany({ boardId: board._id });

    // Delete the board
    await Board.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Board deleted successfully'
    });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting board'
    });
  }
};

// @desc    Add member to board
// @route   POST /api/boards/:id/members
// @access  Private
const addMember = async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check if user is admin
    if (!board.isAdmin(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Only board admins can add members'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Check if already a member
    if (board.isMember(user._id)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this board'
      });
    }

    board.members.push({ user: user._id, role });
    await board.save();

    await board.populate('members.user', 'username email avatar isOnline');

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      board
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding member'
    });
  }
};

// @desc    Remove member from board
// @route   DELETE /api/boards/:id/members/:memberId
// @access  Private
const removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check if user is admin or removing themselves
    if (!board.isAdmin(req.user.id) && req.user.id !== memberId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this member'
      });
    }

    // Cannot remove board owner
    if (board.owner.toString() === memberId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove board owner'
      });
    }

    board.members = board.members.filter(
      member => member.user.toString() !== memberId
    );
    
    await board.save();
    await board.populate('members.user', 'username email avatar isOnline');

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      board
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing member'
    });
  }
};

module.exports = {
  createBoard,
  getUserBoards,
  getBoard,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember
};