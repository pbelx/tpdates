// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dating_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  bio: { type: String, maxlength: 500 },
  photos: [{ type: String }], // Array of photo URLs
  interests: [{ type: String }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  preferences: {
    minAge: { type: Number, default: 18 },
    maxAge: { type: Number, default: 50 },
    maxDistance: { type: Number, default: 50 }, // in kilometers
    interestedIn: { type: String, enum: ['men', 'women', 'both'], required: true }
  },
  verified: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Create geospatial index for location-based queries
userSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', userSchema);

// Match Schema
const matchSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user1Liked: { type: Boolean, default: false },
  user2Liked: { type: Boolean, default: false },
  isMatch: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Ensure unique matches between users
matchSchema.index({ user1: 1, user2: 1 }, { unique: true });

const Match = mongoose.model('Match', matchSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image'], default: 'text' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// AUTHENTICATION ROUTES

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, age, interestedIn } = req.body;

    // Validation
    if (!email || !password || !name || !age || !interestedIn) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (age < 18) {
      return res.status(400).json({ error: 'Must be 18 or older' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      age,
      preferences: { interestedIn }
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      age: user.age,
      bio: user.bio,
      photos: user.photos,
      interests: user.interests,
      preferences: user.preferences,
      verified: user.verified
    };

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      age: user.age,
      bio: user.bio,
      photos: user.photos,
      interests: user.interests,
      preferences: user.preferences,
      verified: user.verified,
      isOnline: user.isOnline
    };

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date();
      await user.save();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error during logout' });
  }
});

// PROFILE ROUTES

// Get current user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// Update profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { name, age, bio, interests, preferences, location } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (age) updateData.age = age;
    if (bio) updateData.bio = bio;
    if (interests) updateData.interests = interests;
    if (preferences) updateData.preferences = { ...preferences };
    if (location && location.coordinates) {
      updateData.location = {
        type: 'Point',
        coordinates: location.coordinates
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// Upload photos
app.post('/api/profile/photos', authenticateToken, upload.array('photos', 6), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const photoUrls = req.files.map(file => `/uploads/${file.filename}`);
    user.photos = [...(user.photos || []), ...photoUrls];

    // Limit to 6 photos max
    if (user.photos.length > 6) {
      user.photos = user.photos.slice(-6);
    }

    await user.save();

    res.json({
      message: 'Photos uploaded successfully',
      photos: user.photos
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Server error uploading photos' });
  }
});

// MATCHING ROUTES

// Get potential matches
app.get('/api/matches/discover', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { preferences } = currentUser;
    
    // Get users that current user has already interacted with
    const existingMatches = await Match.find({
      $or: [
        { user1: req.user.userId },
        { user2: req.user.userId }
      ]
    }).select('user1 user2');

    const excludedUserIds = existingMatches.map(match => 
      match.user1.toString() === req.user.userId ? match.user2 : match.user1
    );
    excludedUserIds.push(req.user.userId); // Exclude self

    // Build match query
    const matchQuery = {
      _id: { $nin: excludedUserIds },
      age: { 
        $gte: preferences.minAge || 18, 
        $lte: preferences.maxAge || 50 
      }
    };

    // Add gender preference filter
    if (preferences.interestedIn === 'men') {
      matchQuery.gender = 'male';
    } else if (preferences.interestedIn === 'women') {
      matchQuery.gender = 'female';
    }

    let potentialMatches;

    // Location-based matching if coordinates are available
    if (currentUser.location && currentUser.location.coordinates && 
        currentUser.location.coordinates[0] !== 0 && currentUser.location.coordinates[1] !== 0) {
      
      potentialMatches = await User.aggregate([
        {
          $geoNear: {
            near: currentUser.location,
            distanceField: 'distance',
            maxDistance: (preferences.maxDistance || 50) * 1000, // Convert km to meters
            spherical: true,
            query: matchQuery
          }
        },
        { $limit: 10 },
        { $project: { password: 0 } }
      ]);
    } else {
      // Fallback to non-location based matching
      potentialMatches = await User.find(matchQuery)
        .select('-password')
        .limit(10)
        .lean();
    }

    res.json(potentialMatches);

  } catch (error) {
    console.error('Discover matches error:', error);
    res.status(500).json({ error: 'Server error discovering matches' });
  }
});

// Swipe on a user (like or pass)
app.post('/api/matches/swipe', authenticateToken, async (req, res) => {
  try {
    const { targetUserId, liked } = req.body;

    if (!targetUserId || liked === undefined) {
      return res.status(400).json({ error: 'Target user ID and liked status are required' });
    }

    if (targetUserId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot swipe on yourself' });
    }

    const currentUserId = req.user.userId;

    // Check if match already exists
    let match = await Match.findOne({
      $or: [
        { user1: currentUserId, user2: targetUserId },
        { user1: targetUserId, user2: currentUserId }
      ]
    });

    let isNewMatch = false;

    if (!match) {
      // Create new match record
      match = new Match({
        user1: currentUserId,
        user2: targetUserId,
        user1Liked: liked,
        user2Liked: false
      });
    } else {
      // Update existing match
      if (match.user1.toString() === currentUserId) {
        match.user1Liked = liked;
      } else {
        match.user2Liked = liked;
      }
    }

    // Check if both users liked each other
    if (match.user1Liked && match.user2Liked) {
      match.isMatch = true;
      isNewMatch = true;
    }

    await match.save();

    let response = { message: 'Swipe recorded successfully' };

    if (isNewMatch) {
      response.isMatch = true;
      response.message = "It's a match!";
      
      // Emit match event to both users if they're online
      io.to(`user_${match.user1}`).emit('newMatch', { matchId: match._id, userId: match.user2 });
      io.to(`user_${match.user2}`).emit('newMatch', { matchId: match._id, userId: match.user1 });
    }

    res.json(response);

  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({ error: 'Server error processing swipe' });
  }
});

