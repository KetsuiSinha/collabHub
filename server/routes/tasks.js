const express = require('express');
const {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  moveTask,
  addComment,
  updateChecklistItem
} = require('../controllers/taskController');
const { auth } = require('../middleware/auth');
const { validateTask, validateMessage } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Task CRUD
router.post('/board/:boardId', validateTask, createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Task actions
router.patch('/:id/move', moveTask);
router.post('/:id/comments', validateMessage, addComment);
router.patch('/:id/checklist/:itemId', updateChecklistItem);

module.exports = router;