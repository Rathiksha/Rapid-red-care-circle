# Availability Update - Testing Checklist

## Pre-Testing Setup

- [ ] Backend server is running (`npm start` or `node src/index.js`)
- [ ] Browser console is open (F12 or Cmd+Option+I)
- [ ] Terminal with backend logs is visible

## Test Scenario 1: New User Registration

### Steps:
1. [ ] Clear browser data:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. [ ] Register a new user with:
   - Full Name: Test User
   - Email: testuser@example.com
   - Blood Group: O+
   - All other required fields

3. [ ] Check console for:
   - [ ] `✅ [REGISTRATION] Email stored: testuser@example.com`
   - [ ] `✅ [REGISTRATION] User data stored in localStorage`

4. [ ] Check backend logs for:
   - [ ] User created successfully
   - [ ] Donor profile created

## Test Scenario 2: Sign In

### Steps:
1. [ ] Sign in with registered email and password

2. [ ] Check console for:
   - [ ] `✅ [SIGN IN] Email stored: testuser@example.com`
   - [ ] `✅ [SIGN IN] Saved to localStorage`

3. [ ] Verify dashboard loads

## Test Scenario 3: Eligibility Questionnaire & Availability Update

### Steps:
1. [ ] Navigate to "Donate Blood" tab

2. [ ] Click "Check Eligibility" button

3. [ ] Answer all questions correctly (all YES)

4. [ ] Click "Proceed to Live Map" button

5. [ ] Allow location access when prompted

### Expected Frontend Console Logs:
```
🗺️ [LIVE MAP] ========================================
🗺️ [LIVE MAP] Proceeding to live map...
✅ [LIVE MAP] Using email: testuser@example.com
📍 [LIVE MAP] Location obtained:
   - Latitude: XX.XXXX
   - Longitude: XX.XXXX
📦 [LIVE MAP] ========================================
📦 [LIVE MAP] Preparing API request
📦 [LIVE MAP] Raw email: testuser@example.com
📦 [LIVE MAP] API URL: /api/donors/testuser%40example.com/availability
🚀 [LIVE MAP] Sending PUT request...
📡 [LIVE MAP] ========================================
📡 [LIVE MAP] Response received
📡 [LIVE MAP] Status: 200 OK
✅ [LIVE MAP] SUCCESS! Availability updated
✅ [LIVE MAP] ========================================
```

### Expected Backend Console Logs:
```
📍 [AVAILABILITY] ========================================
📍 [AVAILABILITY] Updating donor availability
📍 [AVAILABILITY] Received identifier: testuser@example.com
📍 [AVAILABILITY] Identifier type: EMAIL
📍 [AVAILABILITY] Searching for user with email (lowercase): testuser@example.com
📊 [AVAILABILITY] All users in database: 1
   - User ID X: testuser@example.com (Test User)
✅ [AVAILABILITY] User FOUND!
✅ [AVAILABILITY] User ID: X
✅ [AVAILABILITY] User Email: testuser@example.com
✅ [AVAILABILITY] Donor ID: X
💾 [AVAILABILITY] Saving user record...
✅ [AVAILABILITY] User saved successfully
💾 [AVAILABILITY] Saving donor record...
✅ [AVAILABILITY] Donor saved successfully
✅ [AVAILABILITY] SUCCESS! Availability updated
✅ [AVAILABILITY] ========================================
```

### Expected UI Behavior:
- [ ] Eligibility modal closes
- [ ] Toast message appears: "🎉 You are now available to donate! Navigating to Find Donor map..."
- [ ] Request (Find Donor) view loads (not the Live Map view)
- [ ] User location marker appears on map
- [ ] Map is centered on user's location

## Test Scenario 4: Error Handling - User Not Found

### Steps:
1. [ ] Manually modify localStorage to use wrong email:
   ```javascript
   let user = JSON.parse(localStorage.getItem('rapidRedUser'));
   user.email = 'wrong@example.com';
   localStorage.setItem('rapidRedUser', JSON.stringify(user));
   location.reload();
   ```

2. [ ] Try to proceed to live map

3. [ ] Check console for:
   - [ ] `❌ [AVAILABILITY] User NOT FOUND with email: wrong@example.com`
   - [ ] List of available emails in database

4. [ ] Verify error alert appears with helpful message

## Test Scenario 5: Case Insensitive Email

### Steps:
1. [ ] Register user with email: `TestUser@Example.COM`

2. [ ] Sign in with lowercase: `testuser@example.com`

3. [ ] Complete eligibility and proceed to map

4. [ ] Verify it works (case-insensitive lookup)

## Test Scenario 6: Email with Special Characters

### Steps:
1. [ ] Register user with email: `test.user+tag@example.com`

2. [ ] Complete eligibility and proceed to map

3. [ ] Check that email is properly URL-encoded in API call

4. [ ] Verify it works

## Troubleshooting Guide

### Issue: "Failed to update your availability"

**Check:**
1. [ ] Frontend console shows email being sent
2. [ ] Backend console shows email being received
3. [ ] Backend shows list of users in database
4. [ ] Email matches exactly (check for spaces, case, typos)

**If email is missing from currentUser:**
1. [ ] Check sign-in logs for Cognito attributes
2. [ ] Verify email is stored in localStorage
3. [ ] Check if Cognito fallback is triggered

**If user not found in database:**
1. [ ] Verify user was created during registration
2. [ ] Check backend registration logs
3. [ ] Query database directly to confirm user exists

### Issue: Location permission denied

**Check:**
1. [ ] Browser location permissions are enabled
2. [ ] HTTPS is being used (or localhost)
3. [ ] Console shows geolocation error code

### Issue: Map doesn't load

**Check:**
1. [ ] Console shows "Navigating to request (Find Donor) view"
2. [ ] Map initialization logs appear
3. [ ] No JavaScript errors in console

## Success Criteria

✅ All test scenarios pass
✅ Console logs are clear and helpful
✅ Error messages are user-friendly
✅ Request (Find Donor) view loads after eligibility check
✅ Map loads with user location marker
✅ No JavaScript errors in console
✅ Backend responds with 200 OK
✅ User is marked as available in database

## Notes

- Keep browser console open during all tests
- Keep backend terminal visible for server logs
- Take screenshots of any errors
- Document any unexpected behavior
