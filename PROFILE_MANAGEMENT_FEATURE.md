# Profile Management Feature

## Overview

The Registration section has been converted into a comprehensive Profile Management section that allows logged-in users to view and update their profile information.

## Changes Made

### 1. Frontend Changes (public/index.html)

#### Section Rename
- **Header**: Changed from "🩸 Register as Donor" to "👤 Profile"
- **Subtitle**: Changed from "Join our community and save lives" to "Manage your profile information"
- **Navigation Button**: Changed from "Register" to "Profile"

#### New Field Added
- **Address Field**: Added a multi-line textarea input for address
  - Field ID: `address`
  - Type: `<textarea>`
  - Rows: 3
  - Placeholder: "Enter your complete address"
  - Position: After "City" field, before "Last Blood Donation Date"

#### Button Update
- **Submit Button**: Changed from "Register Now" to "Save Changes"
- **Removed**: "Add Sample Data" button (not needed for profile management)

#### Form Handler Update
- Form `onsubmit` changed from `handleRegistration(event)` to `handleProfileUpdate(event)`

### 2. Frontend Logic Changes (public/app.js)

#### New Function: `handleProfileUpdate(event)`
Handles profile update submissions:
- Validates user is logged in
- Collects all form data including new address field
- Validates age (18-60)
- Sends PUT request to `/api/auth/profile`
- Updates `currentUser` object in localStorage
- Shows success message: "✓ Profile Updated Successfully!"
- Comprehensive logging for debugging

#### New Function: `loadProfileData()`
Loads existing profile data into the form:
- Called automatically when Profile view is shown
- Fetches user data from `/api/auth/profile?email={email}`
- Populates all form fields with existing data
- Handles both user and donor profile data
- Gracefully handles missing data

#### Updated Function: `showView(viewName)`
- Added profile data loading when 'register' view is shown
- Calls `loadProfileData()` to populate form

#### Updated Function: `handleRegistration(event)`
- Kept for backward compatibility
- Updated to include address field in registration

### 3. Backend Changes

#### User Model (src/models/User.js)
Added new field:
```javascript
address: {
  type: DataTypes.TEXT,
  allowNull: true,
  field: 'address'
}
```

#### Auth Routes (src/routes/auth.js)

**New Route: GET /api/auth/profile**
- Query parameter: `email` (required)
- Returns user profile data and donor profile (if exists)
- Case-insensitive email lookup
- Response includes:
  - User: id, full_name, age, gender, email, mobile_number, city, address, blood_group, medical_history, is_active
  - Donor: id, last_donation_date, eligibility_score, reliability_score, total_donations (if donor profile exists)

**New Route: PUT /api/auth/profile**
- Updates user profile information
- Request body: email, fullName, age, gender, bloodGroup, mobileNumber, city, address, lastDonationDate, medicalHistory, isDonor
- Validates age (18-60)
- Case-insensitive email lookup
- Updates user fields
- Creates or updates donor profile if isDonor is true
- Returns updated user data

**Updated Route: POST /api/auth/register**
- Added address field handling
- Stores address during registration

#### Database Migration
Created migration file: `src/migrations/20260303000001-add-address-to-users.js`
- Adds `address` column to `users` table
- Type: TEXT
- Nullable: true
- Position: After `city` column

## User Flow

### Viewing Profile
1. User logs in to the application
2. Clicks on "Profile" tab in navigation
3. `loadProfileData()` is automatically called
4. Form is populated with existing user data
5. User can view all their information

### Updating Profile
1. User modifies any field in the profile form
2. User clicks "Save Changes" button
3. Form validates age (18-60)
4. `handleProfileUpdate()` sends data to backend
5. Backend validates and updates database
6. Success message appears: "✓ Profile Updated Successfully!"
7. `currentUser` object is updated in localStorage
8. Success message auto-hides after 5 seconds

## API Endpoints

### GET /api/auth/profile
**Purpose**: Retrieve user profile data

**Query Parameters**:
- `email` (required): User's email address

**Response** (200 OK):
```json
{
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "age": 25,
    "gender": "Male",
    "email": "john@example.com",
    "mobile_number": "+1234567890",
    "city": "Chennai",
    "address": "123 Main Street, Anna Nagar",
    "blood_group": "O+",
    "medical_history": { "notes": "No major conditions" },
    "is_active": true
  },
  "donor": {
    "id": 1,
    "last_donation_date": "2024-01-15",
    "eligibility_score": 100.00,
    "reliability_score": 85.50,
    "total_donations": 5
  }
}
```

