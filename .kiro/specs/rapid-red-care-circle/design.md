# Design Document: Rapid Red Care Circle

## Introduction

This document provides the technical design for the Rapid Red Care Circle blood donation coordination platform. The system uses a Node.js/Express backend with PostgreSQL/PostGIS for spatial queries, Socket.io for real-time communication, and integrates with external services for traffic data and push notifications.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mobile/Web Client                            │
│              (React/React Native Frontend)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway / Load Balancer                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
    ┌───────────────────────┐   ┌───────────────────────┐
    │   Express REST API    │   │   Socket.io Server    │
    │   (HTTP Endpoints)    │   │   (WebSocket)         │
    └───────────────────────┘   └───────────────────────┘
                │                           │
                └───────────┬───────────────┘
                            ▼
            ┌───────────────────────────────┐
            │     Business Logic Layer      │
            │  (Services & Algorithms)      │
            └───────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│  PostgreSQL  │  │  Redis Cache     │  │  External    │
│  + PostGIS   │  │  + Bull Queue    │  │  APIs        │
└──────────────┘  └──────────────────┘  └──────────────┘
```

### Technology Stack

- **Backend Framework**: Node.js with Express.js
- **Database**: PostgreSQL 14+ with PostGIS extension
- **Caching & Queue**: Redis with Bull queue
- **Real-time Communication**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)
- **ORM**: Sequelize
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Traffic Data**: Google Maps Distance Matrix API
- **SMS/OTP**: Twilio API




## Data Models

### User Model

```javascript
{
  id: Integer (Primary Key),
  fullName: String (Required),
  age: Integer (18-60, Required),
  gender: Enum('Male', 'Female', 'Other'),
  mobileNumber: String (Unique, Required),
  mobileVerified: Boolean (Default: false),
  city: String (Required),
  bloodGroup: Enum('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  medicalHistory: JSONB {
    hasDiabetes: Boolean,
    hasSeizures: Boolean,
    otherConditions: String
  },
  password: String (Hashed with bcrypt),
  notificationPreferences: JSONB {
    enabled: Boolean,
    quietHoursStart: Time,
    quietHoursEnd: Time
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Donor Model

```javascript
{
  id: Integer (Primary Key),
  userId: Integer (Foreign Key → User.id),
  lastDonationDate: Date (Nullable),
  location: Geography(Point, 4326), // PostGIS type
  isActive: Boolean (Default: true),
  eligibilityScore: Float (0-100),
  reliabilityScore: Float (0-100, Default: 50),
  fcmToken: String (For push notifications),
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### BloodRequest Model

```javascript
{
  id: Integer (Primary Key),
  requesterId: Integer (Foreign Key → User.id),
  bloodGroup: Enum('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  urgencyBand: Enum('RED', 'PINK', 'WHITE'),
  location: Geography(Point, 4326),
  locationName: String,
  requiredBy: Timestamp,
  status: Enum('PENDING', 'DONOR_ACCEPTED', 'COMPLETED', 'CANCELLED', 'EXPIRED'),
  acceptedDonorId: Integer (Foreign Key → Donor.id, Nullable),
  isPrivateRequest: Boolean (Default: false),
  notes: Text,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```




### DonorNotification Model

```javascript
{
  id: Integer (Primary Key),
  requestId: Integer (Foreign Key → BloodRequest.id),
  donorId: Integer (Foreign Key → Donor.id),
  status: Enum('SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'IGNORED'),
  viewedAt: Timestamp (Nullable),
  respondedAt: Timestamp (Nullable),
  response: Enum('ACCEPT', 'DECLINE', 'FUTURE_COMMITMENT', Nullable),
  donatingFor: Enum('SELF', 'FAMILY', 'FRIEND', Nullable),
  timeoutExpiresAt: Timestamp (Nullable),
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### DonationHistory Model

```javascript
{
  id: Integer (Primary Key),
  requestId: Integer (Foreign Key → BloodRequest.id),
  donorId: Integer (Foreign Key → Donor.id),
  requesterId: Integer (Foreign Key → User.id),
  donatedAt: Timestamp,
  donatingFor: Enum('SELF', 'FAMILY', 'FRIEND'),
  status: Enum('COMPLETED', 'CANCELLED'),
  cancellationReason: Text (Nullable),
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### HospitalBloodBank Model

```javascript
{
  id: Integer (Primary Key),
  name: String (Required),
  location: Geography(Point, 4326),
  address: String,
  city: String,
  contactNumber: String,
  bloodAvailability: JSONB {
    'A+': Boolean,
    'A-': Boolean,
    'B+': Boolean,
    'B-': Boolean,
    'AB+': Boolean,
    'AB-': Boolean,
    'O+': Boolean,
    'O-': Boolean
  },
  lastUpdated: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```




## Core Business Logic Services

### 1. ColorBandService

**Purpose**: Assigns urgency bands (RED/PINK/WHITE) to blood requests based on required timeframe.

**Algorithm**:
```javascript
function assignColorBand(requiredBy) {
  const now = new Date();
  const hoursUntilRequired = (requiredBy - now) / (1000 * 60 * 60);
  
  if (hoursUntilRequired <= 0) {
    return { band: 'RED', isEmergency: true };
  } else if (hoursUntilRequired <= 24) {
    return { band: 'PINK', isEmergency: false };
  } else {
    return { band: 'WHITE', isEmergency: false };
  }
}
```

**Color Band Meanings**:
- **RED**: Immediate requirement (0 hours) - Emergency with timeout logic
- **PINK**: Within 24 hours - Urgent but no timeout
- **WHITE**: After 24 hours - Planned donation

### 2. EligibilityService

**Purpose**: Calculates donor eligibility score (0-100%) based on last donation date and medical history.

**Algorithm**:
```javascript
function calculateEligibilityScore(donor) {
  let score = 100;
  
  // Last donation date deductions
  if (donor.lastDonationDate) {
    const daysSinceLastDonation = (Date.now() - donor.lastDonationDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastDonation < 90) {
      score -= 50; // Too recent
    } else if (daysSinceLastDonation < 120) {
      score -= 25; // Recently donated
    }
  }
  
  // Medical history deductions
  if (donor.medicalHistory.hasDiabetes) {
    score -= 15;
  }
  if (donor.medicalHistory.hasSeizures) {
    score -= 20;
  }
  
  return Math.max(0, Math.min(100, score));
}
```

**Scoring Rules**:
- Base score: 100%
- Last donation < 90 days: -50%
- Last donation 90-120 days: -25%
- Diabetes: -15%
- Seizures: -20%
- Minimum: 0%, Maximum: 100%




### 3. ReliabilityService

**Purpose**: Tracks donor reliability based on donation history with time-weighted decay.

**Algorithm**:
```javascript
function calculateReliabilityScore(donorActions) {
  let score = 50; // Base score
  const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
  
  donorActions.forEach(action => {
    const weight = action.timestamp > sixMonthsAgo ? 2 : 1; // Recent actions weighted 2x
    
    switch(action.type) {
      case 'COMPLETED':
        score += 10 * weight;
        break;
      case 'CANCELLED':
        score -= 15 * weight;
        break;
      case 'IGNORED':
        score -= 5 * weight;
        break;
      case 'DECLINED':
        score -= 2 * weight;
        break;
      case 'QUICK_RESPONSE':
        score += 2 * weight;
        break;
    }
  });
  
  return Math.max(0, Math.min(100, score));
}
```

**Scoring Rules**:
- Base score: 50%
- Completed donation: +10 points
- Cancelled donation: -15 points
- Ignored request: -5 points
- Declined request: -2 points
- Quick response (< 5 min): +2 points
- Recent actions (< 6 months): 2x weight
- Minimum: 0%, Maximum: 100%

### 4. DonorMatchingService

**Purpose**: Finds and ranks eligible donors using composite scoring algorithm.

**Algorithm**:
```javascript
async function findBestDonors(request) {
  // 1. Find eligible donors
  const eligibleDonors = await Donor.findAll({
    where: {
      bloodGroup: request.bloodGroup,
      isActive: true,
      eligibilityScore: { [Op.gte]: 50 }
    }
  });
  
  // 2. Calculate metrics for each donor
  const donorsWithMetrics = await Promise.all(
    eligibleDonors.map(async donor => {
      const distance = calculateDistance(donor.location, request.location);
      const eta = await calculateETA(donor.location, request.location);
      const compositeScore = calculateCompositeScore({
        distance,
        eta,
        eligibility: donor.eligibilityScore,
        reliability: donor.reliabilityScore
      });
      
      return { donor, distance, eta, compositeScore };
    })
  );
  
  // 3. Sort by composite score (highest first)
  donorsWithMetrics.sort((a, b) => b.compositeScore - a.compositeScore);
  
  return donorsWithMetrics;
}
```




**Composite Score Calculation**:
```javascript
function calculateCompositeScore({ distance, eta, eligibility, reliability }) {
  // Normalize distance (0-10km → 100-0 score)
  const distanceScore = Math.max(0, 100 - (distance * 10));
  
  // Normalize ETA (0-60min → 100-0 score)
  const etaScore = Math.max(0, 100 - (eta * 1.67));
  
  // Weighted composite score
  const composite = (
    distanceScore * 0.25 +    // 25% weight
    etaScore * 0.20 +          // 20% weight
    eligibility * 0.25 +       // 25% weight
    reliability * 0.30         // 30% weight
  );
  
  return composite;
}
```

**Weighting Factors**:
- Distance: 25%
- ETA: 20%
- Eligibility: 25%
- Reliability: 30%

**Distance Calculation** (PostGIS):
```sql
SELECT ST_Distance(
  donor_location::geography,
  request_location::geography
) / 1000 AS distance_km
```

### 5. TimeoutService

**Purpose**: Manages RED band request timeouts and automatic donor cascading.

**Timeout Rules**:
- **View Timeout**: 10 minutes from notification sent
- **Response Timeout**: 20 minutes from notification viewed

**Algorithm**:
```javascript
function startRedBandTimeout(notification) {
  // Set view timeout (10 minutes)
  const viewTimeout = setTimeout(() => {
    if (notification.status === 'SENT') {
      expireNotification(notification, 'VIEW_TIMEOUT');
      moveToNextDonor(notification.requestId);
    }
  }, 10 * 60 * 1000);
  
  return viewTimeout;
}

function onNotificationViewed(notification) {
  clearTimeout(notification.viewTimeout);
  
  // Set response timeout (20 minutes)
  const responseTimeout = setTimeout(() => {
    if (notification.status === 'VIEWED') {
      expireNotification(notification, 'RESPONSE_TIMEOUT');
      moveToNextDonor(notification.requestId);
    }
  }, 20 * 60 * 1000);
  
  return responseTimeout;
}
```




## API Endpoints

### Authentication Endpoints

**POST /api/auth/register**
- Register new user with age validation (18-60)
- Request Body: `{ fullName, age, gender, bloodGroup, mobileNumber, city, medicalHistory, lastDonationDate, password }`
- Response: `{ userId, message }`

**POST /api/auth/verify-mobile**
- Verify mobile number with OTP
- Request Body: `{ mobileNumber, otp }`
- Response: `{ verified: true }`

**POST /api/auth/login**
- User login with JWT token
- Request Body: `{ mobileNumber, password }`
- Response: `{ token, user }`

### Blood Request Endpoints

**POST /api/requests**
- Create blood request with automatic color band assignment
- Request Body: `{ bloodGroup, location, requiredBy, notes }`
- Response: `{ requestId, urgencyBand, matchedDonors }`

**GET /api/requests/:id**
- Get request details with donor information
- Response: `{ request, acceptedDonor, notifications }`

**GET /api/requests/active**
- Get active requests for requester
- Response: `[{ request, status, acceptedDonor }]`

**POST /api/requests/private**
- Create private request to specific donors
- Request Body: `{ bloodGroup, location, requiredBy, donorIds, notes }`
- Response: `{ requestId, notifiedDonors }`

### Donor Endpoints

**GET /api/donors/search**
- Search eligible donors with composite scoring
- Query Params: `bloodGroup, latitude, longitude`
- Response: `[{ donor, distance, eta, compositeScore }]`

**PUT /api/donors/:id/location**
- Update donor's current location
- Request Body: `{ latitude, longitude }`
- Response: `{ updated: true }`

**GET /api/donors/:id/score**
- Get donor's eligibility and reliability scores
- Response: `{ eligibilityScore, reliabilityScore }`




### Notification Endpoints

**POST /api/notifications/respond**
- Donor accepts/declines request
- Request Body: `{ notificationId, response: 'ACCEPT'|'DECLINE', donatingFor: 'SELF'|'FAMILY'|'FRIEND' }`
- Response: `{ status, requestUpdated }`

**PUT /api/notifications/:id/viewed**
- Mark notification as viewed (triggers 20-min timeout for RED band)
- Response: `{ viewed: true, timeoutExpiresAt }`

**POST /api/notifications/future-commitment**
- Donor commits to future donation
- Request Body: `{ notificationId, commitmentDate }`
- Response: `{ committed: true }`

### Map Endpoints

**GET /api/map/donors**
- Get all active donors with locations for map display
- Query Params: `latitude, longitude, radius`
- Response: `[{ donor, location, distance }]`

**GET /api/map/requests/:id/donor-location**
- Get specific donor's live location
- Response: `{ donorId, location, lastUpdated }`

### Hospital Endpoints

**GET /api/hospitals/nearby**
- Query nearby hospitals using PostGIS spatial query
- Query Params: `latitude, longitude, radius`
- Response: `[{ hospital, distance, bloodAvailability }]`

**GET /api/hospitals/:id/availability**
- Check blood availability by type
- Response: `{ hospitalName, bloodAvailability }`

### Donation History Endpoints

**POST /api/donations/complete**
- Mark donation as complete
- Request Body: `{ requestId, donorId }`
- Response: `{ completed: true, scoresUpdated }`

**GET /api/donations/history/:donorId**
- Get donor's donation history
- Response: `[{ donation, request, requester }]`

**GET /api/donations/previous-donors/:requesterId**
- Get requester's previous donors
- Response: `[{ donor, lastDonation, totalDonations }]`




## Real-time Communication (Socket.io)

### WebSocket Events

**Client → Server Events**:

1. **join_request**
   - Requester joins request-specific room
   - Payload: `{ requestId, userId }`

2. **update_location**
   - Donor sends location update
   - Payload: `{ donorId, latitude, longitude }`

3. **disconnect**
   - Handle client disconnection

**Server → Client Events**:

1. **donor_location_update**
   - Broadcast donor's location to requester
   - Payload: `{ donorId, location, timestamp }`
   - Frequency: Every 30 seconds

2. **request_status_update**
   - Notify status changes
   - Payload: `{ requestId, status, acceptedDonor }`

3. **new_notification**
   - Send blood request notification to donor
   - Payload: `{ notificationId, request, distance, eta, urgencyBand }`

4. **donor_not_available**
   - Notify requester of timeout expiration
   - Payload: `{ donorId, reason: 'VIEW_TIMEOUT'|'RESPONSE_TIMEOUT' }`

### Connection Flow

```javascript
// Server-side
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const user = await verifyJWT(token);
  socket.userId = user.id;
  next();
});

io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);
  
  socket.on('join_request', ({ requestId }) => {
    socket.join(`request_${requestId}`);
  });
  
  socket.on('update_location', async ({ donorId, latitude, longitude }) => {
    await updateDonorLocation(donorId, latitude, longitude);
    const request = await getActiveDonationRequest(donorId);
    io.to(`request_${request.id}`).emit('donor_location_update', {
      donorId,
      location: { latitude, longitude },
      timestamp: Date.now()
    });
  });
});
```




## External API Integrations

### 1. Google Maps Distance Matrix API

**Purpose**: Calculate ETA with live traffic data

**Request**:
```javascript
const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
  params: {
    origins: `${donorLat},${donorLng}`,
    destinations: `${requestLat},${requestLng}`,
    mode: 'driving',
    departure_time: 'now',
    traffic_model: 'best_guess',
    key: process.env.GOOGLE_MAPS_API_KEY
  }
});

