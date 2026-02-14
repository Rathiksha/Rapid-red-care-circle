# Requirements Document: Rapid Red Care Circle

## Introduction

Rapid Red Care Circle is a mobile application that coordinates blood donation by matching donors with requesters in real-time using location-based services, emergency notification bands, and intelligent matching algorithms. The system aims to reduce response time for blood donation requests through smart donor selection based on proximity, eligibility, and reliability.

## Glossary

- **System**: The Rapid Red Care Circle mobile application and backend services
- **Donor**: A registered user who can donate blood
- **Requester**: A user who creates a blood donation request
- **Color_Band**: A priority classification system (Red/Pink/White) indicating urgency
- **Red_Band**: Emergency blood requirement with immediate notification
- **Pink_Band**: Blood requirement needed within 24 hours
- **White_Band**: Blood requirement needed after 24 hours
- **Eligibility_Score**: Calculated percentage based on last donation date and medical history
- **Reliability_Score**: Score based on previous donation acceptance and completion history
- **Best_Donor**: The highest-ranked donor based on matching algorithm
- **Donation_Window**: The time period a donor has to respond to a request
- **Hospital_Blood_Bank**: Medical facility blood storage and distribution center
- **Private_Request**: A blood request sent to specific previously-used donors
- **ETA**: Estimated Time of Arrival based on distance and live traffic data

## Requirements

### Requirement 1: User Registration and Profile Management

**User Story:** As a potential donor or requester, I want to register with my personal and medical information, so that the system can verify my eligibility and match me appropriately.

#### Acceptance Criteria

1. WHEN a user registers, THE System SHALL collect full name, age, gender, verified mobile number, city, and blood group
2. WHEN a user provides age information, THE System SHALL accept only users between 18 and 60 years inclusive
3. WHEN a user registers, THE System SHALL collect medical history including diabetes and seizure conditions
4. WHERE a user is registering as a donor, THE System SHALL capture the last blood donation date
5. WHEN a user submits registration information, THE System SHALL verify the mobile number before account activation
6. WHEN a user completes registration, THE System SHALL create a user profile with all provided information

### Requirement 2: Eligibility Calculation

**User Story:** As a system administrator, I want the system to automatically calculate donor eligibility, so that only qualified donors are matched with requests.

#### Acceptance Criteria

1. WHEN calculating eligibility, THE System SHALL compute an eligibility score as a percentage based on last donation date and medical history
2. WHEN a donor's last donation date is less than 90 days ago, THE System SHALL reduce the eligibility score
3. WHEN a donor has disqualifying medical conditions, THE System SHALL reduce the eligibility score accordingly
4. WHEN a donor's eligibility score is calculated, THE System SHALL store it in the donor profile
5. WHEN a donor's profile information changes, THE System SHALL recalculate the eligibility score

### Requirement 3: Blood Request Creation with Color Bands

**User Story:** As a requester, I want to create blood donation requests with appropriate urgency levels, so that donors understand the time sensitivity.

#### Acceptance Criteria

1. WHEN a requester creates a blood request, THE System SHALL assign a color band based on the required timeframe
2. WHEN a request requires blood immediately, THE System SHALL assign a Red_Band classification
3. WHEN a request requires blood within 24 hours, THE System SHALL assign a Pink_Band classification
4. WHEN a request requires blood after 24 hours, THE System SHALL assign a White_Band classification
5. WHEN a requester creates a request, THE System SHALL collect blood group, location, and required timeframe
6. WHEN a Red_Band request is created, THE System SHALL flag it with an emergency warning indicator

### Requirement 4: Smart Donor Matching Algorithm

**User Story:** As a requester, I want the system to identify the best available donors, so that I can receive blood donations quickly and reliably.

#### Acceptance Criteria

