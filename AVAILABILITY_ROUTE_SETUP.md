# Donor Availability Route Setup

## ✅ Backend Route Created

The backend route has been successfully added to handle donor availability updates.

### File Location
**`src/routes/donors.js`** (Line 27)

### Route Details
```javascript
router.put('/:identifier/availability', async (req, res) => { ... })
```

### Full URL
```
PUT http://localhost:3000/api/donors/:identifier/availability
```

Where `:identifier` can be either:
- An email address (e.g., `rathigurunathan17@gmail.com`)
- A numeric donor ID (e.g., `123`)

### Request Body
```json
{
  "is_available": true,
  "latitude": 13.0827,
  "longitude": 80.2707
}
```

### What the Route Does

1. **Accepts email or numeric ID** - Automatically detects if the identifier is an email (contains `@`)

2. **Email-based lookup**:
   - Finds the User by email
   - Checks if user has a donorProfile
   - Creates a new donor profile if one doesn't exist
   - Returns 404 if user email not found

3. **Updates the donor record**:
   - Sets `is_available` to true/false
   - Updates location using `setLocation(longitude, latitude)`
   - Updates `location_updated_at` timestamp
   - Saves to database

4. **Returns success response**:
```json
{
  "message": "Availability updated successfully",
  "donor": {
    "id": 1,
    "user_id": 5,
    "is_available": true,
    "location_updated_at": "2026-03-02T10:30:00.000Z"
  }
}
```

## Route Registration

The route is already registered in **`src/index.js`** (Line 68):
```javascript
app.use('/api/donors', donorRoutes);
```

This means all routes in `src/routes/donors.js` are accessible at `/api/donors/*`

## 🔄 IMPORTANT: Restart Your Server

After adding this route, you MUST restart your Node.js server for the changes to take effect:

```bash
# Stop the server (Ctrl+C in the terminal)
# Then restart it:
npm start
# or
node src/index.js
```

## Testing the Route

You can test the route using curl:

```bash
curl -X PUT http://localhost:3000/api/donors/rathigurunathan17@gmail.com/availability \
  -H "Content-Type: application/json" \
  -d '{
    "is_available": true,
    "latitude": 13.0827,
    "longitude": 80.2707
  }'
```

## Troubleshooting

If you still get a 404 error:

1. **Check if the server is running**: Open http://localhost:3000/api/health
2. **Verify the route file exists**: Check that `src/routes/donors.js` contains the availability route
3. **Check server logs**: Look for any error messages when the server starts
4. **Restart the server**: Make sure you've restarted after adding the route
5. **Check the URL**: Ensure you're using the correct URL format with the email

## Console Logs

When the route is called, you'll see detailed logs in the server console:

```
📍 [AVAILABILITY] Updating donor availability: { identifier: 'rathigurunathan17@gmail.com', is_available: true, latitude: 13.0827, longitude: 80.2707 }
📍 [AVAILABILITY] Identifier type: email
📍 [AVAILABILITY] Looking up user by email: rathigurunathan17@gmail.com
✅ [AVAILABILITY] User found: 5
✅ [AVAILABILITY] Existing donor profile found: 1
📍 [AVAILABILITY] Setting is_available to: true
📍 [AVAILABILITY] Updating location: { latitude: 13.0827, longitude: 80.2707 }
✅ [AVAILABILITY] Donor availability updated successfully: { id: 1, is_available: true, location_updated_at: 2026-03-02T10:30:00.000Z }
```