**Error Responses**:
- 400: Email is required
- 404: User not found

### PUT /api/auth/profile
**Purpose**: Update user profile data

**Request Body**:
```json
{
  "email": "john@example.com",
  "fullName": "John Doe",
  "age": 26,
  "gender": "Male",
  "bloodGroup": "O+",
  "mobileNumber": "+1234567890",
  "city": "Chennai",
  "address": "456 New Street, T Nagar",
  "lastDonationDate": "2024-02-20",
  "medicalHistory": "No major conditions",
  "isDonor": true
}
```

**Response** (200 OK):
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "blood_group": "O+",
    "city": "Chennai",
    "address": "456 New Street, T Nagar"
  }
}
```

**Error Responses**:
- 400: Email is required / Age must be between 18 and 60 years
- 404: User not found
- 500: Failed to update profile

## Database Schema Update

### users Table
New column added:
```sql
ALTER TABLE users ADD COLUMN address TEXT NULL AFTER city;
```

## Console Logging

### Frontend Logs
```
👤 [PROFILE] Loading profile data...
📧 [PROFILE] Fetching profile for: user@example.com
✅ [PROFILE] Profile data loaded: {...}

👤 [PROFILE] Starting profile update...
📋 [PROFILE] Form data: {...}
📧 [PROFILE] User email: user@example.com
📊 [PROFILE] Response: {...}
✅ [PROFILE] Profile updated successfully
```

### Backend Logs
```
👤 [PROFILE] Get profile request for: user@example.com
✅ [PROFILE] User found: 1

👤 [PROFILE] Update profile request for: user@example.com
📋 [PROFILE] Update data: {...}
✅ [PROFILE] User found: 1
✅ [PROFILE] User updated successfully
✅ [PROFILE] Donor profile updated
```

## Testing Instructions

### 1. Run Database Migration
```bash
# Run the migration to add address column
npx sequelize-cli db:migrate
```

### 2. Test Profile Loading
1. Sign in to the application
2. Navigate to "Profile" tab
3. Verify all existing data is loaded into the form
4. Check browser console for loading logs

### 3. Test Profile Update
1. Modify any field (e.g., change city)
2. Add an address in the address field
3. Click "Save Changes"
4. Verify success message appears
5. Refresh page and check data persists
6. Check browser console for update logs

### 4. Test Address Field
1. Enter a multi-line address:
   ```
   123 Main Street
   Anna Nagar
   Chennai - 600040
   ```
2. Save changes
3. Reload profile and verify address is preserved with line breaks

### 5. Test Validation
1. Try to set age to 17 (should show error)
2. Try to set age to 61 (should show error)
3. Verify age between 18-60 works correctly

## Features

### ✅ Implemented
- Profile view with all user fields
- Address field (multi-line textarea)
- Auto-load profile data on view
- Update profile functionality
- Success confirmation message
- Case-insensitive email lookup
- Comprehensive logging
- Database migration for address field
- Backend validation
- Donor profile management

### 🎯 Benefits
1. **User Control**: Users can manage their own information
2. **Data Accuracy**: Users can keep their information up-to-date
3. **Better Communication**: Address field enables better coordination
4. **Seamless UX**: Auto-loading of data provides smooth experience
5. **Clear Feedback**: Success messages confirm actions

## Security Considerations

1. **Authentication Required**: Profile updates require logged-in user
2. **Email Validation**: Case-insensitive email matching
3. **Age Validation**: Server-side validation (18-60)
4. **Data Sanitization**: Medical history properly parsed
5. **Error Handling**: Graceful error messages without exposing sensitive data

## Future Enhancements

Potential improvements:
1. Profile picture upload
2. Email verification before update
3. Password change functionality
4. Two-factor authentication
5. Activity log (profile change history)
6. Email notifications on profile changes
7. Address validation/autocomplete
8. Multiple addresses support
9. Emergency contact information
10. Preferred donation locations

## Files Modified

1. `public/index.html` - Profile view UI
2. `public/app.js` - Profile management logic
3. `src/models/User.js` - Added address field
4. `src/routes/auth.js` - Profile GET/PUT endpoints
5. `src/migrations/20260303000001-add-address-to-users.js` - Database migration

## Backward Compatibility

- Original `handleRegistration()` function preserved
- Registration route still accepts address field
- Existing users without address will show empty field
- No breaking changes to existing functionality
