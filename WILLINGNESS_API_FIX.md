# Willingness API Fix

## Issue
The willingness confirmation API was returning HTML instead of JSON, causing:
```
Uncaught SyntaxError: Unexpected token '<', "<!DOCTYPE"... is not valid JSON
```

## Root Causes
1. The response wasn't explicitly setting the `Content-Type: application/json` header
2. Potential URL mismatch between frontend and backend endpoints

## Fixes Applied

### 1. Explicit Content-Type Headers (src/routes/donors.js)

Added explicit `Content-Type` header to all responses in the `/willingness` endpoint:

```javascript
// Success response
res.setHeader('Content-Type', 'application/json');
res.status(200).json({
  message: 'Willingness confirmed successfully',
  donor: { ... }
});

// Error responses
res.setHeader('Content-Type', 'application/json');
res.status(400).json({ error: 'Email is required' });

res.setHeader('Content-Type', 'application/json');
res.status(404).json({ error: 'User not found' });

res.setHeader('Content-Type', 'application/json');
res.status(500).json({ 
  error: 'Failed to confirm willingness', 
  message: error.message 
});
```

### 2. Added Alias Routes for Backward Compatibility

**In src/routes/donors.js:**
```javascript
// Alias route for backward compatibility
router.post('/confirm-willingness', async (req, res) => {
  console.log('⚠️ [WILLINGNESS] Using deprecated /confirm-willingness endpoint');
  console.log('⚠️ [WILLINGNESS] Redirecting to /willingness');
  
  // Forward to the main willingness handler
  req.url = '/willingness';
  return router.handle(req, res);
});
```

**In src/index.js:**
```javascript
// API Routes
app.use('/api/donors', donorRoutes);
app.use('/api/donor', donorRoutes); // Alias for backward compatibility (singular)
```

## Supported Endpoints

All of these endpoints now work and return JSON:

1. **POST /api/donors/willingness** (Primary)
2. **POST /api/donors/confirm-willingness** (Alias)
3. **POST /api/donor/willingness** (Alias - singular)
4. **POST /api/donor/confirm-willingness** (Alias - singular)

## Endpoint Details

### POST /api/donors/willingness (Primary)

**URL**: `http://localhost:3000/api/donors/willingness`

**Method**: POST

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "isWilling": true,
  "passedEligibility": true
}
```

**Success Response** (200 OK):
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

400 Bad Request:
```json
{
  "error": "Email is required"
}
```

404 Not Found:
```json
{
  "error": "User not found"
}
```

500 Internal Server Error:
```json
{
  "error": "Failed to confirm willingness",
  "message": "Detailed error message"
}
```

## Testing

### Using cURL:
```bash
# Primary endpoint
curl -X POST http://localhost:3000/api/donors/willingness \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "isWilling": true,
    "passedEligibility": true
  }'

# Alias endpoint (singular)
curl -X POST http://localhost:3000/api/donor/confirm-willingness \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "isWilling": true,
    "passedEligibility": true
  }'
```

### Using Browser Console:
```javascript
// Primary endpoint
fetch('/api/donors/willingness', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    isWilling: true,
    passedEligibility: true
  })
})
.then(res => {
  console.log('Response status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
  return res.json();
})
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

### Expected Console Logs (Backend):
```
💚 [WILLINGNESS] ========================================
💚 [WILLINGNESS] Willingness confirmation request
📧 [WILLINGNESS] Email: test@example.com
💚 [WILLINGNESS] Is Willing: true
✅ [WILLINGNESS] Passed Eligibility: true
✅ [WILLINGNESS] User found: 1
✅ [WILLINGNESS] Updated successfully
💚 [WILLINGNESS] Donor ID: 1
💚 [WILLINGNESS] Is Willing: true
💚 [WILLINGNESS] Passed Eligibility: true
💚 [WILLINGNESS] ========================================
```

## Verification Steps

1. **Restart the server** to load the updated code:
   ```bash
   npm start
   ```

2. **Test the endpoint** using one of the methods above

3. **Verify response headers**:
   - Open browser DevTools
   - Go to Network tab
   - Make the request
   - Check Response Headers for `Content-Type: application/json`
   - Verify status code is 200, 400, 404, or 500 (not 404 HTML page)

4. **Verify response body**:
   - Should be valid JSON
   - Should match the expected structure
   - No HTML tags or error pages
   - No `<!DOCTYPE` or `<html>` tags

## Frontend Integration

The frontend code in `public/app.js` calls this endpoint:

```javascript
const response = await fetch('/api/donors/willingness', {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: userEmail,
        isWilling: true,
        passedEligibility: true
    })
});

const data = await response.json();
```

No changes needed to the frontend code - it's already using the correct endpoint.

## Error Prevention

### All Response Paths Return JSON:

1. ✅ **Success path**: `res.json({ message: '...', donor: {...} })`
2. ✅ **Email missing**: `res.status(400).json({ error: 'Email is required' })`
3. ✅ **User not found**: `res.status(404).json({ error: 'User not found' })`
4. ✅ **Server error**: `res.status(500).json({ error: '...', message: '...' })`

### Content-Type Header:

Every response explicitly sets:
```javascript
res.setHeader('Content-Type', 'application/json');
```

This ensures the browser knows to parse the response as JSON, not HTML.

## Additional Notes

- The endpoint is registered in `src/index.js` as `/api/donors` and `/api/donor`
- Full paths supported:
  - `/api/donors/willingness` (primary)
  - `/api/donors/confirm-willingness` (alias)
  - `/api/donor/willingness` (alias)
  - `/api/donor/confirm-willingness` (alias)
- Method: POST only
- Requires valid email in request body
- Creates donor profile if it doesn't exist
- Updates user's `is_active` status
- Sets location from profile address

## Files Modified

1. `src/routes/donors.js` - Added explicit Content-Type headers and alias route
2. `src/index.js` - Added `/api/donor` alias for backward compatibility

## No Changes Made To

- UI/Frontend code
- Flow or user experience
- Request/response structure
- Database schema