const eta = response.data.rows[0].elements[0].duration_in_traffic.value / 60; // minutes
```

**Fallback** (if API unavailable):
```javascript
const distance = calculateDistance(donorLocation, requestLocation); // km
const averageSpeed = 30; // km/h in city traffic
const eta = (distance / averageSpeed) * 60; // minutes
```

**Caching Strategy**:
- Cache ETA for 5 minutes per donor-request pair
- Use Redis for cache storage

### 2. Firebase Cloud Messaging (FCM)

**Purpose**: Send push notifications to donors

**Setup**:
```javascript
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

**Send Notification**:
```javascript
async function sendDonorNotification(donor, request) {
  const message = {
    token: donor.fcmToken,
    notification: {
      title: `${request.urgencyBand} Blood Request`,
      body: `${request.bloodGroup} needed at ${request.locationName}`
    },
    data: {
      requestId: request.id.toString(),
      urgencyBand: request.urgencyBand,
      distance: calculateDistance(donor.location, request.location).toString(),
      eta: '15' // minutes
    }
  };
  
  await admin.messaging().send(message);
}
```




### 3. Twilio SMS API

**Purpose**: Send OTP for mobile verification

**Send OTP**:
```javascript
const twilio = require('twilio')(accountSid, authToken);

async function sendOTP(mobileNumber, otp) {
  await twilio.messages.create({
    body: `Your Rapid Red Care Circle verification code is: ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: mobileNumber
  });
}
```

**OTP Storage** (Redis):
```javascript
// Store OTP with 10-minute expiration
await redis.setex(`otp:${mobileNumber}`, 600, otp);

