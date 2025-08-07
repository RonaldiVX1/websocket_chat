const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const authMiddleware = require('../middleware/authMiddleware'); 

// Find or create chatroom between two users
router.post('/chatroom', authMiddleware, async (req, res) => {
  const { otherUserId } = req.body;
  const currentUserId = req.user.id;

  if (!otherUserId) {
    return res.status(400).json({ error: 'Missing otherUserId' });
  }

  try {
    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [currentUserId, otherUserId], $size: 2 }
    });

    if (!chatRoom) {
      chatRoom = await ChatRoom.create({
        participants: [currentUserId, otherUserId]
      });
    }

    res.json({ chatRoom });
  } catch (err) {
    res.status(500).json({ error: 'Failed to find/create chatroom' });
  }
});

module.exports = router;