1. WHEN a blood request is created, THE System SHALL analyze all active donors matching the required blood group
2. WHEN analyzing donors, THE System SHALL calculate distance from donor location to hospital or requester location
3. WHEN analyzing donors, THE System SHALL calculate ETA based on distance and live traffic data
4. WHEN analyzing donors, THE System SHALL retrieve the donor's eligibility score
5. WHEN analyzing donors, THE System SHALL retrieve the donor's reliability score based on previous donation history
6. WHEN all donor metrics are calculated, THE System SHALL rank donors using a composite score of distance, ETA, eligibility, and reliability
7. WHEN donors are ranked, THE System SHALL identify the highest-ranked donor as the Best_Donor
8. WHEN the matching algorithm completes, THE System SHALL return a sorted list of donors with the Best_Donor first

### Requirement 5: Donor Notification and Response

**User Story:** As a donor, I want to receive notifications for blood requests and respond with my availability, so that I can help those in need.

#### Acceptance Criteria

1. WHEN a blood request is created, THE System SHALL send notifications to nearby eligible donors
2. WHEN a donor receives a notification, THE System SHALL display the color band, location, distance, and ETA
3. WHEN a donor views a notification, THE System SHALL record the view timestamp
4. WHEN a donor accepts a request, THE System SHALL allow the donor to specify if donating for self, family, or friend
5. WHEN a donor accepts a request, THE System SHALL update the request status to "Donor Accepted"
6. WHEN a donor is unavailable, THE System SHALL allow the donor to flag as "Willing to donate in future"
7. WHEN a donor declines or ignores a request, THE System SHALL record the response for reliability scoring

### Requirement 6: Timeout Logic for Emergency Requests

**User Story:** As a requester with an emergency need, I want the system to automatically move to the next donor if the current donor doesn't respond, so that I don't waste critical time.

#### Acceptance Criteria

1. WHEN a Red_Band request is sent to a donor, THE System SHALL start a timeout timer
2. WHILE a Red_Band request timeout timer is active, THE System SHALL monitor for donor response
3. WHEN a donor does not view a Red_Band notification within 10 minutes, THE System SHALL automatically send a "Not Available" status to the requester
4. WHEN a donor does not respond to a Red_Band notification within 20 minutes after viewing, THE System SHALL automatically send a "Not Available" status to the requester
5. WHEN a timeout occurs for a Red_Band request, THE System SHALL move to the next highest-ranked donor
6. WHEN moving to the next donor, THE System SHALL send a notification to that donor and restart the timeout timer

### Requirement 7: Live Location Tracking

**User Story:** As a requester, I want to track the donor's location in real-time after they accept, so that I know when they will arrive.

#### Acceptance Criteria

1. WHEN a donor accepts a blood request, THE System SHALL request permission to access the donor's live location
2. WHEN location permission is granted, THE System SHALL begin tracking the donor's location
3. WHILE a donor is en route, THE System SHALL update the donor's location every 30 seconds
4. WHEN the donor's location updates, THE System SHALL transmit the location to the requester
5. WHEN the requester views the request, THE System SHALL display the donor's live location on a map
6. WHEN the donor arrives at the destination, THE System SHALL stop location tracking

### Requirement 8: Map View and Donor Visualization

**User Story:** As a requester, I want to view active donors on a map, so that I can see who is nearby and available.

#### Acceptance Criteria

1. WHEN a requester opens the map view, THE System SHALL display a map centered on the requester's location
2. WHEN displaying the map, THE System SHALL show markers for all active eligible donors
3. WHEN displaying donor markers, THE System SHALL include the donor's distance from the requester
4. WHEN a requester taps a donor marker, THE System SHALL display donor details including blood group, distance, and ETA
5. WHEN the map view is active, THE System SHALL update donor positions as location data changes

### Requirement 9: Hospital Blood Bank Integration

**User Story:** As a requester, I want to check blood availability in nearby hospital blood banks, so that I can explore all options for obtaining blood.

#### Acceptance Criteria

1. WHEN a requester searches for blood, THE System SHALL query nearby hospital blood banks for availability
2. WHEN querying blood banks, THE System SHALL search within a configurable radius of the requester's location
3. WHEN blood bank data is retrieved, THE System SHALL display hospital name, distance, and blood availability status
4. WHEN a hospital has the required blood type available, THE System SHALL highlight it in the results
5. WHEN a requester selects a hospital, THE System SHALL display contact information and directions

