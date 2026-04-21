const express = require('express');
const { getUsers, getUserById, getMe } = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/users', requireAuth, getUsers);
router.get('/me', requireAuth, getMe);
router.get('/users/:id', getUserById);

module.exports = router;
