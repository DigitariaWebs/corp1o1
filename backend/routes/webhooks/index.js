const express = require('express');
const clerkWebhookRouter = require('./clerk');

const router = express.Router();

// Clerk webhook routes
router.use('/', clerkWebhookRouter);

module.exports = router;