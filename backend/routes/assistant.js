// backend/routes/assistant.js
const express = require('express');
const router = express.Router();

const { chat } = require('../controllers/assistantController');
const { authenticateWithClerk } = require('../middleware/auth');

router.post('/chat', authenticateWithClerk, chat);

module.exports = router;
