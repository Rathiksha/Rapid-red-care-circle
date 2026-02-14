# Implementation Plan: Rapid Red Care Circle

## Overview

This implementation plan breaks down the Rapid Red Care Circle blood donation coordination platform into discrete, actionable coding tasks. The system uses Node.js/Express backend with PostgreSQL database, Socket.io for real-time communication, and integrates with external services for geolocation and push notifications.

The implementation follows an incremental approach: database setup → core services → API endpoints → real-time features → testing. Each task builds on previous work to ensure continuous integration and early validation.

## Tasks

- [ ] 1. Set up project infrastructure and database
  - [x] 1.1 Install and configure required dependencies
    - Install PostgreSQL client (pg), Sequelize ORM, Redis client, Socket.io, JWT libraries, bcrypt
    - Install Firebase Admin SDK for push notifications
    - Configure environment variables for database, Redis, and external APIs
    - _Requirements: All requirements depend on infrastructure_
  
  - [x] 1.2 Create database schema and migrations
    - Create PostgreSQL database with PostGIS extension enabled
    - Write Sequelize migrations for users, donors, blood_requests, donor_notifications, donation_history, hospital_blood_banks tables
    - Add spatial indexes on location columns using PostGIS
    - Add standard indexes on foreign keys and frequently queried columns
    - _Requirements: 1.1, 1.6, 2.1, 3.1, 5.1, 9.1, 13.4_
  
  - [x] 1.3 Create Sequelize models for all entities
    - Define User model with validations (age 18-60, blood group enum)
    - Define Donor model with location geography type
    - Define BloodRequest model with urgency band enum
    - Define DonorNotification, DonationHistory, HospitalBloodBank models
    - Set up model associations (foreign keys, relationships)
    - _Requirements: 1.1, 1.6, 2.1, 3.1_

- [ ] 2. Implement core business logic services
  - [x] 2.1 Enhance UserService with complete registration logic
    - Implement mobile number verification with OTP generation
    - Add medical history validation and storage (JSONB field)
    - Implement notification preference management
    - Add quiet hours configuration
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 15.1, 15.2_
  
  - [x] 2.2 Implement ColorBandService for urgency classification
    - Create assignColorBand function that maps timeframe to RED/PINK/WHITE
    - Implement emergency warning flag logic for RED band requests
    - Add validation for required timeframe values
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_
  
  - [x] 2.3 Implement EligibilityService for donor scoring
    - Create calculateEligibilityScore function with last donation date logic
    - Implement medical history deductions (diabetes -15%, seizures -20%)
    - Add 90-day and 120-day donation date thresholds
    - Ensure score stays within 0-100% range
    - Implement automatic recalculation on profile updates
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 2.4 Implement ReliabilityService for donor reliability tracking
    - Create calculateReliabilityScore with time-weighted decay
    - Implement action tracking (completed +10, cancelled -15, ignored -5, declined -2)
    - Add 6-month time decay weighting (recent actions 2x weight)
    - Ensure score stays within 0-100% range
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [x] 2.5 Enhance DonorMatchingService with complete algorithm
    - Implement findEligibleDonors with blood group and active status filtering
    - Create calculateDistanceAndETA using PostGIS ST_Distance
    - Integrate with traffic API for real-time ETA calculation
    - Implement calculateCompositeScore with weighted factors (distance 25%, ETA 20%, eligibility 25%, reliability 30%)
    - Create findBestDonors that returns sorted list with bestDonor first
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 14.1, 14.2_

