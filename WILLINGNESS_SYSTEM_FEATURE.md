# Donor Willingness & Visibility System

## Overview

A comprehensive system that tracks donor willingness and eligibility, displaying them on the map with color-coded markers (green for willing/eligible donors, red for others) based on their profile address.

## Key Features

### 1. Willingness Confirmation Flow
- After passing eligibility questionnaire, donors are asked: "Are you willing to donate blood?"
- Two options: "Yes, I'm Willing to Donate" or "Not Right Now"
- Willingness is stored in the database with timestamp

### 2. Color-Coded Map Display
- **GREEN Markers**: Donors who are BOTH willing AND passed eligibility (Best Donors)
- **RED Markers**: Donors who are either not willing OR haven't passed eligibility (Default users)

### 3. Address-Based Location
- Uses donor's address from profile section for map location
- Falls back to default Chennai coordinates if no address
- Future: Can integrate geocoding service for accurate coordinates

## Changes Made

### Database Changes

#### Donor Model (src/models/Donor.js)
Added four new fields:
```javascript
is_willing: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
  field: 'is_willing'
},
passed_eligibility: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
  field: 'passed_eligibility'
},
eligibility_passed_at: {
  type: DataTypes.DATE,
  allowNull: true,
  field: 'eligibility_passed_at'
},
willingness_confirmed_at: {
  type: DataTypes.DATE,
  allowNull: true,
  field: 'willingness_confirmed_at'
}
```

#### Migration File
Created: `src/migrations/20260303000002-add-willingness-fields-to-donors.js`
- Adds all four new columns to donors table
- Includes rollback functionality

### Frontend Changes (public/app.js)

#### Updated Eligibility Success Message
```javascript
// Before: "Proceed to Live Map" button
// After: Willingness confirmation with two buttons
showResult(
    'success',
    '✅ Eligible to Donate!',
    `...Are you willing to donate blood?...
    <button onclick="confirmWillingness()">✅ Yes, I'm Willing to Donate</button>
    <button onclick="closeEligibilityModal()">❌ Not Right Now</button>`
);
```

#### New Function: `confirmWillingness()`
Handles willingness confirmation:
- Validates user is logged in
- Sends POST request to `/api/donors/willingness`
- Stores willingness and eligibility status
- Shows success message
- Navigates to request view to show map

#### Updated Function: `loadDonors()`
Enhanced map display:
- Fetches donors with willingness/eligibility status
- Creates green markers for willing donors
- Creates red markers for default donors
- Shows address in popup if available
- Displays status: "✅ Willing & Eligible" or "⚠️ Not Available"
- Logs summary of green vs red markers

### Backend Changes

#### New Route: POST /api/donors/willingness (src/routes/donors.js)
Handles willingness confirmation:
```javascript
Request Body:
{
  "email": "user@example.com",
  "isWilling": true,
  "passedEligibility": true
}

Response:
{
  "message": "Willingness confirmed successfully",
  "donor": {
    "id": 1,
    "is_willing": true,
    "passed_eligibility": true,
    "eligibility_passed_at": "2024-03-03T10:30:00Z",
    "willingness_confirmed_at": "2024-03-03T10:30:00Z"
  }
}
```

Features:
- Case-insensitive email lookup
- Creates donor profile if doesn't exist
- Updates willingness and eligibility flags
- Sets timestamps for tracking
- Uses address from profile for location
- Marks user as active

#### Updated Route: GET /api/map/donors (src/routes/map.js)
Enhanced donor fetching:
- Returns willingness and eligibility status
- Calculates marker color (green/red)
- Includes address in response
- Provides summary statistics
- Supports blood group filtering

Response includes:
```javascript
{
  "donors": [
    {
      "id": 1,
      "fullName": "John Doe",
      "bloodGroup": "O+",
      "city": "Chennai",
      "address": "123 Main St, Anna Nagar",
      "isWilling": true,
      "passedEligibility": true,
      "status": "willing",
      "markerColor": "green",
      "coordinates": { "lat": 13.0827, "lng": 80.2707 }
    }
  ],
  "summary": {
    "total": 10,
    "willing": 6,
    "default": 4
  }
}
```

### UI Changes (public/index.html)

#### Updated CSS for Markers
```css
/* Red Marker for Default Donors */
.red-marker {
    background-color: #dc2626;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.6);
}

/* Green Marker for Willing Donors */
.green-marker {
    background-color: #22c55e;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 4px solid white;
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.8);
    animation: pulse 2s ease-in-out infinite;
}
```

Green markers are:
- Slightly larger (28px vs 24px)
- Pulsing animation to draw attention
- Brighter shadow for visibility

## User Flow

### Donor Flow

1. **Navigate to Donate Blood**
   - Click "Donate Blood" tab
   - Click "Check Eligibility" button

2. **Complete Eligibility Questionnaire**
   - Answer all questions
   - If all answers correct, proceed to next step
   - If any answer wrong, show failed questions

