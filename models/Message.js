const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true
  },
  delivered: {
    type: Boolean,
    default: false,
  },
  read: {
    type: Boolean,
    default: false,
  },
  pending: {
    type: Boolean,
    default: false,
  },
  failed: {
    type: Boolean,
    default: false,
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  readAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Indexes for faster queries
messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ sender: 1, delivered: 1 });
messageSchema.index({ pending: 1 });

// Method to mark message as delivered
messageSchema.methods.markDelivered = function() {
  this.delivered = true;
  this.deliveredAt = new Date();
  return this.save();
};

// Method to mark message as read
messageSchema.methods.markRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark message as failed
messageSchema.methods.markFailed = function() {
  this.failed = true;
  this.pending = false;
  return this.save();
};



module.exports = mongoose.model('Message', messageSchema);