// Verify OTP
const storedOTP = await redis.get(`otp:${mobileNumber}`);
if (storedOTP === providedOTP) {
  await redis.del(`otp:${mobileNumber}`);
  return true;
}
return false;
```

## Background Jobs (Bull Queue)

### Job Types

1. **Eligibility Score Recalculation**
   - Schedule: Daily at 2 AM
   - Purpose: Recalculate all donor eligibility scores
   - Priority: Low

2. **Reliability Score Update**
   - Trigger: After each donation event
   - Purpose: Update donor reliability based on action
   - Priority: High

3. **Expired Request Cleanup**
   - Schedule: Every hour
   - Purpose: Mark expired requests and clean up old data
   - Priority: Medium

4. **Future Donation Reminders**
   - Schedule: Daily at 9 AM
   - Purpose: Send reminders for upcoming committed donations
   - Priority: Medium

5. **Timeout Monitoring**
   - Schedule: Every minute
   - Purpose: Check RED band timeouts and trigger cascading
   - Priority: Critical

**Job Configuration**:
```javascript
const Queue = require('bull');
const eligibilityQueue = new Queue('eligibility-recalc', {
  redis: { host: 'localhost', port: 6379 }
});

// Add recurring job
eligibilityQueue.add('recalculate-all', {}, {
  repeat: { cron: '0 2 * * *' } // Daily at 2 AM
});