3. **Willingness Confirmation** (NEW)
   - Success message: "✅ Eligible to Donate!"
   - Question: "Are you willing to donate blood?"
   - Two buttons:
     - "✅ Yes, I'm Willing to Donate"
     - "❌ Not Right Now"

4. **Confirm Willingness**
   - Click "Yes, I'm Willing to Donate"
   - Backend updates:
     - `is_willing = true`
     - `passed_eligibility = true`
     - `eligibility_passed_at = now()`
     - `willingness_confirmed_at = now()`
     - `user.is_active = true`
     - Location set from profile address

5. **Success Confirmation**
   - Toast message: "✅ Thank you! You are now marked as a willing donor..."
   - Automatically navigates to Request (Find Donor) view
   - Donor appears on map with GREEN marker

### Requester Flow

1. **Navigate to Request Blood**
   - Click "Request Blood" tab
   - Map loads with all donors

2. **View Donor Map**
   - **GREEN markers**: Willing & Eligible donors (Best choice!)
     - Larger, pulsing markers
     - Status: "✅ Willing & Eligible"
     - These donors have confirmed willingness
   
   - **RED markers**: Default donors (Not available)
     - Smaller, static markers
     - Status: "⚠️ Not Available"
     - Either not willing or haven't passed eligibility

3. **Click on Marker**
   - View donor details:
     - Name
     - Status (Willing/Not Available)
     - Blood Group
     - City
     - Address (if available)
     - Reliability Score
     - Eligibility Score
     - Donation History

4. **Select Best Donor**
   - Prioritize GREEN markers
   - Consider proximity (address shown)
   - Check reliability score
   - Send blood request

## Marker Color Logic

### GREEN Marker Criteria
```javascript
is_willing === true AND passed_eligibility === true
```

A donor gets a GREEN marker when:
- ✅ They passed the eligibility questionnaire
- ✅ They confirmed willingness to donate
- ✅ Both conditions must be true

### RED Marker Criteria
```javascript
is_willing === false OR passed_eligibility === false
```

A donor gets a RED marker when:
- ❌ They haven't passed eligibility, OR
- ❌ They haven't confirmed willingness, OR
- ❌ They declined to donate ("Not Right Now")

## Console Logging

### Frontend Logs

#### Willingness Confirmation:
```
💚 [WILLINGNESS] ========================================
💚 [WILLINGNESS] User confirmed willingness to donate
📧 [WILLINGNESS] User email: user@example.com
🚀 [WILLINGNESS] Sending willingness confirmation to backend...
📊 [WILLINGNESS] Response: {...}
✅ [WILLINGNESS] Willingness confirmed successfully
💚 [WILLINGNESS] ========================================
```

#### Map Loading:
```
🗺️ [MAP] Loading donors...
📊 [MAP] Received donors: { total: 10, willing: 6, default: 4 }
✅ [MAP] Loaded 10 donor markers
💚 [MAP] Green markers (willing): 6
🔴 [MAP] Red markers (default): 4
```

### Backend Logs

#### Willingness Confirmation:
```
💚 [WILLINGNESS] ========================================
💚 [WILLINGNESS] Willingness confirmation request
📧 [WILLINGNESS] Email: user@example.com
💚 [WILLINGNESS] Is Willing: true
✅ [WILLINGNESS] Passed Eligibility: true
✅ [WILLINGNESS] User found: 1
✅ [WILLINGNESS] Updated successfully
💚 [WILLINGNESS] Donor ID: 1
💚 [WILLINGNESS] Is Willing: true
💚 [WILLINGNESS] Passed Eligibility: true
💚 [WILLINGNESS] ========================================
```

#### Map Donors:
```
🗺️ [MAP] Fetching donors for map display
📊 [MAP] Found 10 donors
💚 [MAP] Willing donors (green): 6
🔴 [MAP] Default donors (red): 4
```

## Testing Instructions

### 1. Run Migrations
```bash
npx sequelize-cli db:migrate
```

This adds the new willingness fields to the donors table.

### 2. Test Willingness Flow

#### As a Donor:
1. Sign in to the application
2. Navigate to "Donate Blood" tab
3. Click "Check Eligibility"
4. Answer all questions with "YES"
5. Verify success message shows willingness question
6. Click "✅ Yes, I'm Willing to Donate"
7. Check console for willingness logs
8. Verify success toast appears
9. Verify navigation to Request view

#### Expected Console Logs:
```
✅ [ELIGIBILITY] User passed all eligibility checks
💚 [WILLINGNESS] User confirmed willingness to donate
📧 [WILLINGNESS] User email: your@email.com
✅ [WILLINGNESS] Willingness confirmed successfully
```

### 3. Test Map Display

#### As a Requester:
1. Navigate to "Request Blood" tab
2. Verify map loads with markers
3. Check console for map loading logs
4. Verify GREEN markers for willing donors
5. Verify RED markers for default donors
6. Click on GREEN marker
7. Verify popup shows "✅ Willing & Eligible"
8. Verify address is displayed (if available)
9. Click on RED marker
10. Verify popup shows "⚠️ Not Available"

