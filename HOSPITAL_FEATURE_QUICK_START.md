# Hospital Discovery Feature - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Run Migration
```bash
npm run migrate
```

Expected output:
```
== 20260306000001-enhance-hospital-blood-banks: migrating =======
== 20260306000001-enhance-hospital-blood-banks: migrated (0.XXXs)
```

### Step 2: Seed Hospital Data
```bash
npm run seed:hospitals
```

Expected output:
```
✅ Created: Apollo Hospital Chennai
✅ Created: Fortis Malar Hospital
✅ Created: MIOT International Hospital
✅ Created: Kauvery Hospital Chennai
✅ Created: Gleneagles Global Health City

✅ Hospital seeding completed!
   Created: 5 hospitals
```

### Step 3: Start Server & Test
```bash
npm start
```

Then test the API:
```bash
# Get nearby hospitals
curl "http://localhost:3000/api/hospitals/nearby?latitude=13.0827&longitude=80.2707&radius=20"

# Smart search for O+ blood
curl "http://localhost:3000/api/hospitals/search?latitude=13.0827&longitude=80.2707&bloodGroup=O%2B"
```

## ✅ What's Implemented

### Backend (Complete)
- ✅ Database schema enhanced
- ✅ Smart priority algorithm (40% availability, 35% proximity, 15% rating, 10% freshness)
- ✅ REST API endpoints
- ✅ 5 sample hospitals with full blood inventory
- ✅ Distance calculation
- ✅ Inventory staleness detection

### Frontend (To Be Implemented)
See `FRONTEND_HOSPITAL_IMPLEMENTATION.md` for detailed guide.

## 📊 Sample API Responses

### Nearby Hospitals
```json
{
  "hospitals": [
    {
      "id": 1,
      "name": "Apollo Hospital Chennai",
      "distance": 2.8,
      "serviceRating": 4.7,
      "priorityScore": 87.5,
      "bloodAvailability": {
        "O+": { "units": 22, "updated_at": "2026-03-06T..." }
      }
    }
  ],
  "summary": {
    "total": 5,
    "withBlood": 5,
    "averageDistance": 8.4
  }
}
```

## 🎯 Key Features

1. **Smart Ranking** - Hospitals ranked by availability, distance, rating, and data freshness
2. **Real-time Inventory** - Blood units per type with last updated timestamp
3. **Distance Calculation** - Accurate Haversine formula
4. **Flexible Search** - Filter by blood group, radius, urgency
5. **Stale Data Detection** - Warns if inventory >24 hours old

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hospitals/nearby` | Get hospitals within radius |
| GET | `/api/hospitals/search` | Smart search with priority |
| GET | `/api/hospitals/:id` | Get hospital details |
| GET | `/api/hospitals/:id/inventory` | Get blood inventory |
| PUT | `/api/hospitals/:id/inventory` | Update inventory |
| GET | `/api/hospitals` | Get all hospitals |

## 🔧 Configuration

### Change Search Radius
Edit `src/services/hospitalService.js`:
```javascript
async function findNearbyHospitals(latitude, longitude, radius = 20, ...)
// Change 20 to your preferred default radius in km
```

### Adjust Priority Weights
Edit `calculatePriorityScore()` in `src/services/hospitalService.js`:
```javascript
// Blood Availability: 40 points
// Proximity: 35 points
// Service Rating: 15 points
// Inventory Freshness: 10 points
```

## 📚 Documentation

- `HOSPITAL_DISCOVERY_FEATURE.md` - Complete feature specification
- `FRONTEND_HOSPITAL_IMPLEMENTATION.md` - Frontend implementation guide
- `HOSPITAL_FEATURE_IMPLEMENTATION_SUMMARY.md` - Detailed summary

## 🆘 Troubleshooting

**Migration fails?**
```bash
npm run migrate:status  # Check status
npm run migrate:undo    # Undo if needed
npm run migrate         # Run again
```

**No hospitals returned?**
- Check if seed data ran successfully
- Verify coordinates are correct (Chennai: 13.0827, 80.2707)
- Increase search radius parameter

**Inventory shows 0 units?**
- Re-run seed script: `npm run seed:hospitals`
- Check `blood_availability` field in database

## ✨ Next: Implement Frontend

Follow the guide in `FRONTEND_HOSPITAL_IMPLEMENTATION.md` to:
1. Add toggle switch (Donors | Hospitals)
2. Create hospital map view
3. Add hospital detail modal
4. Display blood inventory grid
5. Implement contact/navigate buttons

## 🎉 Success!

Backend is complete and ready. The API is fully functional and can be tested immediately. Frontend implementation will connect to these endpoints to provide the user interface.
