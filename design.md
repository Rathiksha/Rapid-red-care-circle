# Design Document

## Introduction

This document provides the technical design for implementing a separate landing page with registration functionality for the Rapid Red Care Circle blood donation application. The design transforms the current single-page application into a two-view system: an impressive landing page for new users and the main dashboard for registered users.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Entry Point                  │
│                      (public/index.html)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Session Check  │
                    │  (localStorage)  │
                    └─────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
    ┌───────────────────────┐   ┌───────────────────────┐
    │   Landing Page View   │   │  Main Dashboard View  │
    │   (New Users)         │   │  (Registered Users)   │
    └───────────────────────┘   └───────────────────────┘
                │                           │
                ▼                           │
    ┌───────────────────────┐              │
    │  Registration Form    │              │
    │  Validation & Submit  │              │
    └───────────────────────┘              │
                │                           │
                ▼                           │
    ┌───────────────────────┐              │
    │  Backend API Call     │              │
    │  /api/auth/register   │              │
    └───────────────────────┘              │
                │                           │
                ▼                           │
    ┌───────────────────────┐              │
    │  Store User Session   │              │
    │  (localStorage)       │              │
    └───────────────────────┘              │
                │                           │
                └───────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  View Transition│
                    │  (Animated)     │
                    └─────────────────┘
```

### Component Structure

The application consists of two main views:

1. **Landing Page Container** (`#landing-page`)
   - Hero Section (branding, statistics, animations)
   - Registration Card (form, validation, submission)

2. **Main Dashboard Container** (`#main-dashboard`)
   - Header with Navigation
   - All existing application features (Donate, Request, Map, History)

3. **Success Toast** (`#success-toast`)
   - Notification component for successful registration

## Data Models

### User Session Object

```javascript
{
  userId: Number,        // Backend-generated user ID
  fullName: String,      // User's full name
  bloodGroup: String,    // Blood group (A+, B+, etc.)
  city: String,          // User's city
  isDonor: Boolean       // Whether user registered as donor
}
```

### Registration Form Data

```javascript
{
  fullName: String,           // Required
  age: Number,                // Required (18-60)
  gender: String,             // Required
  bloodGroup: String,         // Required
  mobileNumber: String,       // Required
  city: String,               // Required
  lastDonationDate: String,   // Optional (ISO date)
  medicalHistory: String,     // Optional
  isDonor: Boolean,           // Required
  password: String            // Auto-set to 'demo123'
}
```

## API Integration

### Registration Endpoint

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "fullName": "string",
  "age": number,
  "gender": "string",
  "bloodGroup": "string",
  "mobileNumber": "string",
  "city": "string",
  "lastDonationDate": "string | null",
  "medicalHistory": "string",
  "isDonor": boolean,
  "password": "string"
}
```

**Success Response (200):**
```json
{
  "userId": number,
  "message": "Registration successful"
}
```

**Error Response (400/500):**
```json
{
  "error": "string"
}
```

## User Interface Design

### Landing Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                      Hero Section                             │
│                                                               │
│                    🩸 (Animated)                              │
│              Rapid Red Care Circle                            │
│        Connecting Lives Through Blood Donation                │
│                                                               │
│     [10,000+ Lives]  [5,000+ Donors]  [24/7 Available]       │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│              ┌─────────────────────────┐                     │
│              │  Registration Card      │                     │
│              │  🩸 Join as a Donor     │                     │
│              │                         │                     │
│              │  [Registration Form]    │                     │
│              │  - Full Name            │                     │
│              │  - Age                  │                     │
│              │  - Gender               │                     │
│              │  - Blood Group          │                     │
│              │  - Mobile Number        │                     │
│              │  - City                 │                     │
│              │  - Last Donation Date   │                     │
│              │  - Medical History      │                     │
│              │  - I am a donor         │                     │
│              │                         │                     │
│              │  [Register Button]      │                     │
│              └─────────────────────────┘                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Color Scheme

- **Primary Red:** `#dc2626` - Main brand color
- **Dark Red:** `#991b1b` - Gradient accent
- **White:** `#ffffff` - Card background
- **Light Gray:** `#f9fafb` - Subtle backgrounds
- **Text Gray:** `#6b7280` - Secondary text
- **Success Green:** `#10b981` - Toast notifications

### Typography Scale

