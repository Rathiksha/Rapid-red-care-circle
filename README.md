# Rapid Red Care Circle - Backend

Blood donation coordination platform with real-time matching and emergency notification system.

## Features

- User registration with age validation (18-60 years)
- Color-coded urgency bands (RED/PINK/WHITE)
- Smart donor matching algorithm
- Real-time location tracking
- Timeout logic for emergency requests
- Push notifications
- Hospital blood bank integration

## Prerequisites

- Node.js v18+ 
- PostgreSQL 14+ with PostGIS extension
- Redis (optional, for caching and queues)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file with database credentials

5. Create PostgreSQL database:
```sql
CREATE DATABASE rapid_red_care_circle;
\c rapid_red_care_circle
CREATE EXTENSION postgis;
```

6. Run database migrations:
```bash
npm run migrate
```

## Running the Application

### Development mode:
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

### Run tests:
```bash
npm test
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-mobile` - Verify mobile number

### Blood Requests
- `POST /api/requests` - Create blood request
- `GET /api/requests/:id` - Get request details
- `GET /api/requests/active` - Get active requests

### Donor Matching
- `GET /api/donors/search` - Search eligible donors
- `GET /api/donors/:id/score` - Get donor scores

### Notifications
- `POST /api/notifications/respond` - Respond to notification
- `PUT /api/notifications/:id/viewed` - Mark as viewed

## Project Structure

```
rapid-red-care-circle/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Sequelize models
│   ├── migrations/      # Database migrations
│   ├── services/        # Business logic
│   ├── controllers/     # API controllers
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   └── index.js         # Entry point
├── __tests__/           # Test files
├── .env                 # Environment variables
└── package.json
```

## Testing

The project includes comprehensive tests:
- Unit tests for business logic
- Integration tests for API endpoints
- End-to-end tests for critical flows

Run tests with:
```bash
npm test
```

## Color Band System

- **RED BAND**: Immediate requirement (0-2 hours)
  - 10-minute view timeout
  - 20-minute response timeout
  - Overrides quiet hours

- **PINK BAND**: Within 24 hours
  - 30-minute response timeout
  - Respects quiet hours

- **WHITE BAND**: After 24 hours
  - No timeout enforcement
  - Allows "Donate in future" option

## License

MIT
