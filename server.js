// server.js - Updated User Schema with ProfileBuilder fields
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

// Enhanced User Schema with ProfileBuilder fields
const userSchema = new mongoose.Schema({
  // Authentication & Basic Info
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true, min: 25, max: 99 },
  bio: { type: String, maxlength: 500 },
  photos: [{ type: String, maxlength: 6 }], // Array of photo URLs, max 6
  interests: [{ type: String }],
  
  // Step 1: Personal Introduction
  gender: { 
    type: String, 
    enum: ['Man', 'Woman'], 
    required: true,
    default: 'Man'
  },
  lookingFor: { 
    type: String, 
    enum: ['Woman', 'Man'], 
    required: true,
    default: 'Woman'
  },
  
  // Step 2: Identity & Location
  nationality: { type: String, trim: true },
  residence: { type: String, trim: true }, // City & Country
  relocate: { 
    type: String, 
    enum: ['Yes', 'No', 'Maybe'],
    default: 'Yes'
  },
  tribe: { type: String, trim: true }, // Tribe or ethnic background
  partnerTribe: { type: String, trim: true }, // Preferred partner's tribe/culture
  
  // Step 3: Education & Finances
  education: {
    type: String,
    enum: ['Secondary', 'Vocational', 'Bachelor\'s', 'Master\'s', 'Doctorate', 'Other'],
    default: 'Secondary'
  },
  income: {
    type: String,
    enum: ['Less than $500', '$500–$1,000', '$2,000–$5,000', '$5,000+', 'Prefer not to say'],
    default: 'Less than $500'
  },
  
  // Step 4: Faith & Beliefs
  religion: {
    type: String,
    enum: ['Christian', 'Muslim', 'Traditionalist', 'Spiritual but not religious', 'None'],
    default: 'Christian'
  },
  denomination: { type: String, trim: true }, // If applicable
  partnerReligion: {
    type: String,
    enum: ['Same as mine', 'Open to others', 'No preference'],
    default: 'Same as mine'
  },
  politicalViews: {
    type: String,
    enum: ['Apolitical', 'Political', 'Prefer not to say'],
    default: 'Apolitical'
  },
  
  // Step 5: Lifestyle Habits
  smoking: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  marijuana: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  recreationalDrugs: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  alcohol: {
    type: String,
    enum: ['Rarely', 'Socially', 'Frequently', 'I don\'t drink'],
    default: 'I don\'t drink'
  },
  
  // Step 6: Relationship History & Intentions
  maritalStatus: {
    type: String,
    enum: ['Single', 'Divorced', 'Widowed', 'Legally Separated'],
    default: 'Single'
  },
  hasChildren: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  childrenCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 20
  },
  dateSomeoneWith: [{
    type: String,
    enum: ['Young children', 'Grown children', 'No children', 'Not sure']
  }],
  wantChildren: {
    type: String,
    enum: ['Yes', 'No', 'Maybe'],
    default: 'Yes'
  },
  
  // Step 7: Courtship Preferences
  courtshipLength: {
    type: String,
    enum: ['Less than 3 months', '3–6 months', '6–12 months', 'Over 1 year'],
    default: '3–6 months'
  },
  courtshipIntention: {
    type: String,
    maxlength: 200,
    trim: true
  },
  meetInPerson: {
    type: String,
    enum: [
      'Yes, I believe in in-person connection',
      'I\'m open to it, depending on trust and timing',
      'No I prefer to take my time'
    ],
    default: 'Yes, I believe in in-person connection'
  },
  
  // Step 8: Character & Values
  coreValues: [{
    type: String,
    enum: ['Family', 'Integrity', 'Ambition', 'Faith', 'Honesty', 'Loyalty', 'Service']
  }],
  conflictResolution: {
    type: String,
    minlength: 100,
    maxlength: 1000,
    trim: true
  },
  pastRelationships: {
    type: String,
    minlength: 100,
    maxlength: 1000,
    trim: true
  },
  selfDescription: {
    type: String,
    minlength: 100,
    maxlength: 1000,
    trim: true
  },
  
  // Location for matching (existing)
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  
  // Enhanced preferences
  preferences: {
    minAge: { type: Number, default: 25 },
    maxAge: { type: Number, default: 50 },
    maxDistance: { type: Number, default: 50 }, // in kilometers
    interestedIn: { type: String, enum: ['men', 'women'], required: true },
    
    // Additional preference filters based on profile fields
    preferredEducation: [{
      type: String,
      enum: ['Secondary', 'Vocational', 'Bachelor\'s', 'Master\'s', 'Doctorate', 'Other']
    }],
    preferredReligion: [{
      type: String,
      enum: ['Christian', 'Muslim', 'Traditionalist', 'Spiritual but not religious', 'None']
    }],
    dealBreakers: {
      smoking: { type: Boolean, default: false },
      recreationalDrugs: { type: Boolean, default: false },
      hasChildren: { type: String, enum: ['any', 'no children only', 'children okay'], default: 'any' }
    }
  },
  
  // Profile completion tracking
  profileCompleted: { type: Boolean, default: false },
  profileCompletionStep: { type: Number, default: 0, min: 0, max: 8 },
  
  // Account status
  verified: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to update timestamps and profile completion
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Check if profile is completed (basic check - you can enhance this)
  if (this.selfDescription && this.conflictResolution && this.pastRelationships && 
      this.photos && this.photos.length > 0) {
    this.profileCompleted = true;
    this.profileCompletionStep = 8;
  }
  
  next();
});

