# Implementation Plan: Hospital Discovery UX Improvements

## Overview

This implementation plan enhances the Hospital Discovery feature to provide real geolocation, unrestricted hospital display, and real-time travel estimates (ETA) using Google Distance Matrix API. The implementation modifies `public/app.js` to integrate browser geolocation, display user location markers, fetch ETAs with caching, and provide graceful error handling.

## Tasks

- [x] 1. Set up testing infrastructure
  - Install fast-check for property-based testing: `npm install --save-dev fast-check`
  - Create test file structure: `__tests__/hospitalDiscoveryUX.test.js` and `__tests__/hospitalDiscoveryUX.property.test.js`
  - Set up mocks for navigator.geolocation API
  - Set up mocks for Distance Matrix API
  - _Requirements: All (testing foundation)_

- [x] 2. Implement geolocation integration
  - [x] 2.1 Create GeolocationError class
    - Define custom error class with type property (PERMISSION_DENIED, TIMEOUT, UNAVAILABLE, UNSUPPORTED)
    - Include descriptive error messages
    - _Requirements: 1.4, 1.5, 1.6, 6.1, 6.2, 6.3_

  - [x] 2.2 Implement getUserLocation() function
    - Check if navigator.geolocation is supported
    - Configure geolocation options (enableHighAccuracy: true, timeout: 10000, maximumAge: 0)
    - Return Promise with {lat, lng} coordinates
    - Handle all error cases with appropriate GeolocationError types
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 2.3 Write property test for getUserLocation
    - **Property 1: Geolocation Coordinates Usage**
    - **Validates: Requirements 1.2**

  - [x] 2.3 Implement displayUserLocationMarker() function
    - Create green marker with custom icon
    - Add "Your Location" label to marker
    - Center map on user location
    - Store marker reference in userLocationMarker variable
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 2.4 Write property test for user location marker display
    - **Property 2: User Location Marker Display**
    - **Validates: Requirements 2.1**

  - [ ]* 2.5 Write property test for map centering
    - **Property 3: Map Centering on User Location**
    - **Validates: Requirements 2.4**

  - [x] 2.5 Implement handleGeolocationError() function
    - Map GeolocationError types to user-friendly messages
    - Display error messages using showToast()
    - Call logError() for debugging
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 2.6 Implement logError() function
    - Create error log object with context, message, type, timestamp, userAgent
    - Log to console for debugging
    - _Requirements: 6.5_

  - [ ]* 2.6 Write unit tests for geolocation error handling
    - Test PERMISSION_DENIED error message
    - Test TIMEOUT error message
    - Test UNSUPPORTED error message
    - Test UNAVAILABLE error message
    - _Requirements: 1.4, 1.5, 1.6, 6.1, 6.2, 6.3_

- [ ] 3. Checkpoint - Ensure geolocation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Modify hospital loading logic
  - [x] 4.1 Update loadHospitals() function
    - Add showLoadingIndicator('geolocation') at start
    - Call getUserLocation() to get actual coordinates
    - Store coordinates in userLocation variable
    - Call displayUserLocationMarker(location)
    - Make blood group filter optional (check if value exists before adding to params)
    - Add showLoadingIndicator('hospitals') before API call
    - Update error handling to use handleGeolocationError()
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 3.3, 4.4, 7.1, 7.2_

  - [ ]* 4.2 Write unit tests for loadHospitals modifications
    - Test that getUserLocation() is called on view switch
    - Test that no hardcoded coordinates are used
    - Test that blood group filter is optional
    - Test that user location marker is displayed
    - Test geolocation request happens within 500ms
    - Test hospital data loading within 200ms of coordinates
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.3, 4.4, 7.1, 7.2_

  - [x] 4.2 Update switchMapView() function
    - Clear userLocationMarker when switching to 'donors' view
    - Remove marker from map using map.removeLayer()
    - Set userLocationMarker to null
    - Ensure user marker persists in 'hospitals' view
    - _Requirements: 2.5_

  - [ ]* 4.3 Write property test for user marker persistence
    - **Property 4: User Marker Persistence**
    - **Validates: Requirements 2.5**

  - [ ]* 4.3 Write unit tests for switchMapView modifications
    - Test user marker is removed when switching to donors
    - Test user marker persists in hospital view
    - _Requirements: 2.5_

