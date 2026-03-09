# Hospital Discovery & Blood Inventory Feature

## Overview
Expand "Find Donor" into a dual-purpose "Find Donor/Hospital" module with real-time blood inventory tracking and smart hospital recommendations.

## Feature Components

### 1. Navigation & UI Changes
- Rename "Find Donor" → "Find Donor/Hospital"
- Add toggle switch: "Donors" | "Hospitals"
- Maintain existing donor map functionality
- Add new hospital map view with inventory overlay

### 2. Hospital Discovery Features
- **Geolocation**: Auto-fetch user's current location
- **Map Markers**: Display hospitals within configurable radius (default 20km)
- **Information Overlay**: Bottom sheet/modal with:
  - Hospital name, address, distance
  - Live blood inventory (units per blood group)
  - Last updated timestamp
  - "Contact Now" button with phone integration
  
### 3. Smart Priority Algorithm
Rank hospitals by weighted score:
- **Blood Availability** (40%): Has required blood type in stock
- **Proximity** (35%): Distance from user location
- **Service Rating** (15%): Hospital quality score
- **Inventory Freshness** (10%): How recently inventory was updated

### 4. Technical Implementation

#### Backend APIs
- `GET /api/hospitals/nearby` - Get hospitals within radius
- `GET /api/hospitals/:id/inventory` - Get blood inventory for specific hospital
- `PUT /api/hospitals/:id/inventory` - Update blood inventory (admin)
- `GET /api/hospitals/search` - Search with smart priority ranking

#### Frontend Components
- Toggle switch component
- Hospital marker component (different from donor markers)
- Hospital detail modal/bottom sheet
- Blood inventory display grid
- Contact/navigation buttons

#### Map Integration
- Use Leaflet (current) or upgrade to Mapbox/Google Maps
- Custom hospital markers (hospital icon)
- Cluster markers when zoomed out
- Route drawing from user to selected hospital

### 5. Data Model Enhancements
- Add fields to HospitalBloodBank:
  - `address` (TEXT)
  - `emergency_contact` (STRING)
  - `service_rating` (DECIMAL)
  - `is_active` (BOOLEAN)
  - `operating_hours` (JSON)
  - `blood_availability` structure:
    ```json
    {
      "A+": { "units": 15, "updated_at": "2026-03-06T10:30:00Z" },
      "B+": { "units": 8, "updated_at": "2026-03-06T10:30:00Z" },
      "O+": { "units": 22, "updated_at": "2026-03-06T10:30:00Z" }
    }
    ```

### 6. Edge Cases & Error Handling
- GPS disabled: Show manual location input
- No hospitals nearby: Expand search radius
- Stale inventory data: Show warning if >24 hours old
- No blood available: Show "Out of Stock" clearly
- Network errors: Cache last known data

## Implementation Phases

### Phase 1: Backend Foundation
1. Create migration for hospital enhancements
2. Update HospitalBloodBank model
3. Create hospital routes and controllers
4. Implement smart ranking algorithm
5. Add seed data for testing

### Phase 2: Frontend UI
1. Update navigation labels
2. Create toggle switch component
3. Duplicate map view for hospitals
4. Create hospital marker icons
5. Build hospital detail modal

### Phase 3: Integration
1. Connect frontend to hospital APIs
2. Implement geolocation
3. Add distance calculation
4. Integrate contact buttons
5. Add route drawing

### Phase 4: Polish & Testing
1. Add loading states
2. Error handling
3. Responsive design
4. Performance optimization
5. End-to-end testing

## Files to Create/Modify

### New Files
- `src/routes/hospitals.js` - Hospital API routes
- `src/services/hospitalService.js` - Hospital business logic
- `src/migrations/YYYYMMDD-enhance-hospitals.js` - Database migration
- `public/components/hospital-toggle.js` - Toggle component (if separating)

### Modified Files
- `public/index.html` - Add toggle UI, hospital modal
- `public/app.js` - Add hospital map logic
- `src/models/HospitalBloodBank.js` - Enhance model
- `src/index.js` - Register hospital routes

## API Specifications

### GET /api/hospitals/nearby
**Query Parameters:**
- `latitude` (required): User's latitude
- `longitude` (required): User's longitude
- `radius` (optional): Search radius in km (default: 20)
- `bloodGroup` (optional): Filter by blood availability

**Response:**
```json
{
  "hospitals": [
    {
      "id": 1,
      "name": "Apollo Hospital",
      "address": "123 Main St, Chennai",
      "distance": 2.5,
      "coordinates": { "lat": 13.0827, "lng": 80.2707 },
      "contact": "+91-44-12345678",
      "serviceRating": 4.5,
      "bloodAvailability": {
        "A+": { "units": 15, "updatedAt": "2026-03-06T10:30:00Z" },
        "O+": { "units": 22, "updatedAt": "2026-03-06T10:30:00Z" }
      },
      "priorityScore": 85.5
    }
  ],
  "summary": {
    "total": 5,
    "withBlood": 3,
    "averageDistance": 5.2
  }
}
```

### GET /api/hospitals/search
**Query Parameters:**
- `latitude` (required)
- `longitude` (required)
- `bloodGroup` (required): Blood type needed
- `urgency` (optional): "emergency" | "routine"

**Response:** Same as nearby, but sorted by priority score

## UI/UX Specifications

### Toggle Switch Design
```
┌─────────────────────────────┐
│  [Donors]  |  [Hospitals]   │
└─────────────────────────────┘
```
- Active tab: Red background, white text
- Inactive tab: White background, gray text
- Smooth transition animation

### Hospital Marker
- Icon: Hospital cross symbol (⚕️)
- Color: Blue (to differentiate from donor markers)
- Cluster: Show count when multiple hospitals nearby

### Hospital Detail Modal
```
┌─────────────────────────────────────┐
│ Apollo Hospital              [×]    │
│ 123 Main St, Chennai                │
│ 📍 2.5 km away • ⭐ 4.5/5          │
├─────────────────────────────────────┤
│ Blood Availability                  │
│ ┌─────┬─────┬─────┬─────┐          │
│ │ A+  │ B+  │ AB+ │ O+  │          │
│ │ 15  │ 8   │ 5   │ 22  │          │
│ └─────┴─────┴─────┴─────┘          │
│ ┌─────┬─────┬─────┬─────┐          │
│ │ A-  │ B-  │ AB- │ O-  │          │
│ │ 3   │ 0   │ 2   │ 7   │          │
│ └─────┴─────┴─────┴─────┘          │
│                                     │
│ Last Updated: 2 hours ago           │
├─────────────────────────────────────┤
│ [📞 Contact Now] [🗺️ Navigate]    │
└─────────────────────────────────────┘
```

## Success Metrics
- Hospital data loads within 2 seconds
- Accurate distance calculations (±100m)
- Inventory data freshness indicator
- Smooth toggle transition (<300ms)
- Mobile-responsive design
- Accessible to screen readers

## Future Enhancements
- Real-time inventory updates via WebSocket
- Hospital admin portal for inventory management
- Traffic-based ETA calculation
- Ambulance routing optimization
- Hospital capacity indicators
- Appointment booking integration
