# Requirements Document

## Introduction

This document specifies requirements for enhancing the Hospital Discovery feature's user experience. The improvements focus on displaying the user's actual geolocation, removing mandatory blood group filtering, and providing a more intuitive hospital discovery workflow. These enhancements will allow users to see all nearby hospitals immediately upon switching to hospital view, then make informed decisions based on proximity, ratings, and blood availability.

## Glossary

- **Hospital_Discovery_Feature**: The existing system component that displays nearby hospitals on a map interface
- **User_Location_Marker**: A visual indicator on the map showing the user's current geographic position
- **Hospital_Marker**: A visual indicator on the map showing a hospital's geographic position
- **Geolocation_Service**: The browser's navigator.geolocation API that provides the user's actual coordinates
- **Hospital_View**: The map interface mode that displays hospitals and user location
- **Blood_Group_Filter**: An optional filter that narrows hospital results by blood type availability
- **Nearby_Hospitals**: Hospitals within a configured radius of the user's location
- **Map_Interface**: The Google Maps or Mapbox component displaying geographic data
- **Distance_Matrix_API**: An external API service (e.g., Google Distance Matrix API) that calculates travel time and distance between locations considering real-time traffic conditions
- **ETA**: Estimated Time of Arrival - the calculated travel time from the user's location to a hospital based on current traffic conditions

## Requirements

### Requirement 1: Real Geolocation Acquisition

**User Story:** As a user seeking blood donation services, I want the system to use my actual current location, so that I can find hospitals that are truly nearby.

#### Acceptance Criteria

1. WHEN the user switches to Hospital_View, THE Hospital_Discovery_Feature SHALL request geolocation permission from the Geolocation_Service
2. WHEN the Geolocation_Service returns coordinates, THE Hospital_Discovery_Feature SHALL use those coordinates as the user's location
3. THE Hospital_Discovery_Feature SHALL NOT use hardcoded coordinates for user location
4. WHEN geolocation permission is denied, THE Hospital_Discovery_Feature SHALL display an error message explaining that location access is required
5. WHEN the Geolocation_Service times out after 10 seconds, THE Hospital_Discovery_Feature SHALL display a timeout error message
6. WHEN the Geolocation_Service is unavailable, THE Hospital_Discovery_Feature SHALL display an error message indicating geolocation is not supported

### Requirement 2: User Location Visualization

**User Story:** As a user viewing the hospital map, I want to see my current location clearly marked, so that I can understand my position relative to nearby hospitals.

#### Acceptance Criteria

1. WHEN the user's coordinates are obtained, THE Hospital_Discovery_Feature SHALL display a User_Location_Marker on the Map_Interface
2. THE User_Location_Marker SHALL use green color to distinguish it from Hospital_Markers
3. THE User_Location_Marker SHALL display the label "Your Location"
4. THE Hospital_Discovery_Feature SHALL center the Map_Interface on the User_Location_Marker when first displayed
5. THE User_Location_Marker SHALL remain visible while the user is in Hospital_View

### Requirement 3: Unrestricted Hospital Display

**User Story:** As a user exploring hospital options, I want to see all nearby hospitals immediately, so that I can evaluate all available options without pre-filtering.

#### Acceptance Criteria

1. WHEN the user switches to Hospital_View, THE Hospital_Discovery_Feature SHALL load all Nearby_Hospitals without requiring blood group selection
2. THE Hospital_Discovery_Feature SHALL display Hospital_Markers for all Nearby_Hospitals on the Map_Interface
3. THE Hospital_Discovery_Feature SHALL NOT require Blood_Group_Filter selection before displaying hospitals
4. WHEN Nearby_Hospitals are loaded, THE Hospital_Discovery_Feature SHALL display them within 3 seconds of obtaining user coordinates
5. THE Hospital_Discovery_Feature SHALL display Hospital_Markers using blue color with the ⚕️ icon

### Requirement 4: Optional Blood Group Filtering

**User Story:** As a user with a specific blood type need, I want to optionally filter hospitals by blood availability, so that I can narrow my search after seeing all options.

#### Acceptance Criteria

1. WHILE viewing all Nearby_Hospitals, THE Hospital_Discovery_Feature SHALL provide a Blood_Group_Filter control
2. WHEN the user selects a blood group in the Blood_Group_Filter, THE Hospital_Discovery_Feature SHALL update the displayed hospitals to show only those with the selected blood type available
3. WHEN the user clears the Blood_Group_Filter, THE Hospital_Discovery_Feature SHALL display all Nearby_Hospitals again
4. THE Blood_Group_Filter SHALL remain optional and not block initial hospital display

