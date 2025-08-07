const express = require('express');
const router = express.Router();

const User = require('../models/user');
const authMiddleware = require('../middleware/authMiddleware'); // HARUS return fungsi

router.get('/users', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id; // dari decoded JWT
    const users = await User.find(
      { _id: { $ne: currentUserId } }, // exclude diri sendiri
      'username displayName publicKey createdAt'
    );
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