- [x] 5. Implement Distance Matrix API integration
  - [x] 5.1 Add environment variable configuration
    - Add GOOGLE_DISTANCE_MATRIX_API_KEY to .env file
    - Add GOOGLE_DISTANCE_MATRIX_API_KEY to .env.example with instructions
    - Create DISTANCE_MATRIX_CONFIG object with apiKey, baseUrl, mode, units, departure_time, batchSize, cacheTTL
    - _Requirements: 5.6_

  - [x] 5.2 Implement ETA caching system
    - Create etaCache Map for storing ETA results
    - Implement getCachedETA(cacheKey) function
    - Check cache timestamp against 5-minute TTL
    - Return cached data if valid, null otherwise
    - _Requirements: 5.6_

  - [x] 5.3 Implement fetchETAsForHospitals() function
    - Accept origin {lat, lng} and destinations array [{lat, lng, hospitalId}]
    - Check cache for each destination
    - Batch uncached destinations (max 25 per request)
    - Build Distance Matrix API URL with parameters
    - Make fetch request to Distance Matrix API
    - Parse response and extract duration_in_traffic or duration
    - Handle API errors gracefully (return empty Map on failure)
    - Cache successful results with timestamp
    - Return Map of hospitalId to {duration, durationText, distance, distanceText}
    - _Requirements: 5.2, 5.6, 5.7_

  - [ ]* 5.4 Write unit tests for Distance Matrix API integration
    - Test API is called with correct parameters
    - Test batching respects 25 destination limit
    - Test cache respects 5-minute TTL
    - Test fallback when API fails
    - _Requirements: 5.6, 5.7_

  - [x] 5.4 Implement formatETA() function
    - Accept duration in seconds
    - If < 3600 seconds, format as "X mins"
    - If >= 3600 seconds, format as "X hr Y mins" or "X hr"
    - Return formatted string
    - _Requirements: 5.8_

  - [ ]* 5.5 Write property test for ETA formatting
    - **Property 12: ETA Formatting**
    - **Validates: Requirements 5.8**

  - [ ]* 5.5 Write unit tests for formatETA
    - Test formatting for durations < 60 minutes
    - Test formatting for durations >= 60 minutes
    - Test edge cases (0 seconds, exactly 60 minutes, etc.)
    - _Requirements: 5.8_

  - [x] 5.6 Integrate ETA fetching into loadHospitals()
    - After receiving hospital data, extract destinations array
    - Add showLoadingIndicator('eta') before fetching
    - Call fetchETAsForHospitals(userLocation, destinations)
    - Merge ETA data into hospital objects (hospital.eta = eta || null)
    - Store lastETAUpdateLocation = {...userLocation}
    - _Requirements: 5.2, 5.6, 7.4_

