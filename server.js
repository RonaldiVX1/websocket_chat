// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const setupWebSocket = require('./ws/chat');
const chatRoomRoutes = require('./routes/chatroom');


const app = express();
const server = http.createServer(app);

// Connect to DB
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/api', chatRoomRoutes);
app.use('/api', messageRoutes);


// WebSocket
setupWebSocket(server);

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});