// Get user's matches
app.get('/api/matches', authenticateToken, async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [
        { user1: req.user.userId },
        { user2: req.user.userId }
      ],
      isMatch: true
    }).populate('user1 user2', '-password').sort({ createdAt: -1 });

    // Format matches to show the other user's data
    const formattedMatches = matches.map(match => {
      const otherUser = match.user1._id.toString() === req.user.userId ? match.user2 : match.user1;
      return {
        matchId: match._id,
        user: otherUser,
        matchedAt: match.createdAt
      };
    });

    res.json(formattedMatches);

  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Server error fetching matches' });
  }
});

// CHAT/MESSAGING ROUTES

// Get messages for a match
app.get('/api/messages/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;

    // Verify user is part of this match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.user1.toString() !== req.user.userId && match.user2.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized access to this conversation' });
    }

    const messages = await Message.find({ matchId })
      .populate('senderId', 'name photos')
      .sort({ createdAt: 1 });

    // Mark messages as read for the current user
    await Message.updateMany(
      { matchId, receiverId: req.user.userId, isRead: false },
      { isRead: true }
    );

    res.json(messages);

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
});

// Send a message
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { matchId, message } = req.body;

    if (!matchId || !message) {
      return res.status(400).json({ error: 'Match ID and message are required' });
    }

    // Verify match exists and user is part of it
    const match = await Match.findById(matchId);
    if (!match || !match.isMatch) {
      return res.status(404).json({ error: 'Match not found or not valid' });
    }

    if (match.user1.toString() !== req.user.userId && match.user2.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized access to this conversation' });
    }

    // Determine receiver
    const receiverId = match.user1.toString() === req.user.userId ? match.user2 : match.user1;

    // Create message
    const newMessage = new Message({
      matchId,
      senderId: req.user.userId,
      receiverId,
      message,
      messageType: 'text'
    });

    await newMessage.save();

    // Populate sender info for real-time update
    await newMessage.populate('senderId', 'name photos');

    // Emit message to receiver via socket
    io.to(`user_${receiverId}`).emit('newMessage', newMessage);

    res.status(201).json(newMessage);

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error sending message' });
  }
});

// Get conversation list
app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [
        { user1: req.user.userId },
        { user2: req.user.userId }
      ],
      isMatch: true
    }).populate('user1 user2', '-password');

    // Get latest message for each conversation
    const conversations = await Promise.all(matches.map(async (match) => {
      const otherUser = match.user1._id.toString() === req.user.userId ? match.user2 : match.user1;
      
      const latestMessage = await Message.findOne({ matchId: match._id })
        .sort({ createdAt: -1 });

      const unreadCount = await Message.countDocuments({
        matchId: match._id,
        receiverId: req.user.userId,
        isRead: false
      });

      return {
        matchId: match._id,
        user: {
          id: otherUser._id,
          name: otherUser.name,
          photos: otherUser.photos,
          isOnline: otherUser.isOnline,
          lastSeen: otherUser.lastSeen
        },
        latestMessage: latestMessage ? {
          message: latestMessage.message,
          createdAt: latestMessage.createdAt,
          senderId: latestMessage.senderId
        } : null,
        unreadCount,
        matchedAt: match.createdAt
      };
    }));

    // Sort by latest message time
    conversations.sort((a, b) => {
      if (!a.latestMessage && !b.latestMessage) return new Date(b.matchedAt) - new Date(a.matchedAt);
      if (!a.latestMessage) return 1;
      if (!b.latestMessage) return -1;
      return new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt);
    });

    res.json(conversations);

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error fetching conversations' });
  }
});

// SOCKET.IO FOR REAL-TIME CHAT
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their room for receiving messages
  socket.on('joinUser', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join a specific chat room
  socket.on('joinMatch', (matchId) => {
    socket.join(`match_${matchId}`);
    console.log(`User joined match room: ${matchId}`);
  });

  // Handle real-time message sending
  socket.on('sendMessage', async (data) => {
    try {
      const { matchId, senderId, message } = data;
      
      // Verify and create message (similar to REST endpoint)
      const match = await Match.findById(matchId);
      if (!match || !match.isMatch) return;

      const receiverId = match.user1.toString() === senderId ? match.user2 : match.user1;

      const newMessage = new Message({
        matchId,
        senderId,
        receiverId,
        message,
        messageType: 'text'
      });

      await newMessage.save();
      await newMessage.populate('senderId', 'name photos');

      // Broadcast to match room
      io.to(`match_${matchId}`).emit('messageReceived', newMessage);
      
      // Send notification to receiver
      io.to(`user_${receiverId}`).emit('newMessage', newMessage);

    } catch (error) {
      console.error('Socket message error:', error);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(`match_${data.matchId}`).emit('userTyping', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large' });
    }
  }
  res.status(500).json({ error: error.message });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Dating app server running on port ${PORT}`);
});

module.exports = { app, server };
