# Quick Fix - Run These Commands

## The Problem
Error: `SQLITE_ERROR: no such column: User.address`

## The Solution
Run database migrations to add missing columns.

## Commands (Copy & Paste)

```bash
# Stop server (Ctrl+C if running)

# Run migrations
npm run migrate

# Verify (optional)
npm run verify

# Start server
npm start
```

### Alternative (using npx directly):
```bash
npx sequelize-cli db:migrate
node verify-setup.js
npm start
```

## That's It!
Now test at http://localhost:3000

## What This Does
- Adds `address` column to Users table
- Adds willingness fields to Donors table:
  - `is_willing`
  - `passed_eligibility`
  - `eligibility_passed_at`
  - `willingness_confirmed_at`

## More Details
See `RUN_MIGRATIONS_GUIDE.md` for full instructions and troubleshooting.


## Helpful NPM Scripts Added

```bash
npm run migrate        # Run all pending migrations
npm run migrate:status # Check which migrations have been applied
npm run migrate:undo   # Undo last migration (use carefully!)
npm run verify         # Verify database schema is correct
```