// Create geospatial index for location-based queries
userSchema.index({ location: '2dsphere' });

// Create text index for search functionality
userSchema.index({
  name: 'text',
  bio: 'text',
  interests: 'text',
  nationality: 'text',
  residence: 'text'
});

const User = mongoose.model('User', userSchema);

// Rest of your existing schemas (Match, Message) remain the same...
const matchSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user1Liked: { type: Boolean, default: false },
  user2Liked: { type: Boolean, default: false },
  isMatch: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

matchSchema.index({ user1: 1, user2: 1 }, { unique: true });
const Match = mongoose.model('Match', matchSchema);

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

// Middleware for JWT authentication (unchanged)
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

// File upload configuration (unchanged)
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

// ENHANCED AUTHENTICATION ROUTES

// Register - Updated to handle minimal initial registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, age, gender, lookingFor } = req.body;

    // Basic validation
    if (!email || !password || !name || !age || !gender || !lookingFor) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (age < 25) {
      return res.status(400).json({ error: 'Must be 25 or older' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with minimal profile
    const user = new User({
      email,
      password: hashedPassword,
      name,
      age,
      gender,
      lookingFor,
      preferences: { 
        interestedIn: lookingFor === 'Woman' ? 'women' : 'men',
        minAge: Math.max(25, age - 10),
        maxAge: age + 10
      },
      profileCompletionStep: 1
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
      gender: user.gender,
      lookingFor: user.lookingFor,
      profileCompleted: user.profileCompleted,
      profileCompletionStep: user.profileCompletionStep,
      verified: user.verified
    };

    res.status(201).json({
      message: 'User registered successfully. Please complete your profile.',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login (unchanged)
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
    const userResponse = user.toObject();
    delete userResponse.password;

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

// ENHANCED PROFILE ROUTES

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

// Update profile - Enhanced to handle all ProfileBuilder fields
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'age', 'bio', 'interests', 'nationality', 'residence', 'relocate',
      'tribe', 'partnerTribe', 'education', 'income', 'religion', 'denomination',
      'partnerReligion', 'politicalViews', 'smoking', 'marijuana', 'recreationalDrugs',
      'alcohol', 'maritalStatus', 'hasChildren', 'childrenCount', 'dateSomeoneWith',
      'wantChildren', 'courtshipLength', 'courtshipIntention', 'meetInPerson',
      'coreValues', 'conflictResolution', 'pastRelationships', 'selfDescription',
      'preferences'
    ];

    const updateData = {};
    
    // Filter and validate updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    // Handle location update separately if provided
    if (req.body.location && req.body.location.coordinates) {
      updateData.location = {
        type: 'Point',
        coordinates: req.body.location.coordinates
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true // This ensures schema validation runs
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation error', details: errors });
    }
    
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// Complete profile build - Special endpoint for ProfileBuilder
app.post('/api/profile/complete', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user with all profile data
    Object.keys(req.body).forEach(key => {
      if (key !== 'password' && key !== 'email') {
        user[key] = req.body[key];
      }
    });

    // Mark profile as completed
    user.profileCompleted = true;
    user.profileCompletionStep = 8;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Profile completed successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Profile completion error:', error);
    res.status(500).json({ error: 'Server error completing profile' });
  }
});

// Get profile completion status
app.get('/api/profile/completion', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('profileCompleted profileCompletionStep');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      profileCompleted: user.profileCompleted,
      profileCompletionStep: user.profileCompletionStep
    });

  } catch (error) {
    console.error('Profile completion check error:', error);
    res.status(500).json({ error: 'Server error checking profile completion' });
  }
});

