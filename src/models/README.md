# Sequelize Models Documentation

This directory contains all Sequelize models for the Rapid Red Care Circle application.

## Models Overview

### User Model (`User.js`)
Represents registered users (both donors and requesters).

**Key Features:**
- Age validation (18-60 years)
- Blood group enum validation
- Medical history stored as JSONB
- Notification preferences with quiet hours
- Associations: hasOne Donor, hasMany BloodRequests, hasMany DonationHistory

### Donor Model (`Donor.js`)
Represents donor-specific information and metrics.

**Key Features:**
- Eligibility score (0-100) based on last donation date and medical history
- Reliability score (0-100) based on donation history
- PostGIS geography type for current location
- Helper methods: `getLocation()`, `setLocation(lng, lat)`
- Associations: belongsTo User, hasMany DonorNotifications, hasMany DonationHistory

### BloodRequest Model (`BloodRequest.js`)
Represents blood donation requests.

**Key Features:**
- Urgency band enum (RED, PINK, WHITE)
- Blood group validation
- PostGIS geography type for location
- Status tracking (PENDING, DONOR_ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED, EXPIRED)
- Helper methods: `getLocation()`, `setLocation(lng, lat)`
- Associations: belongsTo User (requester), hasMany DonorNotifications, hasMany DonationHistory

### DonorNotification Model (`DonorNotification.js`)
Tracks notifications sent to donors for blood requests.

**Key Features:**
- Timestamps for sent, viewed, and responded
- Response type enum (ACCEPTED, DECLINED, IGNORED, FUTURE_DONATION)
- Timeout tracking for RED band requests
- Helper methods: `isViewed()`, `isResponded()`, `hasExpired()`
- Associations: belongsTo BloodRequest, belongsTo Donor

### DonationHistory Model (`DonationHistory.js`)
Records the history of donation attempts and completions.

**Key Features:**
- Donation type enum (SELF, FAMILY, FRIEND, OTHER)
- Status tracking (ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED)
- Timestamps for acceptance, completion, and cancellation
- Helper methods: `isCompleted()`, `isCancelled()`
- Associations: belongsTo BloodRequest, belongsTo Donor, belongsTo User (requester)

### HospitalBloodBank Model (`HospitalBloodBank.js`)
Represents hospital blood banks and their blood availability.

**Key Features:**
- PostGIS geography type for location
- Blood availability stored as JSONB
- Helper methods: `getLocation()`, `setLocation(lng, lat)`, `hasBloodType(bloodGroup)`
- No associations (standalone entity)

## Usage

### Importing Models

```javascript
const db = require('./models');

// Access individual models
const { User, Donor, BloodRequest } = db;

// Access Sequelize instance
const { sequelize, Sequelize } = db;
```

### Creating Records

```javascript
// Create a user
const user = await User.create({
  full_name: 'John Doe',
  age: 25,
  gender: 'Male',
  mobile_number: '+1234567890',
  city: 'New York',
  blood_group: 'O+'
});

// Create a donor profile
const donor = await Donor.create({
  user_id: user.id,
  last_donation_date: '2024-01-15'
});

// Set donor location
donor.setLocation(-74.006, 40.7128); // longitude, latitude
await donor.save();
```

### Querying with Associations

```javascript
// Get user with donor profile
const user = await User.findByPk(userId, {
  include: [{ model: Donor, as: 'donorProfile' }]
});

// Get blood request with requester and notifications
const request = await BloodRequest.findByPk(requestId, {
  include: [
    { model: User, as: 'requester' },
    { model: DonorNotification, as: 'notifications' }
  ]
});
```

### Spatial Queries

```javascript
// Find donors within 10km radius
const donors = await sequelize.query(`
  SELECT d.*, 
    ST_Distance(d.current_location, ST_GeogFromText('POINT(${lng} ${lat})')) / 1000 as distance_km
  FROM donors d
  WHERE ST_DWithin(
    d.current_location,
    ST_GeogFromText('POINT(${lng} ${lat})'),
    10000
  )
  ORDER BY distance_km
`, { type: Sequelize.QueryTypes.SELECT });
```

## Validations

All models include appropriate validations:
- Age: 18-60 years (User)
- Blood Group: A+, A-, B+, B-, AB+, AB-, O+, O- (User, BloodRequest)
- Urgency Band: RED, PINK, WHITE (BloodRequest)
- Scores: 0-100 (Donor eligibility and reliability)
- Response Type: ACCEPTED, DECLINED, IGNORED, FUTURE_DONATION (DonorNotification)
- Donation Type: SELF, FAMILY, FRIEND, OTHER (DonationHistory)

## Testing

Run model tests:
```bash
npm test __tests__/models.test.js
```

## Notes

- All models use snake_case for database columns (underscored: true)
- Timestamps are automatically managed by Sequelize
- PostGIS extension must be enabled in PostgreSQL for geography types
- Geography columns use SRID 4326 (WGS 84 coordinate system)
