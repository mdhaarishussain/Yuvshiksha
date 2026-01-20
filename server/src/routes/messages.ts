import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Message from '../models/Message';
import User from '../models/User';

const router = express.Router();

// Debug route to test if messages routes are loaded
router.get('/test', (req, res) => {
  res.json({ message: 'Messages routes are working!', timestamp: new Date() });
});

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get conversations for a user
router.get('/conversations', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    console.log('🔍 Fetching conversations for user ID:', userId);
    console.log('🆔 User ID type:', typeof userId, userId.constructor.name);
    
    // Convert userId to ObjectId for aggregation
    const userObjectId = new mongoose.Types.ObjectId(userId);
    console.log('🔄 Converted to ObjectId:', userObjectId);
    
    // First, let's check if there are any messages for this user
    const userMessages = await Message.find({
      $or: [
        { sender: userObjectId },
        { recipient: userObjectId }
      ],
      isDeleted: false
    });
    
    console.log('📩 Found messages for user:', userMessages.length);
    console.log('📋 Sample messages:', userMessages.slice(0, 3).map(m => ({
      id: m._id,
      sender: m.sender,
      recipient: m.recipient,
      content: m.content.substring(0, 50)
    })));
    
    // Get all messages where user is sender or recipient
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userObjectId },
            { recipient: userObjectId }
          ],
          isDeleted: false
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userObjectId] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', userObjectId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'participant'
        }
      },
      {
        $unwind: '$participant'
      },
      {
        $project: {
          participant: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            avatar: 1,
            role: 1
          },
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    console.log('🎯 Final aggregation result:', messages.length, 'conversations');
    console.log('📊 Conversations data:', messages);

    res.json(messages);
  } catch (error) {
    console.error('❌ Error in conversations endpoint:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// Get messages between two users
router.get('/conversation/:participantId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const { participantId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: participantId },
        { sender: participantId, recipient: userId }
      ],
      isDeleted: false
    })
    .populate('sender', 'firstName lastName avatar email')
    .populate('recipient', 'firstName lastName avatar email')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit as string))
    .skip((parseInt(page as string) - 1) * parseInt(limit as string));

    // Mark messages as read
    await Message.updateMany({
      sender: participantId,
      recipient: userId,
      isRead: false
    }, {
      isRead: true,
      readAt: new Date()
    });

    res.json(messages.reverse()); // Reverse to show oldest first
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Get total unread message count for a user
router.get('/unread-count', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const unreadCount = await Message.countDocuments({
      recipient: userObjectId,
      isRead: false,
      isDeleted: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('❌ Error fetching unread message count:', error);
    res.status(500).json({ message: 'Failed to fetch unread message count' });
  }
});

// Send a new message
router.post('/send', authenticateToken, async (req: any, res) => {
  try {
    const { recipient, content, messageType = 'text', booking, replyTo } = req.body;
    const userId = req.user._id;

    console.log('💬 Sending message from user:', userId, 'to recipient:', recipient);
    console.log('📝 Message content:', content);

    // Validate recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      console.log('❌ Recipient not found:', recipient);
      return res.status(404).json({ message: 'Recipient not found' });
    }

    console.log('✅ Recipient found:', recipientUser.firstName, recipientUser.lastName);

    const newMessage = new Message({
      sender: userId,
      recipient,
      content,
      messageType,
      booking: booking || null,
      replyTo: replyTo || null
    });

    await newMessage.save();
    
    console.log('💾 Message saved with ID:', newMessage._id);
    console.log('📊 Message details:', {
      id: newMessage._id,
      sender: newMessage.sender,
      recipient: newMessage.recipient,
      content: newMessage.content
    });
    
    await newMessage.populate([
      { path: 'sender', select: 'firstName lastName avatar email' },
      { path: 'recipient', select: 'firstName lastName avatar email' },
      { path: 'replyTo' }
    ]);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Mark message as read
router.patch('/:messageId/read', authenticateToken, async (req: any, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findOneAndUpdate(
      { 
        _id: messageId, 
        recipient: userId 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Failed to mark message as read' });
  }
});

// Delete a message
router.delete('/:messageId', authenticateToken, async (req: any, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findOneAndUpdate(
      { 
        _id: messageId, 
        sender: userId 
      },
      { 
        isDeleted: true, 
        deletedAt: new Date() 
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

// Search messages
router.get('/search', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const { query, participantId } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchFilter: any = {
      $or: [
        { sender: userId },
        { recipient: userId }
      ],
      content: { $regex: query, $options: 'i' },
      isDeleted: false
    };

    if (participantId) {
      searchFilter.$or = [
        { sender: userId, recipient: participantId },
        { sender: participantId, recipient: userId }
      ];
    }

    const messages = await Message.find(searchFilter)
      .populate('sender', 'firstName lastName avatar email')
      .populate('recipient', 'firstName lastName avatar email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(messages);
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ message: 'Failed to search messages' });
  }
});

export default router;