### Requirement 10: Private Request to Previous Donors

**User Story:** As a requester, I want to send blood requests directly to donors who have helped me before, so that I can reach out to trusted individuals.

#### Acceptance Criteria

1. WHEN a requester has received donations previously, THE System SHALL maintain a list of previous donors
2. WHEN a requester creates a new request, THE System SHALL provide an option to send a private request
3. WHEN a private request is created, THE System SHALL allow the requester to select specific previous donors
4. WHEN a private request is sent, THE System SHALL notify only the selected donors
5. WHEN a private request is sent, THE System SHALL bypass the general matching algorithm for those specific donors

### Requirement 11: Reliability Scoring

**User Story:** As a system administrator, I want to track donor reliability, so that the matching algorithm can prioritize dependable donors.

#### Acceptance Criteria

1. WHEN a donor accepts a request and completes the donation, THE System SHALL increase the donor's reliability score
2. WHEN a donor accepts a request but does not complete the donation, THE System SHALL decrease the donor's reliability score
3. WHEN a donor ignores or declines multiple requests, THE System SHALL decrease the donor's reliability score
4. WHEN calculating reliability score, THE System SHALL weight recent actions more heavily than older actions
5. WHEN a donor's reliability score changes, THE System SHALL update the donor profile immediately

### Requirement 12: Future Donation Commitment

**User Story:** As a donor who is currently unavailable, I want to indicate willingness to donate in the future, so that requesters know I'm interested but not available now.

#### Acceptance Criteria

1. WHEN a donor receives a White_Band request and is unavailable, THE System SHALL provide a "Donate in future" option
2. WHEN a donor selects "Donate in future", THE System SHALL record the commitment with the request
3. WHEN a donor commits to future donation, THE System SHALL notify the requester of the commitment
4. WHEN the future donation date approaches, THE System SHALL send a reminder notification to the donor
5. WHERE a donor has committed to future donation, THE System SHALL allow the donor to confirm or cancel the commitment

### Requirement 13: Donation Completion and History

**User Story:** As a donor, I want to record completed donations, so that my eligibility and reliability scores remain accurate.

#### Acceptance Criteria

1. WHEN a donor completes a donation, THE System SHALL allow the donor to mark the donation as complete
2. WHEN a donation is marked complete, THE System SHALL update the donor's last donation date
3. WHEN the last donation date is updated, THE System SHALL recalculate the donor's eligibility score
4. WHEN a donation is completed, THE System SHALL add the donation to the donor's history
5. WHEN a donation is completed, THE System SHALL update the donor's reliability score positively

### Requirement 14: Real-time Traffic Integration

**User Story:** As a requester, I want ETA calculations to consider live traffic conditions, so that I have accurate arrival time estimates.

#### Acceptance Criteria

1. WHEN calculating ETA for a donor, THE System SHALL query live traffic data for the route
2. WHEN traffic data is available, THE System SHALL incorporate traffic delays into the ETA calculation
3. WHEN traffic conditions change significantly, THE System SHALL recalculate and update the ETA
4. WHEN displaying ETA to users, THE System SHALL indicate if traffic data was used in the calculation
5. IF traffic data is unavailable, THEN THE System SHALL calculate ETA based on distance and average speed

### Requirement 15: Notification Management

**User Story:** As a donor, I want to control notification preferences, so that I receive alerts at appropriate times.

#### Acceptance Criteria

1. WHEN a donor accesses settings, THE System SHALL provide notification preference options
2. WHERE notification preferences are configured, THE System SHALL respect the donor's quiet hours
3. WHEN a Red_Band emergency request is created, THE System SHALL override quiet hours and send notifications
4. WHEN a donor disables notifications, THE System SHALL mark the donor as inactive for matching
5. WHEN a donor enables notifications, THE System SHALL mark the donor as active for matching