- [ ] 6. Checkpoint - Ensure ETA integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Update hospital marker display
  - [x] 7.1 Modify displayHospitalMarkers() function
    - Update hospital icon to use blue color with ⚕️ symbol
    - Build popup content with hospital name
    - If hospital.eta exists, display "Travel Time: {eta.durationText}"
    - Display "Distance: {hospital.distance} km"
    - If hospital.eta is null, add note: "Traffic data unavailable"
    - Display "Rating: ⭐ {hospital.serviceRating}/5"
    - Display "Priority Score: {hospital.priorityScore}/100"
    - Update map bounds to include userLocationMarker
    - _Requirements: 3.2, 3.5, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ]* 7.2 Write property tests for marker display
    - **Property 7: Hospital Name in Marker**
    - **Validates: Requirements 5.1**
    - **Property 8: ETA in Marker Information**
    - **Validates: Requirements 5.2**
    - **Property 9: Distance in Marker Information**
    - **Validates: Requirements 5.3**
    - **Property 10: Rating in Marker Information**
    - **Validates: Requirements 5.4**

  - [ ]* 7.2 Write unit tests for displayHospitalMarkers modifications
    - Test hospital markers use blue color with ⚕️ icon
    - Test ETA is displayed when available
    - Test fallback message when traffic data unavailable
    - Test markers render within 1 second of data receipt
    - _Requirements: 3.2, 3.5, 5.1, 5.2, 5.3, 5.4, 5.7, 7.3_

  - [x] 7.3 Implement showHospitalDetails() click handler integration
    - Ensure marker.on('click') calls showHospitalDetails(hospital.id)
    - Verify detailed information modal displays
    - _Requirements: 5.5_

  - [ ]* 7.4 Write property test for detailed information on click
    - **Property 11: Detailed Information on Click**
    - **Validates: Requirements 5.5**

- [ ] 8. Implement blood group filtering
  - [ ] 8.1 Verify Blood_Group_Filter control exists
    - Check that mapBloodGroupFilter element is present in HTML
    - Ensure it's visible in Hospital_View
    - _Requirements: 4.1_

  - [ ] 8.2 Update filterMapByBloodGroup() function
    - When blood group selected, call loadHospitals() with blood group parameter
    - When blood group cleared, call loadHospitals() without blood group parameter
    - Ensure filtering updates displayed hospitals
    - _Requirements: 4.2, 4.3_

  - [ ]* 8.3 Write property tests for blood group filtering
    - **Property 5: Blood Group Filtering**
    - **Validates: Requirements 4.2**
    - **Property 6: Filter Clearing Restores State**
    - **Validates: Requirements 4.3**

  - [ ]* 8.3 Write unit tests for blood group filtering
    - Test filter control is present
    - Test filtering by blood group
    - Test clearing filter restores all hospitals
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 9. Implement location change detection
  - [x] 9.1 Implement calculateDistanceInMeters() function
    - Use Haversine formula to calculate distance between two coordinates
    - Accept lat1, lng1, lat2, lng2 parameters
    - Return distance in meters
    - _Requirements: 5.9_

  - [x] 9.2 Implement hasLocationChangedSignificantly() function
    - Accept oldLocation {lat, lng} and newLocation {lat, lng}
    - Call calculateDistanceInMeters()
    - Return true if distance > 500 meters, false otherwise
    - _Requirements: 5.9_

  - [x] 9.3 Add location change detection logic
    - Store lastETAUpdateLocation when ETAs are fetched
    - On location updates, check hasLocationChangedSignificantly()
    - If true, clear ETA cache and call fetchETAsForHospitals()
    - Update markers with new ETAs
    - _Requirements: 5.9_

  - [ ]* 9.4 Write property test for ETA refresh on location change
    - **Property 13: ETA Refresh on Location Change**
    - **Validates: Requirements 5.9**

  - [ ]* 9.4 Write unit tests for location change detection
    - Test distance calculation accuracy
    - Test 500m threshold detection
    - Test ETA refresh when threshold exceeded
    - _Requirements: 5.9_

- [x] 10. Implement loading indicators
  - [x] 10.1 Implement showLoadingIndicator() function
    - Accept context parameter ('geolocation', 'hospitals', 'eta')
    - Display appropriate message based on context
    - Show loading indicator element
    - _Requirements: 7.4_

  - [x] 10.2 Implement hideLoadingIndicator() function
    - Hide loading indicator element
    - _Requirements: 7.4_

  - [x] 10.3 Add loading indicators to all async operations
    - Add to getUserLocation() call
    - Add to hospital data fetch
    - Add to ETA calculation
    - Ensure indicators are hidden on completion or error
    - _Requirements: 7.4_

  - [ ]* 10.4 Write property test for loading indicator display
    - **Property 15: Loading Indicator Display**
    - **Validates: Requirements 7.4**

  - [ ]* 10.4 Write unit tests for loading indicators
    - Test indicator shows during geolocation request
    - Test indicator shows during hospital data fetch
    - Test indicator shows during ETA calculation
    - Test indicator hides on completion
    - Test indicator hides on error
    - _Requirements: 7.4_