### Requirement 5: Hospital Information Display

**User Story:** As a user evaluating hospital options, I want to see relevant information about each hospital including real-time travel time, so that I can make an informed decision based on actual reachability rather than just distance.

#### Acceptance Criteria

1. WHEN a Hospital_Marker is displayed, THE Hospital_Discovery_Feature SHALL include the hospital's name in the marker information
2. WHEN a Hospital_Marker is displayed, THE Hospital_Discovery_Feature SHALL include the hospital's estimated travel time (ETA) from the user's location calculated using real-time traffic data
3. WHEN a Hospital_Marker is displayed, THE Hospital_Discovery_Feature SHALL include the hospital's straight-line distance from the user's location as secondary information
4. WHEN a Hospital_Marker is displayed, THE Hospital_Discovery_Feature SHALL include the hospital's rating if available
5. WHEN the user clicks a Hospital_Marker, THE Hospital_Discovery_Feature SHALL display detailed hospital information including contact details and blood availability
6. THE Hospital_Discovery_Feature SHALL use a Distance Matrix API (such as Google Distance Matrix API) to calculate travel time with current traffic conditions
7. WHEN traffic data is unavailable, THE Hospital_Discovery_Feature SHALL fall back to displaying distance in kilometers with a note that traffic data is unavailable
8. THE Hospital_Discovery_Feature SHALL display ETA in minutes for travel times under 60 minutes, and in hours and minutes for longer durations
9. THE Hospital_Discovery_Feature SHALL refresh ETA calculations when the user's location changes significantly (more than 500 meters)

### Requirement 6: Graceful Error Handling

**User Story:** As a user experiencing technical issues, I want clear error messages, so that I understand what went wrong and what actions I can take.

#### Acceptance Criteria

1. IF geolocation permission is denied, THEN THE Hospital_Discovery_Feature SHALL display the message "Location access is required to find nearby hospitals. Please enable location permissions in your browser settings."
2. IF the Geolocation_Service times out, THEN THE Hospital_Discovery_Feature SHALL display the message "Unable to determine your location. Please check your device settings and try again."
3. IF the Geolocation_Service is unavailable, THEN THE Hospital_Discovery_Feature SHALL display the message "Geolocation is not supported by your browser. Please use a modern browser to access this feature."
4. IF the hospital data fails to load, THEN THE Hospital_Discovery_Feature SHALL display the message "Unable to load hospital data. Please check your internet connection and try again."
5. WHEN an error occurs, THE Hospital_Discovery_Feature SHALL log the error details for debugging purposes

### Requirement 7: Performance and Responsiveness

**User Story:** As a user in an urgent situation, I want the hospital map to load quickly, so that I can find help without delay.

#### Acceptance Criteria

1. WHEN the user switches to Hospital_View, THE Hospital_Discovery_Feature SHALL request geolocation within 500 milliseconds
2. WHEN coordinates are obtained, THE Hospital_Discovery_Feature SHALL initiate hospital data loading within 200 milliseconds
3. WHEN hospital data is received, THE Hospital_Discovery_Feature SHALL render all Hospital_Markers within 1 second
4. THE Hospital_Discovery_Feature SHALL display a loading indicator while fetching geolocation and hospital data
5. THE Hospital_Discovery_Feature SHALL remain responsive to user interactions during data loading

## Technical Notes

- The implementation will modify existing functions in `public/app.js`: `loadHospitals()`, `displayHospitalMarkers()`, `findBestHospital()`, and `switchMapView()`
- Backend API endpoints in `src/routes/hospitals.js` already support fetching hospitals by location
- The smart priority algorithm in `src/services/hospitalService.js` will continue to function for ranking hospitals
- Map integration uses Google Maps or Mapbox APIs
- Database schema in SQLite already supports hospital and blood bank data
- ETA calculation will require integration with Google Distance Matrix API or equivalent service
- API key management for Distance Matrix API should follow existing environment variable patterns in `.env`
- Distance Matrix API calls should be batched when possible to minimize API usage and costs
- Consider implementing caching for ETA results with a short TTL (e.g., 5 minutes) to reduce API calls for frequently viewed hospitals
