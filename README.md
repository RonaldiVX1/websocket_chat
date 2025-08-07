# WebSocket Chat Application

## Overview
This is a real-time chat application backend built with Node.js, Express, WebSocket, and MongoDB. It supports secure, real-time communication with offline message queuing and delivery status indicators.

**Encryption/Decryption:**
- All message encryption and decryption is handled by the client device (e.g., Flutter app).
- The server only stores and delivers ciphertext provided by the client.
- The server does not perform any encryption or decryption operations.

## Features
- Real-time messaging using WebSockets
- User authentication with JWT
- Message history with offline access
- Graceful handling of connectivity loss
- Message queuing for offline users
- Message delivery and read status
- Automatic WebSocket reconnection
- Heartbeat mechanism to detect disconnected clients

## Prerequisites
- Node.js (v14+)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   JWT_SECRET=your_secure_jwt_secret
   MONGODB_URI=mongodb://localhost:27017/chatapp
   PORT=8080
   ```
4. Start the server:
   ```
   npm start
   ```

## API Endpoints

### Authentication
- `POST /register` - Register a new user
  - **Request Body:**
    ```json
    {
      "username": "string",
      "password": "string",
      "publicKey": "string"
    }
    ```
  - **Response:**
    ```json
    {
      "message": "User registered",
      "user": {
        "id": "string",
        "username": "string",
        "publicKey": "string",
        "createdAt": "date"
      },
      "token": "jwt_token"
    }
    ```
- `POST /login` - Login and get JWT token
  - **Request Body:**
    ```json
    {
      "username": "string",
      "password": "string"
    }
    ```
  - **Response:**
    ```json
    {
      "message": "Login successful",
      "user": {
        "id": "string",
        "username": "string",
        "publicKey": "string",
        "createdAt": "date"
      },
      "token": "jwt_token"
    }
    ```

### Users
- `GET /users` - Get all users (except current user)
  - **Response:**
    ```json
    {
      "users": [
        {
          "_id": "string",
          "username": "string",
          "displayName": "string",
          "publicKey": "string",
          "createdAt": "date"
        },
        ...
      ]
    }
    ```

### Chat Rooms
- `POST /api/chatroom` - Create or find a chat room with another user
  - **Request Body:**
    ```json
    {
      "otherUserId": "string"
    }
    ```
  - **Response:**
    ```json
    {
      "chatRoom": {
        "_id": "string",
        "participants": ["userId1", "userId2"],
        "createdAt": "date",
        "updatedAt": "date"
      }
    }
    ```

### Messages
- `GET /api/messages/:chatRoomId` - Get all messages in a chat room
- `GET /api/messages/pending` - Get all pending messages for current user
- `PUT /api/messages/:messageId/delivered` - Mark a message as delivered
- `PUT /api/messages/:messageId/read` - Mark a message as read

## WebSocket Connection

Connect to the WebSocket server using:
```
ws://localhost:8081/ws/chatroom/:chatRoomId
```

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### WebSocket Message Types

#### Error Handling
The server may send error messages in the following format:
```json
{
  "type": "error",
  "message": "Error description"
}
```

Common errors include:
- Invalid message format
- Missing required fields
- Encryption/decryption errors
- Database validation errors

#### Sending Messages
```json
{
  "type": "message",
  "content": "Hello, world!",
  "to": "recipient_user_id"
}
```

> **Important**: The `content` field must be a string. If you encounter a RangeError during encryption, try shortening your message or removing special characters.

#### Resending Pending Messages
```json
{
  "type": "message",
  "messageId": "existing_message_id",
  "content": "Hello, world!",
  "to": "recipient_user_id"
}
```

#### Updating Message Status
```json
{
  "type": "message_status",
  "messageId": "message_id",
  "status": "read"
}
```

#### Heartbeat
```json
{
  "type": "heartbeat"
}
```

## Mobile Client Implementation

For the Flutter mobile client, implement:
1. Secure token storage using EncryptedStorage/SecurePreferences/Keychain
2. WebSocket connection with automatic reconnection
3. Local message queue for offline messages
4. Local database for message history
5. UI for displaying message status (sent, delivered, read)

## License
MIT