import { reminderService } from './services/reminderService';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import bookingRoutes from './routes/bookings';
import teacherRoutes from './routes/teachers';
import paymentRoutes from './routes/payments';
import messageRoutes from './routes/messages';
import notificationRoutes from './routes/notifications';
import emailOtpRoutes from './routes/email-otp';

import './passport-config';

dotenv.config();

const app: Application = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
    methods: ['GET', 'POST'],
    credentials: true
  }
});


// --- Online Users Tracking ---
// Map userId (string) to socket.id
export const connectedUsers = new Map<string, string>();

io.on('connection', (socket) => {
  // Handle user authentication
  socket.on('authenticate', (userId: string) => {
    connectedUsers.set(userId, socket.id);
    socket.join(`user_${userId}`);
    io.emit('user_online', userId);
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        io.emit('user_offline', userId);
        break;
      }
    }
  });
});

// Helper to check if a user is online
export function isUserOnline(userId: string): boolean {
  return connectedUsers.has(userId);
}

const PORT = process.env.PORT || 5000;

// Add a simple health check endpoint to test CORS
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    cors_origin: process.env.CORS_ORIGIN 
  });
});

// Middleware - Set limits for image uploads (1MB for MongoDB free tier)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
// Add the cookie-parser middleware here
app.use(cookieParser());

// Add error handling middleware for large payloads
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large',
      message: 'The uploaded file or data is too large. Please upload an image smaller than 1MB.'
    });
  }
  next(error);
});
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));

// Debug middleware for request size (temporary)
app.use('/api/profile', (req, res, next) => {
  const contentLength = req.headers['content-length'];
  if (contentLength) {
    console.log(`Profile request size: ${contentLength} bytes (${(parseInt(contentLength) / 1024 / 1024).toFixed(2)} MB)`);
  }
  next();
});

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'yuvsiksha-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
  }),
  cookie: {
    secure: true, // Always true for HTTPS
    httpOnly: true,
    sameSite: 'none',
    domain: '.yuvsiksha.in', // Fixed domain spelling
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Set socket.io instance for notifications
    import('./services/notificationService').then(({ setSocketIO }) => {
      setSocketIO(io);
    });
    
    // Initialize reminder service after DB connection
    reminderService.init();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// MongoDB connection status logging
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY);
console.log('CASHFREE_APP_ID:', process.env.CASHFREE_APP_ID);
console.log('CASHFREE_SECRET_KEY:', process.env.CASHFREE_SECRET_KEY ? '***' : 'MISSING');

// Debug logging middleware - MOVED to a higher level
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  if (req.body) console.log('Body:', req.body);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/email-otp', emailOtpRoutes);

// Root Route
app.get('/', (_req, res) => {
  res.send('API is running...');
});

// Test DB Connection Route with TypeScript-safe check
app.get('/test-db-connection', async (_req, res) => {
  try {
    await mongoose.connection.asPromise();
    const db = mongoose.connection.db;

    if (!db) {
      return res.status(500).json({ message: 'Database is not ready' });
    }

    const testUser = await db.collection('users').findOne({});
    console.log('Test DB Connection: Found a user:', testUser ? testUser._id : 'No user found');
    res.json({ 
      message: 'DB connection test complete', 
      userFound: !!testUser, 
      testUser: testUser ? testUser._id.toString() : null
    });
  } catch (err: any) {
    console.error('Test DB Connection Error:', err);
    res.status(500).json({ message: 'DB connection test failed', error: err.message });
  }
});