// Process job
eligibilityQueue.process('recalculate-all', async (job) => {
  const donors = await Donor.findAll();
  for (const donor of donors) {
    const score = await EligibilityService.calculateScore(donor);
    await donor.update({ eligibilityScore: score });
  }
});
```




## Security Considerations

### Authentication & Authorization

1. **JWT Token Structure**:
```javascript
{
  userId: 123,
  mobileNumber: '+1234567890',
  role: 'DONOR', // or 'REQUESTER'
  iat: 1234567890,
  exp: 1234654290 // 24 hours
}
```

2. **Password Security**:
- Hash with bcrypt (salt rounds: 10)
- Never store plain text passwords
- Implement password strength requirements

3. **API Rate Limiting**:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Input Validation

**Using express-validator**:
```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/auth/register', [
  body('age').isInt({ min: 18, max: 60 }),
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('mobileNumber').isMobilePhone(),
  body('fullName').trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process registration
});
```

### Data Privacy

1. **PII Protection**:
   - Encrypt sensitive data at rest
   - Use HTTPS for all communications
   - Implement GDPR compliance for data deletion

2. **Location Privacy**:
   - Only share approximate location (rounded to 100m)
   - Allow users to disable location tracking
   - Clear location data after donation completion

3. **CORS Configuration**:
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
```




