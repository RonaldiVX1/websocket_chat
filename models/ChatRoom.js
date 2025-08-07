const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

chatRoomSchema.index({ participants: 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
