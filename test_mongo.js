// test_mongo.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  from: String,
  to: String,
  content: String,
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

const Message = mongoose.model('Message', MessageSchema);

mongoose.connect('mongodb://localhost:27017/chatapp')
  .then(async () => {
    console.log("Connected to DB");

    const msg = new Message({
      from: 'user1',
      to: 'user2',
      content: 'Hello via MongoDB!',
    });

    await msg.save();
    console.log("✅ Message saved!");

    const all = await Message.find();
    console.log(all);
    process.exit();
  });