#### Expected Console Logs:
```
🗺️ [MAP] Loading donors...
📊 [MAP] Received donors: { total: X, willing: Y, default: Z }
✅ [MAP] Loaded X donor markers
💚 [MAP] Green markers (willing): Y
🔴 [MAP] Red markers (default): Z
```

### 4. Test Declining Willingness

1. Complete eligibility questionnaire
2. Click "❌ Not Right Now"
3. Verify modal closes
4. Verify no willingness is stored
5. User should appear as RED marker on map

### 5. Test Address Display

1. Update profile with address
2. Confirm willingness
3. Check map marker popup
4. Verify address is displayed

## API Endpoints

### POST /api/donors/willingness
**Purpose**: Confirm donor willingness to donate

**Request**:
```json
{
  "email": "donor@example.com",
  "isWilling": true,
  "passedEligibility": true
}
```

**Response** (200 OK):
```json
{
  "message": "Willingness confirmed successfully",
  "donor": {
    "id": 1,
    "is_willing": true,
    "passed_eligibility": true,
    "eligibility_passed_at": "2024-03-03T10:30:00.000Z",
    "willingness_confirmed_at": "2024-03-03T10:30:00.000Z"
  }
}
```

**Error Responses**:
- 400: Email is required
- 404: User not found
- 500: Failed to confirm willingness

### GET /api/map/donors
**Purpose**: Fetch all donors for map display with willingness status

**Query Parameters**:
- `bloodGroup` (optional): Filter by blood group

**Response** (200 OK):
```json
{
  "donors": [
    {
      "id": 1,
      "userId": 1,
      "fullName": "John Doe",
      "bloodGroup": "O+",
      "city": "Chennai",
      "address": "123 Main St, Anna Nagar",
      "eligibilityScore": 100.00,
      "reliabilityScore": 85.50,
      "totalDonations": 5,
      "completedDonations": 4,
      "coordinates": {
        "lat": 13.0827,
        "lng": 80.2707
      },
      "isWilling": true,
      "passedEligibility": true,
      "status": "willing",
      "markerColor": "green"
    }
  ],
  "summary": {
    "total": 10,
    "willing": 6,
    "default": 4
  }
}
```

## Benefits

### For Donors
1. **Clear Intent**: Explicitly confirm willingness to donate
2. **No Pressure**: Can decline without consequences
3. **Visibility**: Willing donors get priority visibility (green markers)
4. **Recognition**: Pulsing green markers show appreciation

### For Requesters
1. **Better Targeting**: Easily identify willing donors (green markers)
2. **Higher Success Rate**: Contact donors who confirmed willingness
3. **Address Information**: See donor location from profile
4. **Visual Clarity**: Color coding makes selection obvious

### For System
1. **Data Quality**: Track actual willingness vs just eligibility
2. **Analytics**: Monitor willingness rates over time
3. **Optimization**: Focus notifications on willing donors
4. **User Experience**: Reduce unnecessary contacts to unwilling donors

## Future Enhancements

1. **Geocoding Integration**
   - Convert address to accurate coordinates
   - Use Google Maps Geocoding API or similar
   - Update location automatically when address changes

2. **Willingness Expiry**
   - Auto-expire willingness after 24/48 hours
   - Send reminder to reconfirm
   - Move from green to red marker after expiry

3. **Willingness History**
   - Track willingness confirmations over time
   - Show willingness rate in donor profile
   - Use for reliability scoring

4. **Smart Notifications**
   - Only notify willing donors
   - Prioritize green markers for urgent requests
   - Reduce notification fatigue

5. **Willingness Reasons**
   - Allow donors to specify why not willing
   - Track common reasons
   - Improve system based on feedback

6. **Batch Willingness Check**
   - Send periodic willingness surveys
   - Update status in bulk
   - Keep map data fresh

## Files Modified

1. `src/models/Donor.js` - Added willingness fields
2. `src/migrations/20260303000002-add-willingness-fields-to-donors.js` - Database migration
3. `public/app.js` - Willingness confirmation and map display
4. `public/index.html` - Marker CSS styles
5. `src/routes/donors.js` - Willingness confirmation endpoint
6. `src/routes/map.js` - Enhanced donor fetching with status

## Database Schema

### donors Table - New Columns
```sql
ALTER TABLE donors ADD COLUMN is_willing BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE donors ADD COLUMN passed_eligibility BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE donors ADD COLUMN eligibility_passed_at TIMESTAMP NULL;
ALTER TABLE donors ADD COLUMN willingness_confirmed_at TIMESTAMP NULL;
```

## Security & Privacy

1. **Consent**: Explicit willingness confirmation required
2. **Opt-out**: Donors can decline without penalty
3. **Address Privacy**: Address shown only to requesters
4. **Status Transparency**: Clear indication of availability
5. **Data Retention**: Timestamps track when status was set

## Backward Compatibility

- Existing donors without willingness data show as RED markers
- Old eligibility flow still works (deprecated)
- No breaking changes to existing functionality
- Gradual migration as donors confirm willingness
