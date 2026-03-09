# Real-Time Blood Request Notification System

## Overview
Implemented a complete real-time notification system using Socket.io that broadcasts blood requests to all connected users with color-coded urgency levels.

## Features Implemented

### 1. Backend (Socket.io Server)
- **File**: `src/index.js`
- Integrated Socket.io with Express server
- Real-time WebSocket connections for all clients
- User identification system for tracking connected users

### 2. Notification Broadcasting
- **File**: `src/routes/requests.js`
- When a blood request is created, it broadcasts to all connected clients
- Includes: blood group, urgency band, location/area, timestamp
- Excludes the requester from receiving their own notification

### 3. Frontend Notification System
- **Files**: `public/index.html`, `public/app.js`
- Socket.io client connection on page load
- Real-time listener for `bloodRequestNotification` events
- Automatic notification display with proper color coding

### 4. Visual Design (Color Bands)

#### RED (Immediate/Emergency)
- Background: `#FF0000` (Pure Red)
- Border: `#CC0000` (Dark Red)
- Text: White
- Message: "URGENT REQUIRE OF BLOOD - [Location]"
- Icon: 🩸 (pulsing animation)

#### PINK (Within 24 Hours)
- Background: `#FFC0CB` (Pink)
- Border: `#FFB6C1` (Light Pink)
- Text: Dark Red (`#8B0000`)
- Message: "BLOOD NEEDED WITHIN 24 HOURS - [Location]"

#### WHITE (After 24 Hours)
- Background: `#FFFFFF` (White)
- Border: `#E5E7EB` (Gray)
- Text: Dark Gray (`#1F2937`)
- Message: "BLOOD REQUEST - AFTER 24 HOURS - [Location]"

### 5. Debug/Simulate Tool
Located in the "Request Blood" view with three test buttons:
- 🚨 RED (Immediate) - Tests red notification
- ⏰ PINK (24 Hours) - Tests pink notification
- 📅 WHITE (After 24h) - Tests white notification

Each button triggers a mock notification with random blood group and location.

## How It Works

### Flow Diagram
```
User Submits Request
    ↓
Backend Creates Request
    ↓
Socket.io Broadcasts to All Clients
    ↓
Frontend Receives Event
    ↓
Notification Toast Appears (Color-Coded)
    ↓
Auto-Dismisses After 10 Seconds
```

### Technical Implementation

1. **Connection**: Client connects to Socket.io server on page load
2. **Identification**: User ID is sent to server for tracking
3. **Broadcasting**: Server emits `bloodRequestNotification` event to all clients
4. **Display**: Frontend shows color-coded toast notification
5. **Auto-Dismiss**: Notification disappears after 10 seconds (or manual close)

## Testing Instructions

### Method 1: Use Debug Buttons (Recommended)
1. Navigate to "Request Blood" view
2. Click any of the three colored buttons in the debug section
3. Observe the notification appearing in the top-right corner
4. Test all three colors to verify styling

### Method 2: Submit Real Request
1. Fill out the "Request Blood" form
2. Select urgency level (Immediate/24 Hours/After 24h)
3. Enter location/area
4. Click "Find Donors Now"
5. All other connected users will receive the notification

### Method 3: Multiple Browser Windows
1. Open the app in 2+ browser windows
2. Submit a request in one window
3. See the notification appear in all other windows
4. Verify real-time broadcasting works

## API Endpoints

### POST /api/requests
Creates a new blood request and broadcasts notification

**Request Body**:
```json
{
  "requesterId": 1,
  "bloodGroup": "O+",
  "requiredTimeframe": "immediate",
  "area": "Anna Nagar",
  "latitude": 13.0850,
  "longitude": 80.2100,
  "hospitalName": "Apollo Hospital"
}
```

**Response**:
```json
{
  "message": "Blood request created successfully",
  "request": {
    "id": 123,
    "urgencyBand": "RED",
    "emergencyWarning": true,
    "status": "PENDING"
  }
}
```

## Socket.io Events

### Client → Server
- `identify`: Send user ID for tracking
  ```javascript
  socket.emit('identify', userId);
  ```

### Server → Client
- `bloodRequestNotification`: Broadcast new blood request
  ```javascript
  {
    requestId: 123,
    bloodGroup: "O+",
    urgencyBand: "RED",
    area: "Anna Nagar",
    requiredTimeframe: "immediate",
    emergencyWarning: true,
    timestamp: "2024-02-15T10:30:00.000Z"
  }
  ```

## Notification Toast Features

- **Position**: Fixed top-right corner
- **Animation**: Slide in from right with smooth easing
- **Duration**: 10 seconds auto-dismiss
- **Manual Close**: X button in top-right of toast
- **Responsive**: Adapts to mobile screens
- **Pulsing Icon**: Blood drop emoji with pulse animation
- **Sound**: Can be added in future (currently visual only)

## Future Enhancements

1. **Sound Alerts**: Add audio notification for urgent requests
2. **Push Notifications**: Browser push API for background notifications
3. **Notification History**: Log of all received notifications
4. **User Preferences**: Allow users to filter by blood group or location
5. **Acknowledgment**: Track which users saw the notification
6. **Priority Queue**: Show most urgent notifications first
7. **Geolocation Filter**: Only notify users within X km radius

## Troubleshooting

### Notifications Not Appearing
1. Check browser console for Socket.io connection errors
2. Verify server is running on port 3000
3. Check if Socket.io CDN is loading (network tab)
4. Ensure no ad blockers are blocking WebSocket connections

### Wrong Colors Showing
1. Verify urgency band mapping in `showNotification()` function
2. Check CSS classes are applied correctly
3. Inspect element to see which class is active

### Multiple Notifications
1. Check if multiple Socket.io connections are being created
2. Ensure `initializeSocket()` is only called once
3. Verify no duplicate event listeners

## Files Modified

1. `src/index.js` - Added Socket.io server integration
2. `src/routes/requests.js` - Added notification broadcasting
3. `public/index.html` - Added notification toast HTML and CSS
4. `public/app.js` - Added Socket.io client and notification logic

## Dependencies

- `socket.io` (v4.6.1) - Server-side WebSocket library
- `socket.io-client` (CDN) - Client-side WebSocket library

All dependencies are already installed in package.json.