## Database Design

### Indexes

**Spatial Indexes** (PostGIS):
```sql
CREATE INDEX idx_donor_location ON donors USING GIST (location);
CREATE INDEX idx_request_location ON blood_requests USING GIST (location);
CREATE INDEX idx_hospital_location ON hospital_blood_banks USING GIST (location);
```

**Standard Indexes**:
```sql
CREATE INDEX idx_user_mobile ON users (mobile_number);
CREATE INDEX idx_donor_blood_group ON donors (blood_group);
CREATE INDEX idx_request_status ON blood_requests (status);
CREATE INDEX idx_request_urgency ON blood_requests (urgency_band);
CREATE INDEX idx_notification_status ON donor_notifications (status);
CREATE INDEX idx_notification_donor ON donor_notifications (donor_id);
```

### Query Optimization

**Find Nearby Donors** (PostGIS):
```sql
SELECT 
  d.*,
  ST_Distance(d.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000 AS distance_km
FROM donors d
WHERE 
  d.blood_group = $3
  AND d.is_active = true
  AND ST_DWithin(
    d.location::geography,
    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
    10000 -- 10km radius
  )
ORDER BY distance_km ASC
LIMIT 20;
```

**Find Nearby Hospitals**:
```sql
SELECT 
  h.*,
  ST_Distance(h.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000 AS distance_km
FROM hospital_blood_banks h
WHERE 
  ST_DWithin(
    h.location::geography,
    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
    20000 -- 20km radius
  )
  AND h.blood_availability->>'$3' = 'true'
ORDER BY distance_km ASC;
```




## Error Handling

### Error Response Format

```javascript
{
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Age must be between 18 and 60 years',
    details: {
      field: 'age',
      value: 17,
      constraint: 'min:18,max:60'
    }
  }
}
```

### Error Types

1. **ValidationError** (400)
   - Invalid input data
   - Age constraints violated
   - Invalid blood group

2. **AuthenticationError** (401)
   - Invalid JWT token
   - Expired token
   - Missing credentials

3. **AuthorizationError** (403)
   - Insufficient permissions
   - Donor trying to access requester endpoints

4. **NotFoundError** (404)
   - Resource not found
   - Invalid request ID

5. **ConflictError** (409)
   - Duplicate mobile number
   - Request already accepted

6. **InternalServerError** (500)
   - Database connection failed
   - External API unavailable

### Centralized Error Handler

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: err.details
      }
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid token'
      }
    });
  }
  
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});
```




## Performance Optimization

### Caching Strategy

**Redis Cache Keys**:
```javascript
// Donor eligibility scores (cache for 1 hour)
`donor:${donorId}:eligibility` → score

// ETA calculations (cache for 5 minutes)
`eta:${donorId}:${requestId}` → eta_minutes

// Nearby donors (cache for 2 minutes)
`nearby:${lat}:${lng}:${bloodGroup}` → [donorIds]