- [ ] 3. Implement timeout and notification services
  - [ ] 3.1 Create TimeoutService for RED band request management
    - Implement startRedBandTimeout with 10-minute view timeout
    - Add onNotificationViewed handler with 20-minute response timeout
    - Create expireNotification function that marks expired and sends "Not Available" notification
    - Implement moveToNextDonor to cascade to next ranked donor
    - Use setTimeout/clearTimeout for timer management
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ] 3.2 Create NotificationService for push notifications
    - Integrate Firebase Cloud Messaging (FCM) SDK
    - Implement sendDonorNotification with quiet hours checking
    - Add RED band override for quiet hours
    - Create notification payload with request details (color band, location, distance, ETA)
    - Implement notification preference checking
    - _Requirements: 5.1, 5.2, 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [ ] 3.3 Implement LocationTrackingService for real-time tracking
    - Create startTracking function with 30-second interval updates
    - Implement stopTracking to clean up intervals
    - Add database location updates using PostGIS geography type
    - Integrate Socket.io for broadcasting location to requester
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 4. Build authentication and user management APIs
  - [ ] 4.1 Create authentication middleware and JWT utilities
    - Implement JWT token generation with 24-hour expiration
    - Create authentication middleware to verify JWT tokens
    - Add role-based authorization middleware (Donor/Requester)
    - Implement password hashing with bcrypt
    - _Requirements: 1.1, 1.5_
  
  - [ ] 4.2 Implement user registration and authentication endpoints
    - POST /api/auth/register - User registration with age validation
    - POST /api/auth/verify-mobile - OTP verification
    - POST /api/auth/login - User login with JWT token response
    - POST /api/auth/refresh - Token refresh endpoint
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [ ] 4.3 Implement user profile management endpoints
    - GET /api/users/:id - Get user profile
    - PUT /api/users/:id - Update user profile with eligibility recalculation
    - PUT /api/users/:id/location - Update current location (PostGIS point)
    - PUT /api/users/:id/preferences - Update notification preferences
    - _Requirements: 1.1, 2.5, 15.1, 15.2_

- [ ] 5. Build blood request and matching APIs
  - [ ] 5.1 Implement blood request endpoints
    - POST /api/requests - Create blood request with color band assignment
    - GET /api/requests/:id - Get request details with donor information
    - GET /api/requests/active - Get active requests for requester
    - PUT /api/requests/:id/status - Update request status
    - POST /api/requests/private - Create private request to specific donors
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 5.2 Implement donor matching and search endpoints
    - GET /api/donors/search - Search eligible donors with composite scoring
    - GET /api/donors/:id/score - Get donor eligibility and reliability scores
    - GET /api/donors/nearby - Get nearby donors with distance calculation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  
  - [ ] 5.3 Implement notification response endpoints
    - POST /api/notifications/respond - Donor accepts/declines request
    - PUT /api/notifications/:id/viewed - Mark notification as viewed (triggers 20-min timeout)
    - POST /api/notifications/future-commitment - Donor commits to future donation
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 6. Implement hospital and donation history features
  - [ ] 6.1 Create hospital blood bank endpoints
    - GET /api/hospitals/nearby - Query nearby hospitals using PostGIS spatial query
    - GET /api/hospitals/:id/availability - Check blood availability by type
    - POST /api/hospitals - Add hospital blood bank (admin only)
    - PUT /api/hospitals/:id/availability - Update blood availability
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 6.2 Implement donation history and completion endpoints
    - POST /api/donations/complete - Mark donation as complete
    - GET /api/donations/history/:donorId - Get donor's donation history
    - GET /api/donations/previous-donors/:requesterId - Get requester's previous donors
    - PUT /api/donations/:id/cancel - Cancel donation with reason
    - _Requirements: 10.1, 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 7. Implement real-time features with Socket.io
  - [ ] 7.1 Set up Socket.io server and connection handling
    - Initialize Socket.io with Express server
    - Implement connection authentication using JWT
    - Create room management for request-specific channels
    - Add error handling and reconnection logic
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ] 7.2 Implement real-time event handlers
    - Handle 'join_request' event for requesters to join request room
    - Handle 'update_location' event from donors
    - Emit 'donor_location_update' to requester room every 30 seconds
    - Emit 'request_status_update' when request status changes
    - Emit 'new_notification' when blood request is created
    - Emit 'donor_not_available' on timeout expiration
    - _Requirements: 5.1, 5.2, 6.3, 6.4, 7.3, 7.4, 7.5_
  
  - [ ] 7.3 Implement map view data endpoints
    - GET /api/map/donors - Get all active donors with locations for map display
    - GET /api/map/requests/:id/donor-location - Get specific donor's live location
    - Add WebSocket integration for real-time map updates
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 8. Add external API integrations
  - [ ] 8.1 Integrate traffic API for ETA calculation
    - Set up Google Maps Distance Matrix API or similar service
    - Implement getTrafficData function with route and traffic conditions
    - Add fallback calculation using distance and average speed
    - Cache traffic data for 5 minutes to reduce API calls
    - _Requirements: 4.3, 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [ ] 8.2 Implement SMS/OTP service for mobile verification
    - Integrate Twilio or similar SMS service
    - Create OTP generation and storage (Redis with 10-minute expiration)
    - Implement OTP verification with rate limiting
    - _Requirements: 1.5_

