const express = require('express');
const {
  createBoard,
  getUserBoards,
  getBoard,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember
} = require('../controllers/boardController');
const { auth, boardMemberAuth } = require('../middleware/auth');
const { validateBoard } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Board CRUD
router.post('/', validateBoard, createBoard);
router.get('/', getUserBoards);
router.get('/:id', getBoard);
router.put('/:id', validateBoard, updateBoard);
router.delete('/:id', deleteBoard);

// Member management
router.post('/:id/members', addMember);
router.delete('/:id/members/:memberId', removeMember);

module.exports = router;  