// OTP codes (expire after 10 minutes)
`otp:${mobileNumber}` → code
```

**Cache Implementation**:
```javascript
async function getEligibilityScore(donorId) {
  const cacheKey = `donor:${donorId}:eligibility`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return parseFloat(cached);
  }
  
  const donor = await Donor.findByPk(donorId);
  const score = EligibilityService.calculateScore(donor);
  
  await redis.setex(cacheKey, 3600, score); // Cache for 1 hour
  return score;
}
```

### Database Connection Pooling

```javascript
const sequelize = new Sequelize(database, username, password, {
  host: 'localhost',
  dialect: 'postgres',
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  }
});
```

### Load Balancing

**Nginx Configuration**:
```nginx
upstream backend {
  least_conn;
  server backend1:3000;
  server backend2:3000;
  server backend3:3000;
}

server {
  listen 80;
  location /api/ {
    proxy_pass http://backend;
  }
}
```




## Testing Strategy

### Unit Tests

**Test Coverage Goals**:
- Services: 90%+ coverage
- Models: 80%+ coverage
- Utilities: 85%+ coverage

**Example Test** (ColorBandService):
```javascript
describe('ColorBandService', () => {
  describe('assignColorBand', () => {
    it('should assign RED band for immediate requirement', () => {
      const requiredBy = new Date();
      const result = ColorBandService.assignColorBand(requiredBy);
      expect(result.band).toBe('RED');
      expect(result.isEmergency).toBe(true);
    });
    
    it('should assign PINK band for within 24 hours', () => {
      const requiredBy = new Date(Date.now() + 12 * 60 * 60 * 1000);
      const result = ColorBandService.assignColorBand(requiredBy);
      expect(result.band).toBe('PINK');
      expect(result.isEmergency).toBe(false);
    });
  });
});
```

### Integration Tests

**Test Scenarios**:
1. Complete registration flow with age validation
2. Blood request creation with color band assignment
3. Donor matching with composite scoring
4. Notification response handling
5. Donation completion with score updates

**Example Test** (Registration Flow):
```javascript
describe('POST /api/auth/register', () => {
  it('should reject registration with age < 18', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, age: 17 });
    
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
  
  it('should accept registration with age 18-60', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, age: 25 });
    
    expect(response.status).toBe(200);
    expect(response.body.userId).toBeDefined();
  });
});
```

### End-to-End Tests

**Critical Flows**:
1. Complete donation flow (request → match → accept → track → complete)
2. Timeout cascade scenario (RED band timeout → next donor)
3. Private request flow (requester → previous donors → accept)




## Deployment Architecture

### Production Environment

**Infrastructure**:
```
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer (Nginx)                    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  App Server  │    │  App Server  │    │  App Server  │
│  (Node.js)   │    │  (Node.js)   │    │  (Node.js)   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
        ┌─────────────────────────────────────────┐
        │         PostgreSQL Primary              │
        │         (with PostGIS)                  │
        └─────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │  PostgreSQL      │  │  PostgreSQL      │
        │  Replica 1       │  │  Replica 2       │
        └──────────────────┘  └──────────────────┘
```

### Docker Configuration

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgis/postgis:14-3.2
    environment:
      - POSTGRES_DB=rapid_red
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```




### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rapid_red
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rapid_red
DB_USER=postgres
DB_PASSWORD=secure_password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=24h

# External APIs
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Application
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://app.rapidredcare.com,https://admin.rapidredcare.com

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

### CI/CD Pipeline (GitHub Actions)

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:14-3.2
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run migrate
      - run: npm test
      - run: npm run test:coverage

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Deploy commands here
```




## Monitoring & Logging

### Application Monitoring

**Health Check Endpoint**:
```javascript
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'unknown'
    }
  };
  
  try {
    await sequelize.authenticate();
    health.services.database = 'connected';
  } catch (error) {
    health.services.database = 'disconnected';
    health.status = 'degraded';
  }
  
  try {
    await redis.ping();
    health.services.redis = 'connected';
  } catch (error) {
    health.services.redis = 'disconnected';
    health.status = 'degraded';
  }
  
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### Logging Strategy

**Winston Logger Configuration**:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

**Log Levels**:
- **error**: System errors, exceptions
- **warn**: Timeout events, failed API calls
- **info**: Request logs, successful operations
- **debug**: Detailed debugging information

### Metrics to Track

1. **Request Metrics**:
   - Request count per endpoint
   - Response time (p50, p95, p99)
   - Error rate

2. **Business Metrics**:
   - Active blood requests
   - Donor response rate
   - Average time to donor acceptance
   - Timeout cascade frequency

