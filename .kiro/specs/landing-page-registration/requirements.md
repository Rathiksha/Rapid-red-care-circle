# Requirements Document

## Introduction

This document specifies the requirements for refactoring the Rapid Red Care Circle blood donation application to implement a separate landing page with registration functionality. The landing page will serve as the entry point for new users, providing an impressive onboarding experience with a blood donation theme before transitioning to the main dashboard.

## Glossary

- **Landing_Page**: The initial view shown to unregistered users, containing the hero section and registration form
- **Main_Dashboard**: The primary application interface containing navigation and all features (Donate, Request, Map, History)
- **Registration_Form**: The form component that collects user information for donor registration
- **Hero_Section**: The visual welcome area on the landing page featuring blood donation statistics and branding
- **User_Session**: The stored user data in localStorage that persists across page reloads
- **View_Transition**: The animated fade-out/fade-in effect when switching between landing page and dashboard
- **Success_Toast**: The notification message displayed after successful registration
- **Returning_User**: A user who has previously registered and has session data in localStorage

## Requirements

### Requirement 1: Landing Page Display

**User Story:** As a new user, I want to see an impressive landing page when I first visit the application, so that I understand the purpose and can register easily.

#### Acceptance Criteria

1. WHEN the application loads and no user session exists, THE System SHALL display the Landing_Page
2. THE Landing_Page SHALL contain a Hero_Section with blood donation branding and statistics
3. THE Landing_Page SHALL contain a centered Registration_Form card
4. WHILE the Landing_Page is displayed, THE System SHALL hide the Main_Dashboard completely
5. THE Landing_Page SHALL use a red and white color theme consistent with blood donation branding
6. THE Landing_Page SHALL display a blood drop animation in the Hero_Section
7. THE Landing_Page SHALL NOT display any navigation bar or application features

### Requirement 2: Registration Form Validation

**User Story:** As a new user, I want the registration form to validate my inputs, so that I provide correct information.

#### Acceptance Criteria

1. WHEN a user submits the Registration_Form with empty required fields, THE System SHALL prevent submission and display an error message
2. WHEN a user enters an age less than 18 or greater than 60, THE System SHALL reject the input and display an age validation error
3. WHEN a user enters an invalid mobile number format, THE System SHALL reject the input and display a format error
4. THE Registration_Form SHALL require the following fields: full name, age, gender, blood group, mobile number, and city
5. THE Registration_Form SHALL allow optional fields: last donation date and medical history
6. WHEN all required fields are valid, THE System SHALL enable the submit button

### Requirement 3: User Registration and Session Management

**User Story:** As a new user, I want my registration to be saved, so that I don't have to register again on subsequent visits.

#### Acceptance Criteria

1. WHEN a user submits valid registration data, THE System SHALL send the data to the backend API endpoint `/api/auth/register`
2. WHEN the backend returns a successful response, THE System SHALL store the User_Session data in localStorage
3. THE User_Session SHALL contain: userId, fullName, bloodGroup, city, and isDonor status
4. WHEN registration succeeds, THE System SHALL update the donor location if the user registered as a donor
5. IF the backend returns an error, THEN THE System SHALL display the error message to the user

### Requirement 4: View Transition Animation

**User Story:** As a new user, I want a smooth transition after registration, so that the experience feels polished and professional.

#### Acceptance Criteria

1. WHEN registration succeeds, THE System SHALL fade out the Landing_Page over 500 milliseconds
2. WHEN the Landing_Page fade-out completes, THE System SHALL display the Main_Dashboard
3. THE Main_Dashboard SHALL fade in over 500 milliseconds
4. WHEN the View_Transition begins, THE System SHALL display a Success_Toast message
5. THE Success_Toast SHALL contain the text "Welcome, [Name]! You are now logged in."
6. THE Success_Toast SHALL auto-hide after 5 seconds

### Requirement 5: Returning User Experience

**User Story:** As a returning user, I want to go directly to the dashboard, so that I don't have to register again.

#### Acceptance Criteria

1. WHEN the application loads, THE System SHALL check for existing User_Session data in localStorage
2. IF User_Session data exists, THEN THE System SHALL display the Main_Dashboard immediately without animation
3. IF User_Session data exists, THEN THE System SHALL hide the Landing_Page
4. WHEN a Returning_User accesses the application, THE System SHALL NOT show the Registration_Form

### Requirement 6: Dashboard Access Control

**User Story:** As a product owner, I want unregistered users to be unable to access dashboard features, so that registration is enforced.

#### Acceptance Criteria

1. WHILE the Landing_Page is displayed, THE System SHALL prevent access to all Main_Dashboard features
2. THE System SHALL NOT display navigation buttons (Donate, Request, Map, History) until registration is complete
3. WHEN a user completes registration, THE System SHALL enable all Main_Dashboard features
4. THE Main_Dashboard SHALL contain all existing application functionality unchanged

### Requirement 7: Logout Functionality

**User Story:** As a registered user, I want to be able to log out, so that I can clear my session or switch accounts.

#### Acceptance Criteria

1. THE Main_Dashboard SHALL provide a logout function
2. WHEN a user triggers logout, THE System SHALL remove User_Session data from localStorage
3. WHEN logout completes, THE System SHALL reload the page to display the Landing_Page
4. WHEN a user logs out, THE System SHALL clear all session-related state

### Requirement 8: Responsive Design

**User Story:** As a mobile user, I want the landing page to work well on my device, so that I can register from anywhere.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768px, THE Landing_Page SHALL adjust layout for mobile devices
2. WHEN on mobile, THE Hero_Section SHALL reduce font sizes appropriately
3. WHEN on mobile, THE Registration_Form SHALL display as a single column
4. THE Landing_Page SHALL maintain readability and usability across all device sizes
5. THE View_Transition animations SHALL perform smoothly on mobile devices

### Requirement 9: Error Handling

**User Story:** As a new user, I want clear error messages if registration fails, so that I can correct issues and try again.

#### Acceptance Criteria

1. IF the backend API is unavailable, THEN THE System SHALL display a connection error message
2. IF registration fails due to duplicate mobile number, THEN THE System SHALL display a specific error message
3. WHEN an error occurs, THE System SHALL keep the user on the Landing_Page with form data preserved
4. THE System SHALL log all registration errors to the console for debugging
5. WHEN an error is displayed, THE System SHALL provide actionable guidance to the user
