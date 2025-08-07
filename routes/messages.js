const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Message = require('../models/Message');

router.get('/messages/:chatRoomId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      chatRoom: req.params.chatRoomId
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username');

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get pending messages for a user
router.get('/messages/pending', auth, async (req, res) => {
  try {
    const pendingMessages = await Message.find({
      sender: req.user.id,
      pending: true
    }).sort({ createdAt: 1 });

    res.json({ pendingMessages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending messages' });
  }
});

// Mark message as delivered
router.put('/messages/:messageId/delivered', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    await message.markDelivered();
    res.json({ message: 'Message marked as delivered' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

// Mark message as read
router.put('/messages/:messageId/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    await message.markRead();
    res.json({ message: 'Message marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

module.exports = router;