3. **System Metrics**:
   - CPU usage
   - Memory usage
   - Database connection pool size
   - Redis cache hit rate




## Scalability Considerations

### Horizontal Scaling

**Stateless Application Design**:
- Store session data in Redis (not in-memory)
- Use database for all persistent state
- Enable multiple app server instances

**Socket.io Scaling** (Redis Adapter):
```javascript
const io = require('socket.io')(server);
const redisAdapter = require('socket.io-redis');

io.adapter(redisAdapter({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
}));
```

### Database Scaling

**Read Replicas**:
- Route read queries to replicas
- Write queries to primary
- Use Sequelize replication configuration

```javascript
const sequelize = new Sequelize({
  replication: {
    read: [
      { host: 'replica1.example.com', username: 'read_user', password: 'pass' },
      { host: 'replica2.example.com', username: 'read_user', password: 'pass' }
    ],
    write: { host: 'primary.example.com', username: 'write_user', password: 'pass' }
  }
});
```

**Connection Pooling**:
- Max connections: 20 per instance
- Min connections: 5 per instance
- Idle timeout: 10 seconds

### Caching Strategy

**Cache Layers**:
1. **Application Cache** (Redis): Eligibility scores, ETA calculations
2. **CDN Cache**: Static assets, API responses (short TTL)
3. **Database Query Cache**: Frequently accessed data

**Cache Invalidation**:
- Eligibility scores: Invalidate on profile update
- ETA calculations: TTL of 5 minutes
- Nearby donors: TTL of 2 minutes




## Future Enhancements

### Phase 2 Features

1. **Machine Learning Integration**
   - Predict donor availability based on historical patterns
   - Optimize matching algorithm with ML models
   - Forecast blood demand by region

2. **Advanced Analytics Dashboard**
   - Real-time donation statistics
   - Geographic heat maps of requests
   - Donor engagement metrics
   - Response time analytics

3. **Multi-language Support**
   - Internationalization (i18n)
   - Support for regional languages
   - Localized notifications

4. **Gamification**
   - Donor badges and achievements
   - Leaderboards for most donations
   - Reward points system

5. **Integration with Blood Banks**
   - Real-time inventory sync
   - Automated blood bank notifications
   - Direct appointment booking

### Technical Debt & Improvements

1. **Microservices Architecture**
   - Split monolith into services
   - Notification service
   - Matching service
   - Location tracking service

2. **GraphQL API**
   - Add GraphQL alongside REST
   - Reduce over-fetching
   - Better mobile app performance

3. **Event Sourcing**
   - Track all state changes
   - Audit trail for compliance
   - Better debugging capabilities

4. **Advanced Monitoring**
   - Distributed tracing (Jaeger)
   - APM tools (New Relic, DataDog)
   - Real-time alerting




## Correctness Properties

### Property 1: Age Constraint Enforcement
**Validates: Requirement 1.2**

All registered users must have age between 18 and 60 (inclusive).

**Formal Statement**:
```
∀ user ∈ Users, 18 ≤ user.age ≤ 60
```

**Test Strategy**:
1. Attempt registration with age 17 → Assert rejection
2. Attempt registration with age 61 → Assert rejection
3. Register with age 18 → Assert success
4. Register with age 60 → Assert success
5. Register with age 25 → Assert success

### Property 2: Color Band Assignment Correctness
**Validates: Requirement 3.1-3.4**

Color band must be correctly assigned based on time until required.

**Formal Statement**:
```
∀ request ∈ BloodRequests,
  hoursUntilRequired ≤ 0 → urgencyBand = 'RED' ∧
  0 < hoursUntilRequired ≤ 24 → urgencyBand = 'PINK' ∧
  hoursUntilRequired > 24 → urgencyBand = 'WHITE'
```

**Test Strategy**:
1. Create request with requiredBy = now → Assert RED band
2. Create request with requiredBy = now + 12 hours → Assert PINK band
3. Create request with requiredBy = now + 48 hours → Assert WHITE band
4. Verify emergency flag set only for RED band

### Property 3: Donor Ranking Consistency
**Validates: Requirement 4.6-4.8**

Donors must be ranked by composite score in descending order, with best donor first.

**Formal Statement**:
```
∀ i, j ∈ rankedDonors, i < j → compositeScore(i) ≥ compositeScore(j)
∧ rankedDonors[0] = bestDonor
```

**Test Strategy**:
1. Create donors with known scores
2. Run matching algorithm
3. Assert list is sorted by composite score descending
4. Assert first donor has highest score
5. Verify composite score calculation uses correct weights




### Property 4: Timeout Cascade Correctness
**Validates: Requirement 6.1-6.6**

RED band requests must timeout and cascade to next donor if no response.

