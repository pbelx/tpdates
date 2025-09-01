// test-api.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test credentials from seed data
const testUsers = [
  { email: 'alice@example.com', password: 'password123', name: 'Alice' },
  { email: 'bob@example.com', password: 'password123', name: 'Bob' }
];

let tokens = {};
let userIds = {};
let matchId = null;

async function testAPI() {
  console.log('🚀 Starting API Tests\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log();

    // Test 2: User Registration (skip if using seed data)
    console.log('2. Testing User Login (using seed data)...');
    
    for (const user of testUsers) {
      try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: user.email,
          password: user.password
        });
        
        tokens[user.name] = loginResponse.data.token;
        userIds[user.name] = loginResponse.data.user.id;
        
        console.log(`✅ ${user.name} logged in successfully`);
        console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
      } catch (error) {
        console.log(`❌ Login failed for ${user.name}:`, error.response?.data?.error || error.message);
      }
    }
    console.log();

    // Test 3: Get Profile
    console.log('3. Testing Profile Retrieval...');
    for (const userName of Object.keys(tokens)) {
      try {
        const profileResponse = await axios.get(`${BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${tokens[userName]}` }
        });
        
        console.log(`✅ ${userName}'s profile retrieved`);
        console.log(`   Name: ${profileResponse.data.name}`);
        console.log(`   Bio: ${profileResponse.data.bio || 'No bio'}`);
        console.log(`   Interests: ${profileResponse.data.interests?.join(', ') || 'None'}`);
      } catch (error) {
        console.log(`❌ Profile retrieval failed for ${userName}:`, error.response?.data?.error || error.message);
      }
    }
    console.log();

    // Test 4: Update Profile
    console.log('4. Testing Profile Update...');
    try {
      const updateResponse = await axios.put(`${BASE_URL}/api/profile`, {
        bio: 'Updated bio from API test',
        interests: ['testing', 'api', 'development']
      }, {
        headers: { Authorization: `Bearer ${tokens.Alice}` }
      });
      
      console.log('✅ Profile updated successfully');
      console.log('   Updated bio:', updateResponse.data.user.bio);
    } catch (error) {
      console.log('❌ Profile update failed:', error.response?.data?.error || error.message);
    }
    console.log();

    // Test 5: Discover Matches
    console.log('5. Testing Match Discovery...');
    try {
      const matchesResponse = await axios.get(`${BASE_URL}/api/matches/discover`, {
        headers: { Authorization: `Bearer ${tokens.Alice}` }
      });
      
      console.log(`✅ Discovered ${matchesResponse.data.length} potential matches`);
      if (matchesResponse.data.length > 0) {
        console.log('   First match:', matchesResponse.data[0].name);
      }
    } catch (error) {
      console.log('❌ Match discovery failed:', error.response?.data?.error || error.message);
    }
    console.log();

    // Test 6: Swipe (Like a user)
    console.log('6. Testing Swipe Functionality...');
    if (userIds.Bob && tokens.Alice) {
      try {
        const swipeResponse = await axios.post(`${BASE_URL}/api/matches/swipe`, {
          targetUserId: userIds.Bob,
          liked: true
        }, {
          headers: { Authorization: `Bearer ${tokens.Alice}` }
        });
        
        console.log('✅ Swipe recorded:', swipeResponse.data.message);
        if (swipeResponse.data.isMatch) {
          console.log('🎉 It\'s a match!');
        }
      } catch (error) {
        console.log('❌ Swipe failed:', error.response?.data?.error || error.message);
      }
    }
    console.log();

    // Test 7: Get Matches
    console.log('7. Testing Get Matches...');
    try {
      const userMatchesResponse = await axios.get(`${BASE_URL}/api/matches`, {
        headers: { Authorization: `Bearer ${tokens.Alice}` }
      });
      
      console.log(`✅ Retrieved ${userMatchesResponse.data.length} matches`);
      if (userMatchesResponse.data.length > 0) {
        matchId = userMatchesResponse.data[0].matchId;
        console.log('   First match ID:', matchId);
        console.log('   Match user:', userMatchesResponse.data[0].user.name);
      }
    } catch (error) {
      console.log('❌ Get matches failed:', error.response?.data?.error || error.message);
    }
    console.log();

    // Test 8: Get Conversations
    console.log('8. Testing Get Conversations...');
    try {
      const conversationsResponse = await axios.get(`${BASE_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${tokens.Alice}` }
      });
      
      console.log(`✅ Retrieved ${conversationsResponse.data.length} conversations`);
      if (conversationsResponse.data.length > 0) {
        const conv = conversationsResponse.data[0];
        console.log(`   Conversation with: ${conv.user.name}`);
        console.log(`   Unread messages: ${conv.unreadCount}`);
        if (conv.latestMessage) {
          console.log(`   Latest message: "${conv.latestMessage.message}"`);
        }
      }
    } catch (error) {
      console.log('❌ Get conversations failed:', error.response?.data?.error || error.message);
    }
    console.log();

    // Test 9: Send Message
    if (matchId && tokens.Alice) {
      console.log('9. Testing Send Message...');
      try {
        const messageResponse = await axios.post(`${BASE_URL}/api/messages`, {
          matchId: matchId,
          message: 'Hello! This is a test message from the API test script.'
        }, {
          headers: { Authorization: `Bearer ${tokens.Alice}` }
        });
        
        console.log('✅ Message sent successfully');
        console.log('   Message ID:', messageResponse.data._id);
        console.log('   Message:', messageResponse.data.message);
      } catch (error) {
        console.log('❌ Send message failed:', error.response?.data?.error || error.message);
      }
      console.log();

      // Test 10: Get Messages
      console.log('10. Testing Get Messages...');
      try {
        const messagesResponse = await axios.get(`${BASE_URL}/api/messages/${matchId}`, {
          headers: { Authorization: `Bearer ${tokens.Alice}` }
        });
        
        console.log(`✅ Retrieved ${messagesResponse.data.length} messages`);
        if (messagesResponse.data.length > 0) {
          const lastMessage = messagesResponse.data[messagesResponse.data.length - 1];
          console.log('   Last message:', lastMessage.message);
          console.log('   From:', lastMessage.senderId.name);
        }
      } catch (error) {
        console.log('❌ Get messages failed:', error.response?.data?.error || error.message);
      }
    }

    console.log('\n🎉 API Tests Completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI().then(() => {
    console.log('\nTest script finished. You can now test the API manually or integrate with a frontend.');
    process.exit(0);
  }).catch((error) => {
    console.error('Test script error:', error);
    process.exit(1);
  });
}

module.exports = { testAPI };