- **Hero Title:** 3.5rem (56px), weight 800
- **Hero Subtitle:** 1.5rem (24px)
- **Card Title:** 2rem (32px)
- **Body Text:** 1rem (16px)
- **Stat Numbers:** 2.5rem (40px), weight 700

### Animation Specifications

1. **Blood Drop Animation**
   - Pulse: 2s ease-in-out infinite (scale 1 → 1.1 → 1)
   - Float: 3s ease-in-out infinite (translateY 0 → -20px → 0)

2. **Landing Page Fade In**
   - Duration: 0.5s
   - Easing: ease
   - Opacity: 0 → 1

3. **Registration Card Slide Up**
   - Duration: 0.6s
   - Easing: ease
   - Transform: translateY(50px) → translateY(0)
   - Opacity: 0 → 1

4. **View Transition**
   - Landing Fade Out: 0.5s ease (opacity 1 → 0)
   - Dashboard Fade In: 0.5s ease (opacity 0 → 1)

5. **Success Toast**
   - Slide In: 0.5s ease (translateX(100px) → translateX(0))
   - Auto-hide: 5s delay

## State Management

### Application States

1. **Initial Load State**
   - Check localStorage for `rapidRedUser`
   - If exists → Show Dashboard (no animation)
   - If not exists → Show Landing Page

2. **Registration In Progress**
   - Form validation active
   - Submit button enabled/disabled based on validation
   - Error messages displayed inline

3. **Registration Success**
   - User session stored in localStorage
   - Landing page fades out
   - Success toast appears
   - Dashboard fades in

4. **Registered User State**
   - Dashboard visible
   - All features accessible
   - User data available in `currentUser` variable

5. **Logout State**
   - localStorage cleared
   - Page reloaded
   - Returns to Landing Page

### State Transitions

```
[Initial Load] → Check localStorage
    ├─ Session Exists → [Dashboard State]
    └─ No Session → [Landing Page State]
        └─ Form Submit → Validate
            ├─ Invalid → [Show Errors]
            └─ Valid → API Call
                ├─ Success → [Transition State] → [Dashboard State]
                └─ Error → [Show Error Message]

[Dashboard State] → Logout → [Landing Page State]
```

## Form Validation Rules

### Client-Side Validation

1. **Full Name**
   - Required: Yes
   - Type: String
   - Min Length: 1 character

2. **Age**
   - Required: Yes
   - Type: Number
   - Range: 18-60 (inclusive)
   - Error Message: "Age must be between 18 and 60 years"

3. **Gender**
   - Required: Yes
   - Type: Select dropdown
   - Options: Male, Female, Other

4. **Blood Group**
   - Required: Yes
   - Type: Select dropdown
   - Options: A+, A-, B+, B-, AB+, AB-, O+, O-

5. **Mobile Number**
   - Required: Yes
   - Type: String
   - Format: Numeric (validation handled by backend)

6. **City**
   - Required: Yes
   - Type: String
   - Min Length: 1 character

7. **Last Donation Date**
   - Required: No
   - Type: Date
   - Format: ISO date string

8. **Medical History**
   - Required: No
   - Type: Textarea
   - Max Length: Unlimited

9. **Is Donor**
   - Required: No (defaults to unchecked)
   - Type: Checkbox
   - Value: Boolean

### Validation Flow

```javascript
function validateForm() {
  // Check required fields
  if (!fullName || !age || !gender || !bloodGroup || !mobileNumber || !city) {
    alert('Please fill in all required fields');
    return false;
  }
  
  // Validate age range
  if (age < 18 || age > 60) {
    alert('Age must be between 18 and 60 years');
    return false;
  }
  
  return true;
}
```

## JavaScript Functions

### Core Functions

1. **checkExistingUser()**
   - Purpose: Check localStorage for existing session on page load
   - Trigger: DOMContentLoaded event
   - Action: If session exists, call `showDashboard(false)`

2. **handleLandingRegistration(event)**
   - Purpose: Handle registration form submission
   - Parameters: Form submit event
   - Steps:
     1. Prevent default form submission
     2. Collect form data
     3. Validate required fields
     4. Validate age range
     5. Call backend API
     6. Handle success/error response
     7. Store session on success
     8. Trigger view transition

3. **showDashboard(animate, userName)**
   - Purpose: Transition from landing page to dashboard
   - Parameters:
     - `animate` (Boolean): Whether to animate transition
     - `userName` (String): User's name for welcome message
   - Steps:
     1. If animate: Add fade-out class to landing page
     2. Show success toast with user name
     3. Wait 500ms for fade-out
     4. Hide landing page, show dashboard
     5. Add show class to dashboard

