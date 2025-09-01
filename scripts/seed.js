// scripts/seed.js - Fixed Enhanced seed script with ProfileBuilder fields
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Enhanced User Schema (copy from your server.js) - FIXED
const userSchema = new mongoose.Schema({
  // Authentication & Basic Info
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true, min: 25, max: 99 },
  bio: { type: String, maxlength: 500 },
  photos: [{ type: String }], // FIXED: Removed maxlength constraint for photo paths
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
  residence: { type: String, trim: true },
  relocate: { 
    type: String, 
    enum: ['Yes', 'No', 'Maybe'],
    default: 'Yes'
  },
  tribe: { type: String, trim: true },
  partnerTribe: { type: String, trim: true },
  
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
  denomination: { type: String, trim: true },
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
  
  // Location for matching
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  
  // Enhanced preferences
  preferences: {
    minAge: { type: Number, default: 25 },
    maxAge: { type: Number, default: 50 },
    maxDistance: { type: Number, default: 50 },
    interestedIn: { type: String, enum: ['men', 'women'], required: true },
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

userSchema.index({ location: '2dsphere' });
userSchema.index({
  name: 'text',
  bio: 'text',
  interests: 'text',
  nationality: 'text',
  residence: 'text'
});

const User = mongoose.model('User', userSchema);

// Match and Message schemas (unchanged)
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

// Enhanced sample data with complete ProfileBuilder fields - FIXED PHOTOS
const sampleUsers = [
  {
    // Authentication & Basic Info
    email: 'alice@example.com',
    password: 'password123',
    name: 'Alice Wanjiku',
    age: 28,
    bio: 'Faith-centered woman seeking meaningful connection. I believe in traditional values and building a family together.',
    photos: ['alice-1.jpg', 'alice-2.jpg'], // FIXED: Shortened photo names
    interests: ['reading', 'cooking', 'church activities', 'gardening'],
    
    // Personal Introduction
    gender: 'Woman',
    lookingFor: 'Man',
    
    // Identity & Location
    nationality: 'Kenyan',
    residence: 'Nairobi, Kenya',
    relocate: 'Maybe',
    tribe: 'Kikuyu',
    partnerTribe: 'Open to any tribe',
    
    // Education & Finances
    education: 'Bachelor\'s',
    income: '$2,000–$5,000',
    
    // Faith & Beliefs
    religion: 'Christian',
    denomination: 'Presbyterian',
    partnerReligion: 'Same as mine',
    politicalViews: 'Apolitical',
    
    // Lifestyle Habits
    smoking: 'No',
    marijuana: 'No',
    recreationalDrugs: 'No',
    alcohol: 'I don\'t drink',
    
    // Relationship History
    maritalStatus: 'Single',
    hasChildren: 'No',
    childrenCount: 0,
    dateSomeoneWith: ['No children', 'Young children'],
    wantChildren: 'Yes',
    
    // Courtship Preferences
    courtshipLength: '6–12 months',
    courtshipIntention: 'I believe in getting to know someone deeply before making a lifelong commitment. I want to ensure we share the same values and vision for our future together.',
    meetInPerson: 'Yes, I believe in in-person connection',
    
    // Character & Values
    coreValues: ['Family', 'Faith', 'Integrity', 'Honesty'],
    conflictResolution: 'I believe in open communication and addressing issues calmly. I prefer to discuss problems when we\'re both in a good headspace and work together to find solutions that honor both our perspectives. Prayer and seeking wisdom from trusted mentors also guide me.',
    pastRelationships: 'I\'ve learned the importance of clear communication and shared values. In past relationships, misaligned life goals caused challenges. I now prioritize discussing future plans early and ensuring we\'re building toward the same vision of family and faith.',
    selfDescription: 'I\'m a God-fearing woman who values family, integrity, and personal growth. I work as a teacher and find joy in nurturing others. I\'m ready for traditional courtship because I\'ve matured in my faith and understand what I want in a life partner.',
    
    // Location
    location: {
      type: 'Point',
      coordinates: [36.8219, -1.2921] // Nairobi
    },
    
    // Preferences
    preferences: {
      minAge: 28,
      maxAge: 40,
      maxDistance: 30,
      interestedIn: 'men',
      preferredEducation: ['Bachelor\'s', 'Master\'s', 'Doctorate'],
      preferredReligion: ['Christian'],
      dealBreakers: {
        smoking: true,
        recreationalDrugs: true,
        hasChildren: 'any'
      }
    },
    
    // Profile status
    profileCompleted: true,
    profileCompletionStep: 8,
    verified: true,
    isOnline: false
  },
  
  {
    // Authentication & Basic Info
    email: 'david@example.com',
    password: 'password123',
    name: 'David Ochieng',
    age: 32,
    bio: 'Committed Christian man seeking a godly woman to build a Christ-centered home together.',
    photos: ['david-1.jpg', 'david-2.jpg'],
    interests: ['bible study', 'football', 'business', 'community service'],
    
    // Personal Introduction
    gender: 'Man',
    lookingFor: 'Woman',
    
    // Identity & Location
    nationality: 'Kenyan',
    residence: 'Nairobi, Kenya',
    relocate: 'Yes',
    tribe: 'Luo',
    partnerTribe: 'Any tribe, character matters most',
    
    // Education & Finances
    education: 'Master\'s',
    income: '$5,000+',
    
    // Faith & Beliefs
    religion: 'Christian',
    denomination: 'Pentecostal',
    partnerReligion: 'Same as mine',
    politicalViews: 'Prefer not to say',
    
    // Lifestyle Habits
    smoking: 'No',
    marijuana: 'No',
    recreationalDrugs: 'No',
    alcohol: 'Rarely',
    
    // Relationship History
    maritalStatus: 'Single',
    hasChildren: 'No',
    childrenCount: 0,
    dateSomeoneWith: ['No children'],
    wantChildren: 'Yes',
    
    // Courtship Preferences
    courtshipLength: '3–6 months',
    courtshipIntention: 'I believe in purposeful dating that leads to marriage. I want to establish friendship first, then deeper commitment with clear intentions.',
    meetInPerson: 'Yes, I believe in in-person connection',
    
    // Character & Values
    coreValues: ['Faith', 'Family', 'Integrity', 'Service'],
    conflictResolution: 'I approach conflicts with prayer first, then calm discussion. I believe in listening to understand, not just to respond. I seek win-win solutions and am willing to compromise on non-essential matters while holding firm on core values.',
    pastRelationships: 'Previous relationships taught me the importance of spiritual compatibility and shared life vision. I\'ve learned to communicate my expectations clearly and to prioritize character over external qualities.',
    selfDescription: 'I\'m a business professional who puts God first in everything. I\'m financially stable and ready to provide for a family. I believe in traditional gender roles while respecting my partner\'s dreams and aspirations. Ready for marriage and building a legacy together.',
    
    // Location
    location: {
      type: 'Point',
      coordinates: [36.8219, -1.2921] // Nairobi
    },
    
    // Preferences
    preferences: {
      minAge: 25,
      maxAge: 32,
      maxDistance: 50,
      interestedIn: 'women',
      preferredEducation: ['Secondary', 'Vocational', 'Bachelor\'s', 'Master\'s'],
      preferredReligion: ['Christian'],
      dealBreakers: {
        smoking: true,
        recreationalDrugs: true,
        hasChildren: 'no children only'
      }
    },
    
    // Profile status
    profileCompleted: true,
    profileCompletionStep: 8,
    verified: true,
    isOnline: true
  },

  {
    // Authentication & Basic Info
    email: 'grace@example.com',
    password: 'password123',
    name: 'Grace Akinyi',
    age: 26,
    bio: 'Young woman with big dreams and strong faith. Looking for a man who will lead our family in love and wisdom.',
    photos: ['grace-1.jpg'],
    interests: ['worship music', 'fashion design', 'youth ministry', 'dancing'],
    
    // Personal Introduction
    gender: 'Woman',
    lookingFor: 'Man',
    
    // Identity & Location
    nationality: 'Kenyan',
    residence: 'Kisumu, Kenya',
    relocate: 'Yes',
    tribe: 'Luo',
    partnerTribe: 'Preferably Luo but open to others',
    
    // Education & Finances
    education: 'Vocational',
    income: '$500–$1,000',
    
    // Faith & Beliefs
    religion: 'Christian',
    denomination: 'Baptist',
    partnerReligion: 'Same as mine',
    politicalViews: 'Apolitical',
    
    // Lifestyle Habits
    smoking: 'No',
    marijuana: 'No',
    recreationalDrugs: 'No',
    alcohol: 'I don\'t drink',
    
    // Relationship History
    maritalStatus: 'Single',
    hasChildren: 'No',
    childrenCount: 0,
    dateSomeoneWith: ['No children', 'Not sure'],
    wantChildren: 'Yes',
    
    // Courtship Preferences
    courtshipLength: '3–6 months',
    courtshipIntention: 'I want to find my life partner through intentional courtship that honors God and leads to a blessed marriage.',
    meetInPerson: 'I\'m open to it, depending on trust and timing',
    
    // Character & Values
    coreValues: ['Faith', 'Family', 'Honesty', 'Loyalty'],
    conflictResolution: 'I believe in respectful communication and prayer. I prefer to cool down first if emotions are high, then discuss the issue with love and understanding. I\'m willing to apologize when wrong and forgive quickly.',
    pastRelationships: 'I\'ve had one serious relationship that ended due to different life goals. I learned the importance of discussing future plans early and ensuring we\'re equally committed to our faith journey.',
    selfDescription: 'I\'m a creative and faithful young woman who works as a fashion designer. I love serving in church and believe in supporting my husband\'s vision while pursuing my own calling. I\'m ready for marriage because I\'ve grown in maturity and know what I want in a godly man.',
    
    // Location
    location: {
      type: 'Point',
      coordinates: [34.7617, -0.0917] // Kisumu
    },
    
    // Preferences
    preferences: {
      minAge: 26,
      maxAge: 35,
      maxDistance: 100,
      interestedIn: 'men',
      preferredEducation: ['Secondary', 'Vocational', 'Bachelor\'s'],
      preferredReligion: ['Christian'],
      dealBreakers: {
        smoking: true,
        recreationalDrugs: true,
        hasChildren: 'children okay'
      }
    },
    
    // Profile status
    profileCompleted: true,
    profileCompletionStep: 8,
    verified: false,
    isOnline: true
  },

  {
    // Authentication & Basic Info
    email: 'samuel@example.com',
    password: 'password123',
    name: 'Samuel Kipchoge',
    age: 35,
    bio: 'Mature man seeking a God-fearing woman to start a family. I believe in providing and protecting those I love.',
    photos: ['samuel-1.jpg', 'samuel-2.jpg', 'samuel-3.jpg'],
    interests: ['farming', 'church leadership', 'athletics', 'mentoring youth'],
    
    // Personal Introduction
    gender: 'Man',
    lookingFor: 'Woman',
    
    // Identity & Location
    nationality: 'Kenyan',
    residence: 'Eldoret, Kenya',
    relocate: 'No',
    tribe: 'Kalenjin',
    partnerTribe: 'Preferably Kalenjin but open',
    
    // Education & Finances
    education: 'Secondary',
    income: '$2,000–$5,000',
    
    // Faith & Beliefs
    religion: 'Christian',
    denomination: 'Anglican',
    partnerReligion: 'Same as mine',
    politicalViews: 'Political',
    
    // Lifestyle Habits
    smoking: 'No',
    marijuana: 'No',
    recreationalDrugs: 'No',
    alcohol: 'Socially',
    
    // Relationship History
    maritalStatus: 'Divorced',
    hasChildren: 'Yes',
    childrenCount: 2,
    dateSomeoneWith: ['Young children', 'Grown children', 'No children'],
    wantChildren: 'Maybe',
    
    // Courtship Preferences
    courtshipLength: 'Over 1 year',
    courtshipIntention: 'Having been married before, I want to take time to really know someone. I want to ensure we\'re compatible in all ways before committing to marriage again.',
    meetInPerson: 'Yes, I believe in in-person connection',
    
    // Character & Values
    coreValues: ['Family', 'Integrity', 'Service', 'Honesty'],
    conflictResolution: 'Experience has taught me the value of patience and understanding. I listen first, seek to understand the root cause of issues, and work together to find lasting solutions. I believe in forgiveness and second chances.',
    pastRelationships: 'My previous marriage ended due to growing apart and communication breakdown. I\'ve learned the importance of continued investment in the relationship, regular communication, and shared spiritual growth. I\'m committed to doing better.',
    selfDescription: 'I\'m a mature man who has learned from life\'s experiences. I\'m a successful farmer and church elder, financially stable with two children whom I love dearly. I\'m looking for a partner who can accept my past and help build a blended family future.',
    
    // Location
    location: {
      type: 'Point',
      coordinates: [35.2699, 0.5143] // Eldoret
    },
    
    // Preferences
    preferences: {
      minAge: 28,
      maxAge: 40,
      maxDistance: 25,
      interestedIn: 'women',
      preferredEducation: ['Secondary', 'Vocational', 'Bachelor\'s'],
      preferredReligion: ['Christian'],
      dealBreakers: {
        smoking: false,
        recreationalDrugs: true,
        hasChildren: 'any'
      }
    },
    
    // Profile status
    profileCompleted: true,
    profileCompletionStep: 8,
    verified: true,
    isOnline: false
  },

  {
    // Authentication & Basic Info
    email: 'mary@example.com',
    password: 'password123',
    name: 'Mary Wambui',
    age: 30,
    bio: 'Professional woman balancing career and faith. Seeking a man who values both tradition and personal growth.',
    photos: ['mary-1.jpg'],
    interests: ['professional development', 'traveling', 'church choir', 'fitness'],
    
    // Personal Introduction
    gender: 'Woman',
    lookingFor: 'Man',
    
    // Identity & Location
    nationality: 'Kenyan',
    residence: 'Mombasa, Kenya',
    relocate: 'Maybe',
    tribe: 'Kikuyu',
    partnerTribe: 'Any tribe welcome',
    
    // Education & Finances
    education: 'Master\'s',
    income: '$5,000+',
    
    // Faith & Beliefs
    religion: 'Christian',
    denomination: 'Methodist',
    partnerReligion: 'Open to others',
    politicalViews: 'Political',
    
    // Lifestyle Habits
    smoking: 'No',
    marijuana: 'No',
    recreationalDrugs: 'No',
    alcohol: 'Socially',
    
    // Relationship History
    maritalStatus: 'Single',
    hasChildren: 'No',
    childrenCount: 0,
    dateSomeoneWith: ['No children', 'Grown children'],
    wantChildren: 'Maybe',
    
    // Courtship Preferences
    courtshipLength: '6–12 months',
    courtshipIntention: 'I want a partnership built on mutual respect and shared ambitions. I believe in supporting each other\'s dreams while building something beautiful together.',
    meetInPerson: 'Yes, I believe in in-person connection',
    
    // Character & Values
    coreValues: ['Ambition', 'Integrity', 'Family', 'Service'],
    conflictResolution: 'I believe in direct but respectful communication. I address issues promptly rather than letting them fester. I value compromise and finding solutions that work for both partners while maintaining individual identity.',
    pastRelationships: 'I\'ve learned that compatibility in life goals is crucial. Past relationships helped me understand the importance of balancing career ambitions with relationship investment. I now know how to prioritize without sacrificing personal growth.',
    selfDescription: 'I\'m an independent woman who has built a successful career in finance while maintaining strong faith values. I\'m looking for a partner who appreciates my ambition and can match my drive while we build a God-centered home together.',
    
    // Location
    location: {
      type: 'Point',
      coordinates: [39.6682, -4.0435] // Mombasa
    },
    
    // Preferences
    preferences: {
      minAge: 30,
      maxAge: 42,
      maxDistance: 75,
      interestedIn: 'men',
      preferredEducation: ['Bachelor\'s', 'Master\'s', 'Doctorate'],
      preferredReligion: ['Christian', 'Spiritual but not religious'],
      dealBreakers: {
        smoking: true,
        recreationalDrugs: true,
        hasChildren: 'any'
      }
    },
    
    // Profile status
    profileCompleted: true,
    profileCompletionStep: 8,
    verified: true,
    isOnline: true
  },

  {
    // Authentication & Basic Info
    email: 'peter@example.com',
    password: 'password123',
    name: 'Peter Macharia',
    age: 29,
    bio: 'Young professional building his future. Looking for a supportive partner to grow with in love and faith.',
    photos: ['peter-1.jpg', 'peter-2.jpg'],
    interests: ['technology', 'entrepreneurship', 'gospel music', 'community outreach'],
    
    // Personal Introduction
    gender: 'Man',
    lookingFor: 'Woman',
    
    // Identity & Location
    nationality: 'Kenyan',
    residence: 'Nakuru, Kenya',
    relocate: 'Yes',
    tribe: 'Kikuyu',
    partnerTribe: 'Character over culture',
    
    // Education & Finances
    education: 'Bachelor\'s',
    income: '$2,000–$5,000',
    
    // Faith & Beliefs
    religion: 'Christian',
    denomination: 'Pentecostal',
    partnerReligion: 'Same as mine',
    politicalViews: 'Apolitical',
    
    // Lifestyle Habits
    smoking: 'No',
    marijuana: 'No',
    recreationalDrugs: 'No',
    alcohol: 'I don\'t drink',
    
    // Relationship History
    maritalStatus: 'Single',
    hasChildren: 'No',
    childrenCount: 0,
    dateSomeoneWith: ['No children', 'Young children'],
    wantChildren: 'Yes',
    
    // Courtship Preferences
    courtshipLength: '3–6 months',
    courtshipIntention: 'I believe in building a strong foundation of friendship and trust before marriage. I want us to grow together spiritually and personally.',
    meetInPerson: 'Yes, I believe in in-person connection',
    
    // Character & Values
    coreValues: ['Faith', 'Ambition', 'Honesty', 'Family'],
    conflictResolution: 'I prefer open and honest communication. I believe in addressing issues quickly with love and understanding. Prayer and seeking counsel from mature believers guides my approach to resolving conflicts.',
    pastRelationships: 'I\'ve had a few relationships that taught me the importance of spiritual alignment and clear communication about future goals. I\'ve learned to be more intentional about expressing my feelings and expectations.',
    selfDescription: 'I\'m a young IT professional with entrepreneurial dreams. I\'m building my career while staying grounded in faith. I\'m looking for a partner who shares my vision for a Christ-centered family and isn\'t afraid to dream big with me.',
    
    // Location
    location: {
      type: 'Point',
      coordinates: [36.0667, -0.3031] // Nakuru
    },
    
    // Preferences
    preferences: {
      minAge: 25,
      maxAge: 32,
      maxDistance: 100,
      interestedIn: 'women',
      preferredEducation: ['Secondary', 'Vocational', 'Bachelor\'s'],
      preferredReligion: ['Christian'],
      dealBreakers: {
        smoking: true,
        recreationalDrugs: true,
        hasChildren: 'children okay'
      }
    },
    
    // Profile status
    profileCompleted: true,
    profileCompletionStep: 8,
    verified: false,
    isOnline: true
  }
];

async function seedDatabase() {
  try {
    console.log('🚀 Starting Enhanced Database Seeding...');
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dating_app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Match.deleteMany({});
    await Message.deleteMany({});

    // Hash passwords and create users
    console.log('👥 Creating enhanced user profiles...');
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
    console.log(`✅ Created ${savedUsers.length} complete user profiles`);

    // Create realistic matches based on preferences
    console.log('💕 Creating sample matches...');
    const sampleMatches = [
      {
        user1: savedUsers[1]._id, // David (Man)
        user2: savedUsers[0]._id, // Alice (Woman)
        user1Liked: true,
        user2Liked: true,
        isMatch: true
      },
      {
        user1: savedUsers[5]._id, // Peter (Man)
        user2: savedUsers[2]._id, // Grace (Woman)
        user1Liked: true,
        user2Liked: true,
        isMatch: true
      },
      {
        user1: savedUsers[3]._id, // Samuel (Man)
        user2: savedUsers[4]._id, // Mary (Woman)
        user1Liked: true,
        user2Liked: false,
        isMatch: false
      },
      {
        user1: savedUsers[1]._id, // David (Man)
        user2: savedUsers[2]._id, // Grace (Woman)
        user1Liked: false,
        user2Liked: true,
        isMatch: false
      },
      {
        user1: savedUsers[5]._id, // Peter (Man)
        user2: savedUsers[0]._id, // Alice (Woman)
        user1Liked: true,
        user2Liked: false,
        isMatch: false
      }
    ];

    const savedMatches = await Match.insertMany(sampleMatches);
    console.log(`✅ Created ${savedMatches.length} sample matches`);

    // Create realistic messages between matched users
    console.log('💬 Creating sample conversations...');
    const sampleMessages = [
      // Conversation between David and Alice (matched)
      {
        matchId: savedMatches[0]._id,
        senderId: savedUsers[1]._id, // David
        receiverId: savedUsers[0]._id, // Alice
        message: 'Hi Alice! I noticed we have similar faith backgrounds and values. I\'d love to get to know you better.',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000 * 2) // 2 days ago
      },
      {
        matchId: savedMatches[0]._id,
        senderId: savedUsers[0]._id, // Alice
        receiverId: savedUsers[1]._id, // David
        message: 'Hello David! Thank you for reaching out. I was impressed by your commitment to faith and family. Tell me about your work in business.',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000 * 2 + 3600000) // 2 days ago + 1 hour
      },
      {
        matchId: savedMatches[0]._id,
        senderId: savedUsers[1]._id, // David
        receiverId: savedUsers[0]._id, // Alice
        message: 'I run a small consultancy firm helping local businesses grow. It\'s rewarding to serve my community. What drew you to teaching?',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000 * 1) // 1 day ago
      },
      {
        matchId: savedMatches[0]._id,
        senderId: savedUsers[0]._id, // Alice
        receiverId: savedUsers[1]._id, // David
        message: 'I love nurturing young minds and seeing them grow. It aligns with my heart for family. Would you like to meet for coffee this weekend to continue our conversation?',
        isRead: false,
        createdAt: new Date(Date.now() - 43200000) // 12 hours ago
      },

      // Conversation between Peter and Grace (matched)
      {
        matchId: savedMatches[1]._id,
        senderId: savedUsers[5]._id, // Peter
        receiverId: savedUsers[2]._id, // Grace
        message: 'Hi Grace! I saw that you\'re into fashion design and worship music. I\'d love to hear about your creative journey.',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000 * 1) // 1 day ago
      },
      {
        matchId: savedMatches[1]._id,
        senderId: savedUsers[2]._id, // Grace
        receiverId: savedUsers[5]._id, // Peter
        message: 'Hello Peter! Fashion design is my passion - I love creating beautiful things. I noticed you\'re in tech and entrepreneurship. That\'s exciting!',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000 * 1 + 7200000) // 1 day ago + 2 hours
      },
      {
        matchId: savedMatches[1]._id,
        senderId: savedUsers[5]._id, // Peter
        receiverId: savedUsers[2]._id, // Grace
        message: 'Yes! I\'m building an app to help small businesses. Maybe we can collaborate someday - tech meets fashion! 😊',
        isRead: false,
        createdAt: new Date(Date.now() - 21600000) // 6 hours ago
      },

      // One-sided conversation (Samuel liked Mary, but no match yet)
      {
        matchId: savedMatches[2]._id,
        senderId: savedUsers[3]._id, // Samuel
        receiverId: savedUsers[4]._id, // Mary
        message: 'Hello Mary, I admire your professional achievements and faith journey. I\'d like to get to know you better if you\'re interested.',
        isRead: false,
        createdAt: new Date(Date.now() - 43200000) // 12 hours ago
      }
    ];

    const savedMessages = await Message.insertMany(sampleMessages);
    console.log(`✅ Created ${savedMessages.length} sample messages`);

    // Create uploads directory if it doesn't exist
    const fs = require('fs');
    const uploadsDir = './uploads';
    if (!fs.existsSync(uploadsDir)){
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('📁 Created uploads directory');
    }

    // Display summary
    console.log('\n🎉 === ENHANCED SEED DATA SUMMARY ===');
    console.log(`👥 Users created: ${savedUsers.length} (all with complete profiles)`);
    console.log(`💕 Matches created: ${savedMatches.length}`);
    console.log(`💬 Messages created: ${savedMessages.length}`);
    
    console.log('\n📊 === USER STATISTICS ===');
    console.log(`✅ Completed profiles: ${savedUsers.filter(u => u.profileCompleted).length}`);
    console.log(`🔐 Verified users: ${savedUsers.filter(u => u.verified).length}`);
    console.log(`🟢 Online users: ${savedUsers.filter(u => u.isOnline).length}`);

    console.log('\n🔐 === LOGIN CREDENTIALS ===');
    sampleUsers.forEach((user, index) => {
      const status = user.verified ? '✅' : '❌';
      const online = user.isOnline ? '🟢' : '🔴';
      console.log(`${status}${online} ${user.name}: ${user.email} / password123`);
      console.log(`   Age: ${user.age} | ${user.gender} looking for ${user.lookingFor}`);
      console.log(`   Location: ${user.residence} | Education: ${user.education}`);
      console.log(`   Religion: ${user.religion} | Income: ${user.income}`);
      console.log('   ---');
    });

    console.log('\n💕 === MATCH SUMMARY ===');
    console.log('✅ David ↔ Alice (Both liked - MATCHED!)');
    console.log('✅ Peter ↔ Grace (Both liked - MATCHED!)'); 
    console.log('❌ Samuel → Mary (Samuel liked, Mary hasn\'t responded)');
    console.log('❌ Grace → David (Grace liked, David hasn\'t responded)');
    console.log('❌ Peter → Alice (Peter liked, Alice hasn\'t responded)');

    console.log('\n🚀 === READY FOR TESTING ===');
    console.log('✅ Complete ProfileBuilder fields implemented');
    console.log('✅ Enhanced matching algorithm ready');
    console.log('✅ Realistic conversation data loaded');
    console.log('✅ All users have complete profiles for testing');
    console.log('✅ Fixed photo path lengths issue');
    
    console.log('\n📝 === TESTING SCENARIOS ===');
    console.log('1. Login as David to see matched conversation with Alice');
    console.log('2. Login as Alice to respond to David\'s messages');
    console.log('3. Login as Peter to continue chat with Grace');
    console.log('4. Login as Mary to see Samuel\'s message and decide to match');
    console.log('5. Test profile completion flow with new registrations');
    console.log('6. Test enhanced discovery with detailed preferences');

    console.log('\n⚙️ === API ENDPOINTS TO TEST ===');
    console.log('POST /api/auth/register - Enhanced registration');
    console.log('PUT /api/profile - Complete profile update');
    console.log('POST /api/profile/complete - ProfileBuilder completion');
    console.log('GET /api/profile/completion - Check completion status');
    console.log('GET /api/matches/discover - Enhanced matching with filters');
    console.log('POST /api/profile/photos - Photo upload (max 6)');

    console.log('\n🎯 === NEXT STEPS ===');
    console.log('1. Start your server: npm run dev');
    console.log('2. Test the enhanced API endpoints');
    console.log('3. Integrate with your updated ProfileBuilder component');
    console.log('4. Test matching algorithm with the realistic data');
    console.log('5. Implement photo upload functionality');

    console.log('\n⚠️ === IMPORTANT FIXES APPLIED ===');
    console.log('✅ Fixed photos array - removed maxlength constraint');
    console.log('✅ Shortened photo filenames to avoid path issues');
    console.log('✅ All validation errors should now be resolved');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`- ${key}: ${error.errors[key].message}`);
      });
    }
    
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    console.log('🏁 Seeding process completed');
    process.exit(0);
  }
}

// Helper function to generate random coordinates within Kenya
function getKenyanCoordinates(city) {
  const locations = {
    'Nairobi': [36.8219, -1.2921],
    'Mombasa': [39.6682, -4.0435],
    'Kisumu': [34.7617, -0.0917],
    'Nakuru': [36.0667, -0.3031],
    'Eldoret': [35.2699, 0.5143]
  };
  
  return locations[city] || [36.8219, -1.2921]; // Default to Nairobi
}

// Run the enhanced seed function
console.log('🌱 Enhanced Dating App Database Seeding Started...');
seedDatabase();