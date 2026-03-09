# Database Migration Guide - Fix "No Such Column" Error

## Problem Fixed
The error `SQLITE_ERROR: no such column: User.address` occurred because the database schema was missing the new columns added to the models.

## What Was Updated
1. ✅ User model: Changed `address` field from `DataTypes.TEXT` to `DataTypes.STRING` to match migration
2. ✅ Migration files are correct and ready to run:
   - `src/migrations/20260303000001-add-address-to-users.js` - Adds address column
   - `src/migrations/20260303000002-add-willingness-fields-to-donors.js` - Adds willingness fields

## Steps to Fix (Run These Commands)

### Step 1: Stop the Server
If your server is running, stop it first (Ctrl+C in the terminal).

### Step 2: Run Database Migrations
```bash
npx sequelize-cli db:migrate
```

You should see output like:
```
Sequelize CLI [Node: x.x.x, CLI: x.x.x, ORM: x.x.x]

Loaded configuration file "src/config/database.js".
Using environment "development".
== 20260303000001-add-address-to-users: migrating =======
== 20260303000001-add-address-to-users: migrated (0.XXXs)

== 20260303000002-add-willingness-fields-to-donors: migrating =======
== 20260303000002-add-willingness-fields-to-donors: migrated (0.XXXs)
```

### Step 3: Restart the Server
```bash
npm start
```

### Step 4: Test the Willingness Flow
1. Open http://localhost:3000
2. Login with your account
3. Go to "Donate Blood" section
4. Complete the eligibility questionnaire
5. Click "Yes, I'm Willing to Donate"
6. You should see: "Willingness Confirmed! Thank you for your commitment."
7. The page should navigate to "Find Donor" map showing your location

## Verification

### Check if migrations ran successfully:
```bash
npx sequelize-cli db:migrate:status
```

You should see both migrations listed as "up":
```
up 20260303000001-add-address-to-users.js
up 20260303000002-add-willingness-fields-to-donors.js
```

### Check database schema directly (optional):
```bash
sqlite3 database.sqlite ".schema users"
```

You should see the `address` column in the output.

```bash
sqlite3 database.sqlite ".schema donors"
```

You should see `is_willing`, `passed_eligibility`, `eligibility_passed_at`, and `willingness_confirmed_at` columns.

## What the Migrations Do

### Migration 1: Add Address to Users
- Adds `address` column to `users` table
- Type: STRING (VARCHAR in SQLite)
- Allows NULL values
- Used for storing user's default address for profile and map display

### Migration 2: Add Willingness Fields to Donors
- Adds `is_willing` (BOOLEAN) - Whether donor confirmed willingness
- Adds `passed_eligibility` (BOOLEAN) - Whether donor passed eligibility check
- Adds `eligibility_passed_at` (DATE) - Timestamp when eligibility was passed
- Adds `willingness_confirmed_at` (DATE) - Timestamp when willingness was confirmed

## Troubleshooting

### If migrations fail:
1. Check if database file exists: `database.sqlite`
2. Check if you have write permissions
3. Check if another process is using the database
4. Try: `npx sequelize-cli db:migrate:undo:all` then run migrations again

### If willingness still fails after migrations:
1. Check browser console for errors
2. Check server logs for detailed error messages
3. Verify you're logged in with a valid email
4. Check Network tab in browser DevTools to see the API request/response

## Expected Behavior After Fix

1. ✅ Profile section can save address without errors
2. ✅ Eligibility questionnaire completion works
3. ✅ Willingness confirmation stores data in database
4. ✅ Map shows willing donors in GREEN
5. ✅ Map shows non-willing/ineligible donors in RED
6. ✅ Donor location is taken from profile address

## Files Modified
- `src/models/User.js` - Changed address type from TEXT to STRING
- `src/migrations/20260303000001-add-address-to-users.js` - Already correct
- `src/migrations/20260303000002-add-willingness-fields-to-donors.js` - Already correct

## Next Steps
After running migrations successfully, you can:
1. Test the complete donor flow
2. Test the requester flow to see color-coded donors on map
3. Update your profile with an address
4. Verify donors appear at correct locations on the map
