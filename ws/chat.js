const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const clients = new Map();
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const CLIENT_TIMEOUT = 60000; // 60 seconds

function setupWebSocket(server) {
    console.log('🔧 setupWebSocket initialized'); // <--- tambahkan ini

  const wss = new WebSocket.Server({ noServer: true });
  
  // Heartbeat to detect disconnected clients
  function heartbeat() {
    this.isAlive = true;
  }
  
  // Check for dead connections and clean them up
  const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
      if (ws.isAlive === false) {
        clients.delete(ws.userId);
        console.log(`🔴 User ${ws.userId} timed out`);
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, HEARTBEAT_INTERVAL);

  server.on('upgrade', async (req, socket, head) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');

    if (pathParts.length !== 4 || pathParts[1] !== 'ws' || pathParts[2] !== 'chatroom') {
      socket.destroy();
      return;
    }

    const chatRoomId = pathParts[3];

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const token = authHeader.split(' ')[1];
    let userId;

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, function done(ws) {
      ws.userId = userId;
      ws.chatRoomId = chatRoomId;
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', async (ws) => {
    const { userId, chatRoomId } = ws;
    clients.set(userId, ws);
    ws.isAlive = true;
    
    // Setup heartbeat
    ws.on('pong', heartbeat);
    
    console.log(`🟢 User ${userId} connected to chatroom ${chatRoomId}`);
    
    // Send connection status to client
    ws.send(JSON.stringify({
      type: 'connection_status',
      status: 'connected',
      userId,
      chatRoomId
    }));
    
    // Check for pending messages to send
    try {
      const pendingMessages = await Message.find({
        chatRoom: chatRoomId,
        sender: { $ne: userId },
        delivered: false
      }).sort({ createdAt: 1 });
      
      if (pendingMessages.length > 0) {
        console.log(`Found ${pendingMessages.length} pending messages for user ${userId}`);
        
        // Send pending messages
        for (const message of pendingMessages) {
          ws.send(JSON.stringify({
            type: 'message',
            message: {
              _id: message._id,
              chatRoomId: message.chatRoom,
              from: message.sender,
              to: userId,
              content: message.content,
              createdAt: message.createdAt
            }
          }));
          
          // Mark as delivered
          await message.markDelivered();
        }
      }
    } catch (err) {
      console.error('Error processing pending messages:', err);
    }

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data);
        const { content, to, messageId, type } = msg;
        
        // Validate message data
        if (type === 'message' && (!content || !to)) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message: content and recipient are required'
          }));
          return;
        }
        
        // Handle different message types
        if (type === 'heartbeat') {
          // Client heartbeat
          ws.isAlive = true;
          return;
        }
        
        if (type === 'message_status') {
          // Handle message status updates (read/delivered)
          if (msg.status === 'read' && msg.messageId) {
            const message = await Message.findById(msg.messageId);
            if (message) {
              await message.markRead();
              
              // Notify sender if online
              const senderSocket = clients.get(message.sender.toString());
              if (senderSocket) {
                senderSocket.send(JSON.stringify({
                  type: 'message_status',
                  messageId: message._id,
                  status: 'read',
                  timestamp: new Date()
                }));
              }
            }
          }
          return;
        }
        
        // Check if this is a resend of a pending message
        let message;
        if (messageId) {
          message = await Message.findById(messageId);
          if (message) {
            message.pending = false;
            await message.save();
          }
        }
        
        // Create new message if not a resend
        if (!message) {
          try {
            // Ensure content is properly formatted
            const messageContent = typeof content === 'string' ? content : String(content);
            
            message = await Message.create({
              chatRoom: chatRoomId,
              sender: userId,
              content: messageContent,
              pending: clients.get(to) ? false : true, // Mark as pending if recipient is offline
            });
          } catch (error) {
            console.error('Failed to create message:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to create message: ' + error.message
            }));
            return;
          }
        }

        // Send confirmation to sender
        ws.send(JSON.stringify({
          type: 'message',
          message: {
            _id: message._id,
            chatRoomId,
            from: userId,
            to,
            content,
            createdAt: message.createdAt,
            pending: message.pending,
            delivered: message.delivered,
            read: message.read
          }
        }));

        // Send to recipient if online
        const receiverSocket = clients.get(to);
        if (receiverSocket) {
          receiverSocket.send(JSON.stringify({
            type: 'message',
            message: {
              _id: message._id,
              chatRoomId,
              from: userId,
              to,
              content,
              createdAt: message.createdAt,
            }
          }));
          
          // Mark as delivered
          message.delivered = true;
          message.deliveredAt = new Date();
          await message.save();
          
          // Notify sender of delivery
          ws.send(JSON.stringify({
            type: 'message_status',
            messageId: message._id,
            status: 'delivered',
            timestamp: message.deliveredAt
          }));
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    // Handle client status updates
    ws.on('status', (status) => {
      if (status === 'offline') {
        clients.delete(userId);
        console.log(`🔴 User ${userId} went offline`);
      }
    });
    
    ws.on('close', () => {
      clients.delete(userId);
      console.log(`🔴 User ${userId} disconnected`);
    });
  });

  // Clean up interval on server close
  wss.on('close', function close() {
    clearInterval(interval);
  });
  
  return wss;
}

module.exports = setupWebSocket;