- [ ] 9. Implement background jobs and scheduled tasks
  - [ ] 9.1 Create background job processor
    - Set up Bull queue with Redis
    - Create job for eligibility score recalculation (daily)
    - Create job for reliability score updates (after each donation event)
    - Create job for expired request cleanup
    - Create job for future donation reminders
    - _Requirements: 2.5, 11.5, 12.4_
  
  - [ ] 9.2 Implement timeout monitoring job
    - Create scheduled job to check RED band timeouts every minute
    - Process expired notifications and trigger moveToNextDonor
    - Clean up completed timeout timers
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 10. Add security, validation, and error handling
  - [ ] 10.1 Implement input validation middleware
    - Add express-validator for all API endpoints
    - Validate blood group enum values
    - Validate location coordinates (latitude/longitude ranges)
    - Validate age constraints (18-60)
    - Sanitize user inputs to prevent injection attacks
    - _Requirements: 1.2, 1.3, 3.5_
  
  - [ ] 10.2 Add rate limiting and security middleware
    - Implement express-rate-limit for API endpoints
    - Add helmet.js for security headers
    - Configure CORS for mobile app origins
    - Add request logging with morgan
    - _Requirements: All requirements benefit from security_
  
  - [ ] 10.3 Implement comprehensive error handling
    - Create centralized error handling middleware
    - Add custom error classes (ValidationError, AuthenticationError, NotFoundError)
    - Implement error logging with Winston or similar
    - Add Sentry integration for production error tracking
    - _Requirements: All requirements_