4. **showToast(message)**
   - Purpose: Display success notification
   - Parameters: Message string
   - Steps:
     1. Set toast message text
     2. Add show class to toast
     3. Auto-hide after 5 seconds

5. **logout()**
   - Purpose: Clear session and return to landing page
   - Steps:
     1. Remove `rapidRedUser` from localStorage
     2. Clear `currentUser` variable
     3. Reload page

### Helper Functions

1. **updateDonorLocation(userId)**
   - Purpose: Update donor's geolocation (existing function)
   - Called after successful registration if user is a donor

## Responsive Design Strategy

### Breakpoints

- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### Mobile Adaptations (< 768px)

```css
@media (max-width: 768px) {
  .hero-title { font-size: 2.5rem; }
  .hero-stats { flex-direction: column; gap: 2rem; }
  .registration-card { padding: 2rem 1rem; width: 100%; }
  .stat-item { width: 50%; }
}
```

### Tablet Adaptations (768px - 1024px)

```css
@media (min-width: 768px) and (max-width: 1024px) {
  .hero-title { font-size: 3rem; }
  .registration-card { width: 90%; }
}
```

## Error Handling

### Error Scenarios

1. **Network Error**
   - Catch: API call fails
   - Action: Display "Registration failed. Please try again."
   - Log: Console error with details

2. **Validation Error**
   - Catch: Client-side validation fails
   - Action: Display specific error message via alert
   - Keep: Form data preserved

3. **Backend Error**
   - Catch: API returns error response
   - Action: Display error message from backend
   - Format: "Registration failed: [error message]"

4. **Duplicate User**
   - Catch: Backend returns duplicate mobile number error
   - Action: Display specific error message
   - Keep: Form data preserved for correction

## Security Considerations

1. **Password Handling**
   - Current: Hardcoded to 'demo123' for demo purposes
   - Production: Should implement proper password input and hashing

2. **Session Storage**
   - Current: localStorage (client-side only)
   - Production: Should use secure HTTP-only cookies with JWT

3. **Input Sanitization**
   - Backend should sanitize all inputs
   - Frontend validation is for UX only

4. **HTTPS**
   - Production deployment must use HTTPS
   - Protects data in transit

## Performance Considerations

1. **Animation Performance**
   - Use CSS transforms (GPU-accelerated)
   - Avoid animating layout properties
   - Use `will-change` for frequently animated elements

2. **Page Load**
   - Minimal JavaScript execution on load
   - CSS animations start immediately
   - No external dependencies loaded

3. **localStorage Access**
   - Single read on page load
   - Single write on registration
   - Minimal performance impact

## Testing Strategy

### Manual Testing Checklist

1. **Landing Page Display**
   - [ ] Landing page shows on first visit
   - [ ] Hero section displays correctly
   - [ ] Blood drop animation works
   - [ ] Registration card is centered

2. **Form Validation**
   - [ ] Required fields validation works
   - [ ] Age validation (18-60) works
   - [ ] Empty form submission prevented

3. **Registration Flow**
   - [ ] Valid form submits successfully
   - [ ] User data saved to backend
   - [ ] Session stored in localStorage

4. **View Transition**
   - [ ] Landing page fades out smoothly
   - [ ] Dashboard fades in smoothly
   - [ ] Success toast appears and auto-hides

5. **Returning User**
   - [ ] Dashboard shows immediately on reload
   - [ ] No landing page visible
   - [ ] User data persists

6. **Logout**
   - [ ] Logout clears session
   - [ ] Page reloads to landing page

7. **Responsive Design**
   - [ ] Mobile layout works correctly
   - [ ] Tablet layout works correctly
   - [ ] Desktop layout works correctly

8. **Error Handling**
   - [ ] Network errors handled gracefully
   - [ ] Backend errors displayed to user
   - [ ] Form data preserved on error

## Implementation Files

### Files to Modify

1. **public/index.html**
   - Add landing page container
   - Wrap existing content in dashboard container
   - Add success toast element
   - Update form IDs with `landing-` prefix
   - Add CSS styles for landing page
   - Add responsive media queries

