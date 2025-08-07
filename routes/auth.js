// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

function generateToken(user) {
  return jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  const { username, password, publicKey } = req.body;
  if (!username || !password || !publicKey)
    return res.status(400).json({ error: 'Username, password, and publicKey are required' });

  const existingUser = await User.findOne({ username });
  if (existingUser)
    return res.status(400).json({ error: 'Username already taken' });

  const user = new User({ username, password, publicKey });
  await user.save();

  const token = generateToken(user);

  res.status(201).json({
    message: 'User registered',
    user: {
      id: user._id,
      username: user.username,
      publicKey: user.publicKey,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

  const token = generateToken(user);

  res.status(200).json({
    message: 'Login successful',
    user: {
      id: user._id,
      username: user.username,
      publicKey: user.publicKey,
      createdAt: user.createdAt,
    },
    token,
  });
});

module.exports = router;
