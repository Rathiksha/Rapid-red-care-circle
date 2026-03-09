// Test script for willingness API endpoint
const http = require('http');

const testData = {
  email: 'test@example.com',
  isWilling: true,
  passedEligibility: true
};

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/donors/willingness',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': JSON.stringify(testData).length
  }
};

console.log('🧪 Testing Willingness API Endpoint');
console.log('📍 URL:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('📦 Request Body:', JSON.stringify(testData, null, 2));
console.log('');

const req = http.request(options, (res) => {
  console.log('📡 Response Status:', res.statusCode, res.statusMessage);
  console.log('📄 Response Headers:', JSON.stringify(res.headers, null, 2));
  console.log('');

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📊 Response Body:');
    console.log(data);
    console.log('');

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(data);
      console.log('✅ Response is valid JSON');
      console.log('📋 Parsed:', JSON.stringify(parsed, null, 2));
    } catch (error) {
      console.log('❌ Response is NOT valid JSON');
      console.log('❌ Parse Error:', error.message);
      console.log('📄 Raw Response:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
  console.error('💡 Make sure the server is running on port 3000');
});

req.write(JSON.stringify(testData));
req.end();
