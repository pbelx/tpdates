// scripts/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models (you'll need to extract these into separate files or copy the schemas)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  bio: { type: String, maxlength: 500 },
  photos: [{ type: String }],
  interests: [{ type: String }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  preferences: {
    minAge: { type: Number, default: 18 },
    maxAge: { type: Number, default: 50 },
    maxDistance: { type: Number, default: 50 },
    interestedIn: { type: String, enum: ['men', 'women', 'both'], required: true }
  },
  verified: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ location: '2dsphere' });
const User = mongoose.model('User', userSchema);

// Sample data
const sampleUsers = [
  {
    email: 'alice@example.com',
    password: 'password123',
    name: 'Alice Johnson',
    age: 25,
    bio: 'Love hiking, photography, and good coffee. Looking for someone to explore the city with!',
    photos: ['/uploads/sample-photo-1.jpg'],
    interests: ['hiking', 'photography', 'coffee', 'travel'],
    location: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749] // San Francisco
    },
    preferences: {
      minAge: 22,
      maxAge: 35,
      maxDistance: 25,
      interestedIn: 'men'
    },
    verified: true
  },
  {
    email: 'bob@example.com',
    password: 'password123',
    name: 'Bob Smith',
    age: 28,
    bio: 'Software developer by day, musician by night. Always up for trying new restaurants.',
    photos: ['/uploads/sample-photo-2.jpg'],
    interests: ['music', 'coding', 'food', 'concerts'],
    location: {
      type: 'Point',
      coordinates: [-122.4094, 37.7849] // San Francisco (nearby)
    },
    preferences: {
      minAge: 20,
      maxAge: 32,
      maxDistance: 30,
      interestedIn: 'women'
    },
    verified: true
  },
  {
    email: 'carol@example.com',
    password: 'password123',
    name: 'Carol Davis',
    age: 30,
    bio: 'Yoga instructor and nature enthusiast. Seeking mindful connections.',
    photos: ['/uploads/sample-photo-3.jpg'],
    interests: ['yoga', 'meditation', 'nature', 'wellness'],
    location: {
      type: 'Point',
      coordinates: [-122.4294, 37.7649] // San Francisco (different area)
    },
    preferences: {
      minAge: 25,
      maxAge: 40,
      maxDistance: 20,
      interestedIn: 'both'
    },
    verified: false
  },
  {
    email: 'david@example.com',
    password: 'password123',
    name: 'David Wilson',
    age: 32,
    bio: 'Chef and foodie. Love creating new dishes and exploring local markets.',
    photos: ['/uploads/sample-photo-4.jpg'],
    interests: ['cooking', 'food', 'wine', 'markets'],
    location: {
      type: 'Point',
      coordinates: [-122.3994, 37.7949] // San Francisco (another area)
    },
    preferences: {
      minAge: 24,
      maxAge: 38,
      maxDistance: 35,
      interestedIn: 'women'
    },
    verified: true
  },
  {
    email: 'emma@example.com',
    password: 'password123',
    name: 'Emma Brown',
    age: 26,
    bio: 'Artist and book lover. Spend my weekends at galleries and bookshops.',
    photos: ['/uploads/sample-photo-5.jpg'],
    interests: ['art', 'books', 'galleries', 'literature'],
    location: {
      type: 'Point',
      coordinates: [-122.4394, 37.7549] // San Francisco (yet another area)
    },
    preferences: {
      minAge: 23,
      maxAge: 35,
      maxDistance: 40,
      interestedIn: 'men'
    },
    verified: true
  },
  {
    email: 'frank@example.com',
    password: 'password123',
    name: 'Frank Miller',
    age: 29,
    bio: 'Outdoor enthusiast and rock climber. Always planning the next adventure.',
    photos: ['/uploads/sample-photo-6.jpg'],
    interests: ['climbing', 'hiking', 'adventure', 'outdoors'],
    location: {
      type: 'Point',
      coordinates: [-122.4494, 37.7449] // San Francisco (different location)
    },
    preferences: {
      minAge: 21,
      maxAge: 34,
      maxDistance: 45,
      interestedIn: 'both'
    },
    verified: false
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dating_app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing users...');
    await User.deleteMany({});

    // Hash passwords and create users
    console.log('Creating sample users...');
    const users = await Promise.all(
      sampleUsers.map(async (userData) => {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        return new User({
          ...userData,
          password: hashedPassword
        });
      })
    );

    // Save all users
    const savedUsers = await User.insertMany(users);
    console.log(`Created ${savedUsers.length} sample users`);

    // Create some sample matches (optional)
    const Match = mongoose.model('Match', new mongoose.Schema({
      user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      user1Liked: { type: Boolean, default: false },
      user2Liked: { type: Boolean, default: false },
      isMatch: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }));

    // Create some mutual matches for testing
    const sampleMatches = [
      {
        user1: savedUsers[0]._id, // Alice
        user2: savedUsers[1]._id, // Bob
        user1Liked: true,
        user2Liked: true,
        isMatch: true
      },
      {
        user1: savedUsers[2]._id, // Carol
        user2: savedUsers[5]._id, // Frank
        user1Liked: true,
        user2Liked: true,
        isMatch: true
      },
      {
        user1: savedUsers[3]._id, // David
        user2: savedUsers[4]._id, // Emma
        user1Liked: true,
        user2Liked: false,
        isMatch: false
      }
    ];

    await Match.deleteMany({});
    const savedMatches = await Match.insertMany(sampleMatches);
    console.log(`Created ${savedMatches.length} sample matches`);

    // Create some sample messages
    const Message = mongoose.model('Message', new mongoose.Schema({
      matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      message: { type: String, required: true },
      messageType: { type: String, enum: ['text', 'image'], default: 'text' },
      isRead: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }));

    const sampleMessages = [
      {
        matchId: savedMatches[0]._id,
        senderId: savedUsers[0]._id, // Alice
        receiverId: savedUsers[1]._id, // Bob
        message: 'Hi! I loved your profile. We have so much in common!',
        isRead: true
      },
      {
        matchId: savedMatches[0]._id,
        senderId: savedUsers[1]._id, // Bob
        receiverId: savedUsers[0]._id, // Alice
        message: 'Thank you! I noticed you love photography too. Have any favorite spots in the city?',
        isRead: true
      },
      {
        matchId: savedMatches[0]._id,
        senderId: savedUsers[0]._id, // Alice
        receiverId: savedUsers[1]._id, // Bob
        message: 'Yes! The Golden Gate Bridge area has amazing spots, especially during sunset.',
        isRead: false
      },
      {
        matchId: savedMatches[1]._id,
        senderId: savedUsers[2]._id, // Carol
        receiverId: savedUsers[5]._id, // Frank
        message: 'Hey Frank! I see you love outdoor adventures. I do yoga outdoors sometimes.',
        isRead: false
      }
    ];

    await Message.deleteMany({});
    const savedMessages = await Message.insertMany(sampleMessages);
    console.log(`Created ${savedMessages.length} sample messages`);

    console.log('\n=== SEED DATA SUMMARY ===');
    console.log(`Users created: ${savedUsers.length}`);
    console.log(`Matches created: ${savedMatches.length}`);
    console.log(`Messages created: ${savedMessages.length}`);
    
    console.log('\n=== SAMPLE LOGIN CREDENTIALS ===');
    sampleUsers.forEach((user, index) => {
      console.log(`${user.name}: ${user.email} / password123`);
    });

    console.log('\n=== READY FOR TESTING ===');
    console.log('You can now start the server and test the API endpoints');
    console.log('Use the email/password combinations above to login');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();