**Formal Statement**:
```
∀ redBandNotification,
  (¬viewed ∧ elapsed > 10min) ∨ (viewed ∧ ¬responded ∧ elapsed > 20min)
  → status = 'EXPIRED' ∧ nextDonorNotified = true
```

**Test Strategy**:
1. Send RED band notification to Donor A
2. Wait 10 minutes without view → Assert expired, Donor B notified
3. Send RED band notification to Donor C
4. Mark as viewed, wait 20 minutes without response → Assert expired, Donor D notified
5. Verify timeout cleared on donor response

### Property 5: Eligibility Score Bounds
**Validates: Requirement 2.1-2.5**

Eligibility scores must always be within 0-100% range.

**Formal Statement**:
```
∀ donor ∈ Donors, 0 ≤ donor.eligibilityScore ≤ 100
```

**Test Strategy**:
1. Calculate score for donor with all negative factors → Assert ≥ 0
2. Calculate score for perfect donor → Assert ≤ 100
3. Test edge cases with extreme medical history
4. Verify score recalculation on profile update

### Property 6: Reliability Score Time Decay
**Validates: Requirement 11.4**

Recent actions must have higher weight than older actions in reliability calculation.

**Formal Statement**:
```
∀ action₁, action₂,
  timestamp(action₁) > sixMonthsAgo ∧ timestamp(action₂) < sixMonthsAgo
  → weight(action₁) = 2 × weight(action₂)
```

**Test Strategy**:
1. Create donor with recent completed donation (< 6 months)
2. Create donor with old completed donation (> 6 months)
3. Assert recent action has 2x impact on score
4. Verify score calculation uses correct time threshold




### Property 7: Location Privacy
**Validates: Requirement 7.1, 8.1**

Donor location must only be shared after acceptance and with requester only.

**Formal Statement**:
```
∀ donor, requester,
  canAccessLocation(requester, donor) ↔ 
  (∃ request: request.acceptedDonorId = donor.id ∧ request.requesterId = requester.id)
```

**Test Strategy**:
1. Attempt to access donor location before acceptance → Assert denied
2. Donor accepts request → Assert requester can access location
3. Different requester attempts access → Assert denied
4. Verify location tracking stops after donation completion

### Property 8: Notification Quiet Hours
**Validates: Requirement 15.2-15.3**

Non-emergency notifications must respect quiet hours; RED band overrides quiet hours.

**Formal Statement**:
```
∀ notification,
  (urgencyBand ≠ 'RED' ∧ inQuietHours(donor)) → notificationSent = false ∧
  (urgencyBand = 'RED') → notificationSent = true
```

**Test Strategy**:
1. Set donor quiet hours 10 PM - 8 AM
2. Send PINK band notification at 11 PM → Assert not sent
3. Send RED band notification at 11 PM → Assert sent (override)
4. Send WHITE band notification at 9 AM → Assert sent (outside quiet hours)

### Property 9: Private Request Exclusivity
**Validates: Requirement 10.4-10.5**

Private requests must only notify selected donors, bypassing general matching.

**Formal Statement**:
```
∀ privateRequest,
  notifiedDonors(privateRequest) = selectedDonors(privateRequest) ∧
  notifiedDonors(privateRequest) ∩ generalMatchedDonors = ∅
```

**Test Strategy**:
1. Create private request with 2 specific donors
2. Assert only those 2 donors receive notifications
3. Assert general matching algorithm not invoked
4. Verify other eligible donors not notified




## Conclusion

This design document provides a comprehensive technical blueprint for the Rapid Red Care Circle blood donation coordination platform. The architecture leverages modern technologies including Node.js/Express, PostgreSQL with PostGIS for spatial queries, Socket.io for real-time communication, and Redis for caching and job queuing.

Key design highlights:

1. **Smart Matching Algorithm**: Composite scoring based on distance (25%), ETA (20%), eligibility (25%), and reliability (30%) ensures optimal donor selection.

2. **Color Band System**: RED/PINK/WHITE urgency classification with automatic timeout logic for emergency requests.

3. **Real-time Features**: Socket.io enables live location tracking and instant notifications.

4. **Scalability**: Stateless design, connection pooling, caching strategy, and horizontal scaling support.

5. **Security**: JWT authentication, input validation, rate limiting, and data privacy measures.

6. **Testing**: Comprehensive unit, integration, and E2E tests with correctness properties validation.

The implementation follows an incremental approach with early validation, allowing for continuous integration and testing throughout development. The system is designed to be production-ready with proper monitoring, logging, error handling, and deployment configurations.

Next steps: Proceed with implementation tasks as outlined in tasks.md, starting with timeout and notification services (Task 3), followed by API endpoints (Tasks 4-6), real-time features (Task 7), and external integrations (Task 8).