io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user authentication
  socket.on('authenticate', (userId: string) => {
    connectedUsers.set(userId, socket.id);
    socket.join(`user_${userId}`);
    console.log(`🔐 User ${userId} authenticated with socket ${socket.id} and joined room user_${userId}`);
    
    // Notify other users that this user is online
    socket.broadcast.emit('user_online', userId);
  });

  // Handle test ping
  socket.on('test_ping', (data) => {
    console.log('📡 Received test ping from client:', data);
    socket.emit('test_pong', { message: 'Hello from server', timestamp: new Date() });
  });

  // Handle test ping
  socket.on('test_ping', (data) => {
    console.log('📡 Received test ping from client:', data);
    socket.emit('test_pong', { message: 'Hello from server', timestamp: new Date() });
  });

  // Handle joining chat rooms
  socket.on('join_room', (roomId: string) => {
    socket.join(roomId);
    console.log(`🚪 Socket ${socket.id} joined chat room ${roomId}`);
  });

  // Handle sending messages
  socket.on('send_message', async (data: {
    sender: string;
    recipient: string;
    content: string;
    messageType?: string;
    booking?: string;
  }) => {
    try {
      // Import Message model dynamically to avoid circular dependencies
      const Message = (await import('./models/Message')).default;
      
      // Check if this is a new conversation by looking for existing messages between these users
      const existingMessages = await Message.findOne({
        $or: [
          { sender: data.sender, recipient: data.recipient },
          { sender: data.recipient, recipient: data.sender }
        ]
      });
      
      const isNewConversation = !existingMessages;
      
      // Create new message
      const newMessage = new Message({
        sender: data.sender,
        recipient: data.recipient,
        content: data.content,
        messageType: data.messageType || 'text',
        booking: data.booking || null
      });

      await newMessage.save();
      
      // Populate sender and recipient info
      await newMessage.populate([
        { path: 'sender', select: 'firstName lastName avatar email' },
        { path: 'recipient', select: 'firstName lastName avatar email' }
      ]);

      // Create room ID (consistent for both users)
      const roomId = [data.sender, data.recipient].sort().join('_');
      
      console.log(`📨 Broadcasting message to room: ${roomId} and user_${data.recipient}${isNewConversation ? ' (NEW CONVERSATION)' : ''}`);
      
      // Emit to both users in the chat room
      io.to(roomId).emit('new_message', newMessage);
      
      // If this is a new conversation, emit special event to notify about new conversation
      if (isNewConversation) {
        io.to(`user_${data.recipient}`).emit('new_conversation', {
          participant: newMessage.sender,
          lastMessage: {
            content: data.content,
            createdAt: newMessage.createdAt
          },
          unreadCount: 1
        });
      }
      
      // Also emit to individual user rooms in case they're not in the chat room
      io.to(`user_${data.recipient}`).emit('message_notification', {
        messageId: newMessage._id,
        sender: newMessage.sender,
        content: data.content,
        timestamp: newMessage.createdAt
      });
      
      // Send confirmation back to the sender
      socket.emit('message_sent', {
        _id: newMessage._id,
        content: newMessage.content,
        createdAt: newMessage.createdAt,
        sender: newMessage.sender,
        recipient: newMessage.recipient
      });

      // Create a message notification in the database
      const { notificationService } = await import('./services/notificationService');
      const populatedSender = newMessage.sender as any; // Type assertion for populated field
      await notificationService.createNotification({
        recipient: new (await import('mongoose')).Types.ObjectId(data.recipient),
        sender: new (await import('mongoose')).Types.ObjectId(data.sender),
        title: 'New Message',
        message: `You have a new message from ${populatedSender.firstName} ${populatedSender.lastName}`,
        type: 'message',
        category: 'message',
        priority: 'low',
        actionUrl: `/messages/${data.sender}`,
        data: {
          messageId: newMessage._id,
          senderId: data.sender
        }
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle message read status
  socket.on('mark_message_read', async (messageId: string) => {
    try {
      const Message = (await import('./models/Message')).default;
      await Message.findByIdAndUpdate(messageId, {
        isRead: true,
        readAt: new Date()
      });
      
      socket.broadcast.emit('message_read', { messageId });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Remove user from connected users and notify others
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`🔌 User ${userId} disconnected (socket: ${socket.id})`);
        
        // Notify other users that this user is offline
        socket.broadcast.emit('user_offline', userId);
        break;
      }
    }
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});