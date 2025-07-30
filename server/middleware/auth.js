const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Admin only access
const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized as admin'
    });
  }
};

// Board member verification
const boardMemberAuth = async (req, res, next) => {
  try {
    const Board = require('../models/Board');
    const boardId = req.params.boardId || req.params.id;
    
    const board = await Board.findById(boardId);
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check if user is owner or member
    const isMember = board.owner.toString() === req.user.id ||
      board.members.some(member => member.user.toString() === req.user.id);

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this board'
      });
    }

    req.board = board;
    next();
  } catch (error) {
    console.error('Board auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in board authorization'
    });
  }
};

module.exports = { auth, adminAuth, boardMemberAuth };