// Upload photos (enhanced to handle max 6 photos)
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

// Delete photo
app.delete('/api/profile/photos/:index', authenticateToken, async (req, res) => {
  try {
    const { index } = req.params;
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.photos || index < 0 || index >= user.photos.length) {
      return res.status(400).json({ error: 'Invalid photo index' });
    }

    // Remove photo at index
    user.photos.splice(index, 1);
    await user.save();

    res.json({
      message: 'Photo deleted successfully',
      photos: user.photos
    });

  } catch (error) {
    console.error('Photo deletion error:', error);
    res.status(500).json({ error: 'Server error deleting photo' });
  }
});

// ENHANCED MATCHING ROUTES

// Get potential matches with enhanced filtering
app.get('/api/matches/discover', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only show matches if profile is completed
    if (!currentUser.profileCompleted) {
      return res.status(400).json({ 
        error: 'Please complete your profile first',
        profileCompletionStep: currentUser.profileCompletionStep 
      });
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
      match.user1.toString() === req.user.userId ? match.user2.toString() : match.user1.toString()
    );
    excludedUserIds.push(req.user.userId); // Exclude self

    // Build match criteria based on enhanced preferences
    const matchCriteria = {
      _id: { $nin: excludedUserIds },
      profileCompleted: true, // Only show completed profiles
      age: { 
        $gte: preferences.minAge || 25, 
        $lte: preferences.maxAge || 50 
      },
      gender: currentUser.lookingFor,
      lookingFor: currentUser.gender
    };

    // Add religion filter if specified
    if (currentUser.partnerReligion === 'Same as mine' && currentUser.religion) {
      matchCriteria.religion = currentUser.religion;
    }

    // Add deal-breaker filters
    if (preferences.dealBreakers) {
      if (preferences.dealBreakers.smoking) {
        matchCriteria.smoking = 'No';
      }
      if (preferences.dealBreakers.recreationalDrugs) {
        matchCriteria.recreationalDrugs = 'No';
      }
      if (preferences.dealBreakers.hasChildren === 'no children only') {
        matchCriteria.hasChildren = 'No';
      }
    }

    // Find potential matches
    let potentialMatches = await User.find(matchCriteria)
      .select('-password')
      .limit(10); // Limit to 10 matches at a time

    // Add location-based sorting if coordinates are available
    if (currentUser.location && currentUser.location.coordinates[0] !== 0) {
      potentialMatches = await User.aggregate([
        { $match: matchCriteria },
        {
          $geoNear: {
            near: currentUser.location,
            distanceField: 'distance',
            maxDistance: (preferences.maxDistance || 50) * 1000, // Convert km to meters
            spherical: true
          }
        },
        { $limit: 10 },
        { $project: { password: 0 } }
      ]);
    }

    res.json({
      matches: potentialMatches,
      hasMore: potentialMatches.length === 10
    });

  } catch (error) {
    console.error('Match discovery error:', error);
    res.status(500).json({ error: 'Server error discovering matches' });
  }
});

// Rest of your existing routes (like, matches, messages, etc.) remain the same...

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Dating app backend is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
