# Quick Start Guide - Rapid Red Care Circle

## Prerequisites
- Node.js installed
- PostgreSQL installed and running

## Setup Steps

### 1. Install PostgreSQL (if not installed)
Download from: https://www.postgresql.org/download/windows/

### 2. Create Database
Open PostgreSQL command line (psql) and run:
```sql
CREATE DATABASE rapid_red_care_circle;
\c rapid_red_care_circle
CREATE EXTENSION postgis;
```

### 3. Configure Environment
The `.env` file is already created. Update if needed:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rapid_red_care_circle
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

### 4. Run Database Migrations
```bash
cmd /c npx sequelize-cli db:migrate
```

### 5. Start the Server
```bash
cmd /c npm start
```

The server will start on http://localhost:3000

### 6. Open in Browser
Navigate to: http://localhost:3000

## Testing the Features

### Step 1: Setup
1. Click "Setup" tab
2. Click "Create Sample Data" button
3. Wait for confirmation message

### Step 2: Map View
1. Click "Map View" tab
2. You should see donor pins on the map
3. Click any pin to see:
   - Donor name
   - Blood group
   - **Reliability Score** (High/Medium/Low with percentage)
   - Eligibility score
   - Completed donations

### Step 3: History View
1. Click "History" tab
2. See two sections:
   - **Who Accepted**: List of donors who accepted requests
   - **Willing to Donate in Future**: List of donors committed to future donations

## Troubleshooting

### Database Connection Error
- Make sure PostgreSQL is running
- Check DB_PASSWORD in .env file
- Verify database exists: `psql -U postgres -l`

### PostGIS Extension Error
```sql
-- Run in psql:
\c rapid_red_care_circle
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Port Already in Use
Change PORT in .env file:
```
PORT=3001
```

## API Endpoints

Test with Postman or curl:

- `GET /api/health` - Health check
- `GET /api/map/donors` - Get all donors for map
- `GET /api/map/donors/:id` - Get donor details
- `GET /api/history/requester/:id` - Get requester history
- `POST /api/auth/register` - Register new user
- `POST /api/requests` - Create blood request

## Next Steps

To add more features:
1. Implement real-time notifications (Socket.io)
2. Add authentication (JWT)
3. Implement timeout logic for RED band requests
4. Add mobile app (React Native)

## Current Features

✅ User registration with age validation (18-60)
✅ Donor profiles with location
✅ Map view with donor pins
✅ Reliability scoring display
✅ Donation history tracking
✅ Color band classification (RED/PINK/WHITE)
✅ Eligibility and reliability calculations

## Sample Data

The "Create Sample Data" button creates:
- 4 donors in New York area
- Different blood groups (O+, A+, B+, AB+)
- Locations spread across the city
- Reliability scores based on donation history

Enjoy testing! 🩸