2. **public/app.js**
   - Add session management variables
   - Add DOMContentLoaded event listener
   - Add `checkExistingUser()` function
   - Add `handleLandingRegistration()` function
   - Add `showDashboard()` function
   - Add `showToast()` function
   - Add `logout()` function

### Files to Create

- **public/index.html.backup** - Backup of original file

## Deployment Considerations

1. **Backup Strategy**
   - Create backup before modifications
   - Test thoroughly before deploying

2. **Rollback Plan**
   - Keep backup files
   - Document original structure
   - Test rollback procedure

3. **Browser Compatibility**
   - Modern browsers (Chrome, Firefox, Safari, Edge)
   - CSS Grid and Flexbox support required
   - localStorage API required

4. **Progressive Enhancement**
   - Core functionality works without animations
   - Graceful degradation for older browsers

## Future Enhancements

1. **Authentication System**
   - Implement proper login/logout
   - Password-based authentication
   - Session management with JWT

2. **Email Verification**
   - Send verification email on registration
   - Verify email before full access

3. **Social Login**
   - Google OAuth integration
   - Facebook login option

4. **Profile Management**
   - Edit profile functionality
   - Change password feature
   - Update preferences

5. **Onboarding Tour**
   - Guided tour after registration
   - Feature highlights
   - Interactive tutorial

## Correctness Properties

### Property 1: Session Persistence
**Validates: Requirement 5**

For any user who successfully registers, their session data must persist across page reloads until explicitly logged out.

**Formal Statement:**
```
∀ user, registration_success(user) ∧ page_reload() 
  → session_exists(user) ∧ dashboard_visible()
```

**Test Strategy:**
1. Register a new user
2. Verify localStorage contains user data
3. Reload the page
4. Assert dashboard is visible
5. Assert landing page is hidden
6. Verify user data matches original registration

### Property 2: View Exclusivity
**Validates: Requirement 1, Requirement 6**

At any given time, exactly one view (landing page OR dashboard) must be visible, never both or neither.

**Formal Statement:**
```
∀ time t, (landing_visible(t) ⊕ dashboard_visible(t))
where ⊕ is XOR (exclusive or)
```

**Test Strategy:**
1. On initial load without session: Assert landing visible AND dashboard hidden
2. After registration: Assert landing hidden AND dashboard visible
3. After logout and reload: Assert landing visible AND dashboard hidden
4. With existing session: Assert landing hidden AND dashboard visible

### Property 3: Registration Validation Consistency
**Validates: Requirement 2**

Form submission must be prevented if and only if validation rules are violated.

**Formal Statement:**
```
∀ form_data, submit_prevented(form_data) ↔ 
  (missing_required_field(form_data) ∨ 
   age_out_of_range(form_data))
```

**Test Strategy:**
1. Generate random form data with various invalid states
2. For each invalid state, verify submission is prevented
3. For valid data, verify submission proceeds
4. Test boundary conditions (age = 17, 18, 60, 61)

### Property 4: Transition Animation Timing
**Validates: Requirement 4**

The view transition must complete within the specified time window and maintain correct visibility states throughout.

**Formal Statement:**
```
∀ registration_success, 
  transition_start_time = t₀ →
  (landing_visible(t) for t ∈ [t₀, t₀ + 500ms]) ∧
  (dashboard_visible(t) for t > t₀ + 500ms)
```

**Test Strategy:**
1. Trigger successful registration
2. Sample visibility states at intervals (0ms, 250ms, 500ms, 750ms)
3. Verify landing page visible during fade-out period
4. Verify dashboard visible after transition completes
5. Verify toast appears during transition

### Property 5: Data Integrity
**Validates: Requirement 3**

User data stored in localStorage must exactly match the data submitted in the registration form.

**Formal Statement:**
```
∀ form_data, registration_success(form_data) →
  stored_data = {
    userId: backend_response.userId,
    fullName: form_data.fullName,
    bloodGroup: form_data.bloodGroup,
    city: form_data.city,
    isDonor: form_data.isDonor
  }
```

**Test Strategy:**
1. Submit registration with known data
2. Retrieve data from localStorage
3. Assert each field matches original input
4. Verify userId is present and valid
5. Test with various combinations of optional fields

## Conclusion

This design provides a comprehensive blueprint for implementing the landing page refactor. The two-view architecture maintains all existing functionality while adding an impressive onboarding experience. The implementation focuses on smooth animations, proper state management, and responsive design to create a professional user experience.

