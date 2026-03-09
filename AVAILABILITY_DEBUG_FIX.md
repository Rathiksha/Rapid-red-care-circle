# Availability Update Debug & Fix

## Problem
Users were getting "Failed to update your availability" error when clicking "Proceed to Live Map" after passing the Donor Eligibility Questionnaire.

## Root Cause Analysis
The issue was likely due to:
1. Email not being properly retrieved from the logged-in user session
2. Case-sensitive email comparison in the database lookup
3. Insufficient logging to debug the issue

## Changes Made

### Backend Changes (src/routes/donors.js)

#### 1. Enhanced Logging
- Added comprehensive logging with clear separators (========)
- Logs all users in database when lookup fails
- Shows exact email being searched (lowercase)
- Displays all available emails in DB for comparison
- Detailed success/failure messages with all relevant data

#### 2. Case-Insensitive Email Lookup
```javascript
// Before: Case-sensitive lookup
user = await db.User.findOne({
  where: { email: identifier }
});

// After: Case-insensitive lookup using Sequelize.fn
const emailLower = identifier.toLowerCase().trim();
user = await db.User.findOne({
  where: db.Sequelize.where(
    db.Sequelize.fn('LOWER', db.Sequelize.col('email')),
    emailLower
  )
});
```

#### 3. Debug Information in Error Response
When user is not found, the response now includes:
- Error message
- Details about what was searched
- List of all available emails in the database

### Frontend Changes (public/app.js)

#### 1. Enhanced Email Retrieval
- Added fallback to retrieve email from Cognito session if not in currentUser
- Comprehensive logging of email detection process
- Shows email source (currentUser.email vs currentUser.userId)

#### 2. Cognito Session Fallback
```javascript
// If no email in currentUser, fetch from Cognito
const cognitoUser = userPool.getCurrentUser();
if (cognitoUser) {
  // Get session and user attributes
  // Extract email and update currentUser
}
```

#### 3. Comprehensive Logging
Added detailed console logs for:
- User object inspection
- Email detection and validation
- API request preparation (raw, trimmed, encoded email)
- Response handling (status, headers, body)
- Error details with all available information

#### 4. Sign-In Enhancement
Added logging to track email storage during sign-in:
- Cognito attributes map
- Email extraction from attributes
- currentUser object creation
- localStorage storage confirmation

#### 5. Registration Enhancement
Added logging to track email storage during registration:
- currentUser object details
- Email confirmation
- User ID confirmation

## Testing Instructions

### 1. Clear Browser Data
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 2. Register New User
1. Fill out registration form with valid email
2. Check console for:
   - `✅ [REGISTRATION] Email stored: your@email.com`
   - `✅ [REGISTRATION] User data stored in localStorage`

### 3. Sign In
1. Sign in with registered email
2. Check console for:
   - `✅ [SIGN IN] Email stored: your@email.com`
   - `✅ [SIGN IN] Saved to localStorage`

### 4. Complete Eligibility Questionnaire
1. Navigate to "Donate Blood"
2. Click "Check Eligibility"
3. Answer all questions correctly
4. Click "Proceed to Live Map"

### 5. Monitor Console Logs

#### Frontend Logs to Watch:
```
🗺️ [LIVE MAP] ========================================
🗺️ [LIVE MAP] Proceeding to live map...
🗺️ [LIVE MAP] Current user object: {...}
✅ [LIVE MAP] Using email: your@email.com
📍 [LIVE MAP] Location obtained: {...}
📦 [LIVE MAP] Preparing API request
📦 [LIVE MAP] Raw email: your@email.com
📦 [LIVE MAP] API URL: /api/donors/your%40email.com/availability
🚀 [LIVE MAP] Sending PUT request...
📡 [LIVE MAP] Response received
📡 [LIVE MAP] Status: 200 OK
✅ [LIVE MAP] SUCCESS! Availability updated
🗺️ [LIVE MAP] Navigating to request (Find Donor) view...
✅ [LIVE MAP] Navigation to Find Donor view complete
```

#### Backend Logs to Watch:
```
📍 [AVAILABILITY] ========================================
📍 [AVAILABILITY] Updating donor availability
📍 [AVAILABILITY] Received identifier: your@email.com
📍 [AVAILABILITY] Identifier type: EMAIL
📍 [AVAILABILITY] Searching for user with email (lowercase): your@email.com
📊 [AVAILABILITY] All users in database: 1
   - User ID 1: your@email.com (Your Name)
✅ [AVAILABILITY] User FOUND!
✅ [AVAILABILITY] User ID: 1
✅ [AVAILABILITY] User Email: your@email.com
✅ [AVAILABILITY] Existing donor profile found: 1
💾 [AVAILABILITY] Saving user record...
✅ [AVAILABILITY] User saved successfully
💾 [AVAILABILITY] Saving donor record...
✅ [AVAILABILITY] Donor saved successfully
✅ [AVAILABILITY] SUCCESS! Availability updated
```

### 6. Verify Success
- Modal should close
- Toast message: "🎉 You are now available to donate! Navigating to Find Donor map..."
- Request (Find Donor) view should load (not the Live Map view)
- User location marker should appear on map
- Map should be centered on user's location

## Troubleshooting

### If User Not Found Error Occurs:

1. Check frontend console for email being sent:
   ```
   📦 [LIVE MAP] Raw email: ???
   ```

2. Check backend console for:
   ```
   📊 [AVAILABILITY] All users in database: X
      - User ID 1: email1@example.com (Name 1)
      - User ID 2: email2@example.com (Name 2)
   ```

3. Compare the emails:
   - Are they exactly the same?
   - Check for extra spaces
   - Check for case differences
   - Check for typos

### If Email is Missing from currentUser:

1. Check sign-in logs:
   ```
   📋 [SIGN IN] Email from attributes: ???
   ```

2. If email is undefined, check Cognito user attributes in AWS Console

3. The code now has a fallback to retrieve from Cognito session

## Key Improvements

1. **Case-Insensitive Lookup**: Handles email case variations
2. **Comprehensive Logging**: Easy to identify exact failure point
3. **Email Fallback**: Retrieves from Cognito if not in currentUser
4. **Debug Information**: Shows all available emails when lookup fails
5. **Clear Error Messages**: User-friendly error messages with console details

## Files Modified

1. `src/routes/donors.js` - Backend availability update route
2. `public/app.js` - Frontend proceedToLiveMap function and auth handlers

## Next Steps

If issues persist after these changes:
1. Check the console logs (both frontend and backend)
2. Verify the email in the database matches the Cognito email
3. Ensure the user has a donor profile created
4. Check that the backend server is running and accessible