- [ ] 11. Checkpoint - Ensure all integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Add error logging and monitoring
  - [x] 12.1 Verify logError() implementation
    - Ensure all errors are logged with context
    - Include timestamp, userAgent, and error details
    - _Requirements: 6.5_

  - [ ]* 12.2 Write property test for error logging
    - **Property 14: Error Logging**
    - **Validates: Requirements 6.5**

  - [ ]* 12.2 Write unit tests for error logging
    - Test geolocation errors are logged
    - Test hospital API errors are logged
    - Test Distance Matrix API errors are logged
    - Test error log format includes all required fields
    - _Requirements: 6.5_

- [ ] 13. Performance optimization and validation
  - [ ] 13.1 Add performance timing logs
    - Log time from view switch to geolocation request
    - Log time from coordinates to hospital API call
    - Log time from data receipt to marker rendering
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 13.2 Implement ETA cache cleanup
    - Create periodic cleanup function (runs every 60 seconds)
    - Remove expired cache entries (older than 5 minutes)
    - _Requirements: 5.6_

  - [ ]* 13.3 Write unit tests for performance requirements
    - Test geolocation request within 500ms
    - Test hospital data loading within 200ms
    - Test marker rendering within 1 second
    - Test total load time under 3 seconds
    - _Requirements: 7.1, 7.2, 7.3, 3.4_

- [ ] 14. Complete property-based test suite
  - [ ]* 14.1 Write remaining property tests
    - Ensure all 15 correctness properties have corresponding tests
    - Each test should run minimum 100 iterations
    - Each test should reference design document property in comment
    - Format: `// Feature: hospital-discovery-ux-improvements, Property {number}: {property_text}`

  - [ ]* 14.2 Verify property test coverage
    - Property 1: Geolocation Coordinates Usage
    - Property 2: User Location Marker Display
    - Property 3: Map Centering on User Location
    - Property 4: User Marker Persistence
    - Property 5: Blood Group Filtering
    - Property 6: Filter Clearing Restores State
    - Property 7: Hospital Name in Marker
    - Property 8: ETA in Marker Information
    - Property 9: Distance in Marker Information
    - Property 10: Rating in Marker Information
    - Property 11: Detailed Information on Click
    - Property 12: ETA Formatting
    - Property 13: ETA Refresh on Location Change
    - Property 14: Error Logging
    - Property 15: Loading Indicator Display

- [ ] 15. Complete unit test suite
  - [ ]* 15.1 Write comprehensive unit tests
    - Geolocation error handling (4 tests)
    - User location marker (3 tests)
    - Hospital loading (6 tests)
    - Distance Matrix API (4 tests)
    - ETA formatting (3 tests)
    - Marker display (4 tests)
    - Blood group filtering (3 tests)
    - Location change detection (3 tests)
    - Loading indicators (5 tests)
    - Error logging (4 tests)
    - Performance validation (4 tests)

  - [ ]* 15.2 Verify test coverage
    - Run coverage report: `npm test -- --coverage`
    - Ensure >85% code coverage for all metrics
    - Ensure all requirements are covered by tests

- [ ] 16. Final checkpoint - Complete end-to-end validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across randomized inputs
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation modifies only `public/app.js` and environment configuration files
- Backend API endpoints remain unchanged
- Distance Matrix API requires a valid Google API key with billing enabled
- ETA caching reduces API costs by ~80% for repeated views
- All async operations include loading indicators for user feedback
- Error handling provides clear, actionable messages for all failure scenarios