- [ ] 11. Write unit tests for core services
  - [ ]* 11.1 Write unit tests for ColorBandService
    - Test RED band assignment for immediate timeframe
    - Test PINK band assignment for within_24_hours
    - Test WHITE band assignment for after_24_hours
    - Test emergency warning flag for RED band
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_
  
  - [ ]* 11.2 Write unit tests for EligibilityService
    - Test base score of 100% for new donor
    - Test -50% deduction for donation < 90 days ago
    - Test -25% deduction for donation 90-120 days ago
    - Test medical history deductions (diabetes, seizures)
    - Test score bounds (0-100%)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 11.3 Write unit tests for ReliabilityService
    - Test base score of 50%
    - Test positive actions (completed +10, quick response +2)
    - Test negative actions (cancelled -15, ignored -5, declined -2)
    - Test time decay weighting (6-month threshold)
    - Test score bounds (0-100%)
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ]* 11.4 Write unit tests for DonorMatchingService
    - Test composite score calculation with all factors
    - Test donor sorting (best donor first)
    - Test eligible donor filtering by blood group
    - Test distance calculation using mock PostGIS
    - Test ETA calculation with traffic data
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  
  - [ ]* 11.5 Write unit tests for TimeoutService
    - Test 10-minute view timeout for RED band
    - Test 20-minute response timeout after viewing
    - Test expireNotification marks notification as expired
    - Test moveToNextDonor selects next ranked donor
    - Test timer cleanup on donor response
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 12. Write integration tests for API endpoints
  - [ ]* 12.1 Write integration tests for authentication flow
    - Test complete registration flow with age validation
    - Test mobile verification with OTP
    - Test login with JWT token generation
    - Test protected endpoint access with valid/invalid tokens
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [ ]* 12.2 Write integration tests for blood request creation
    - Test request creation with color band assignment
    - Test RED band request triggers notifications
    - Test private request to specific donors
    - Test request status updates
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.3, 10.4, 10.5_
  
  - [ ]* 12.3 Write integration tests for donor matching
    - Test search returns sorted donors by composite score
    - Test distance calculation using PostGIS
    - Test ETA calculation with traffic API
    - Test best donor selection
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  
  - [ ]* 12.4 Write integration tests for notification responses
    - Test donor accept updates request status
    - Test donor decline records response
    - Test viewed notification triggers 20-minute timeout
    - Test future commitment creates record
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 12.1, 12.2, 12.3_
  
  - [ ]* 12.5 Write integration tests for donation completion
    - Test complete donation updates last donation date
    - Test eligibility score recalculation after completion
    - Test reliability score increase after completion
    - Test donation history record creation
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 13. Write end-to-end tests for critical flows
  - [ ]* 13.1 Write E2E test for complete donation flow
    - Test: Requester creates RED band request → Best donor receives notification → Donor accepts → Location tracking starts → Donation completes → Scores update
    - Verify all state transitions and database updates
    - _Requirements: 3.1, 4.8, 5.1, 5.4, 7.1, 7.2, 13.1, 13.2, 13.3_
  
  - [ ]* 13.2 Write E2E test for timeout cascade scenario
    - Test: RED band request → Donor 1 doesn't view (10 min) → Expires → Donor 2 notified → Donor 2 views but doesn't respond (20 min) → Expires → Donor 3 notified
    - Verify timeout logic and cascade behavior
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ]* 13.3 Write E2E test for private request flow
    - Test: Requester with previous donors → Creates private request → Only selected donors notified → Donor accepts → Donation completes
    - Verify private request bypasses general matching
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 14. Set up deployment configuration
  - [ ] 14.1 Create production environment configuration
    - Set up environment variables for production
    - Configure PostgreSQL connection pooling
    - Set up Redis connection for production
    - Configure Socket.io for production (sticky sessions)
    - _Requirements: All requirements_
  
  - [ ] 14.2 Create Docker configuration
    - Write Dockerfile for Node.js application
    - Create docker-compose.yml with PostgreSQL, Redis, and app services
    - Add PostGIS extension to PostgreSQL container
    - Configure volume mounts for data persistence
    - _Requirements: All requirements_
  
  - [ ] 14.3 Set up CI/CD pipeline
    - Create GitHub Actions workflow for automated testing
    - Add database migration step to deployment
    - Configure automated deployment to staging/production
    - Add health check endpoints for monitoring
    - _Requirements: All requirements_

- [ ] 15. Final integration and documentation
  - [ ] 15.1 Create API documentation
    - Document all endpoints with request/response examples
    - Add authentication requirements for each endpoint
    - Document WebSocket events and payloads
    - Create Postman collection for API testing
    - _Requirements: All requirements_
  
  - [ ] 15.2 Perform final integration testing
    - Test all API endpoints with real database
    - Test WebSocket connections and real-time updates
    - Test timeout scenarios with actual timers
    - Test external API integrations (traffic, SMS)
    - Verify all requirements are met
    - _Requirements: All requirements_
  
  - [ ] 15.3 Checkpoint - Final review and deployment readiness
    - Ensure all tests pass
    - Verify database migrations work correctly
    - Check security configurations
    - Review error handling and logging
    - Ask the user if questions arise before deployment

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation follows an incremental approach with early validation
- Database setup must be completed before service implementation
- API endpoints depend on service layer completion
- Real-time features require Socket.io setup
- Testing tasks are distributed throughout to catch errors early
- External API integrations can be mocked initially for development
- Background jobs can be implemented after core features are working
- Security and validation should be added before production deployment
