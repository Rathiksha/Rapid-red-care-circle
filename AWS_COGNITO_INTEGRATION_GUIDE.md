# AWS Cognito Integration Guide

## Overview
Successfully integrated AWS Cognito User Pool authentication for Sign-Up, Sign-In, and Forgot Password functionality.

## AWS Cognito Configuration

### Credentials
- **Region**: `ap-south-1` (Mumbai)
- **User Pool ID**: `ap-south-1_l7SwLmeTj`
- **Client ID**: `1odgn62gkgpkp77qiihlc71vs6`

### Custom Attributes Required in Cognito
Before using this integration, ensure your Cognito User Pool has these custom attributes configured:

1. `custom:blood_group` (String)
2. `custom:age` (String)
3. `custom:city` (String)

**To add custom attributes in AWS Console:**
1. Go to AWS Cognito Console
2. Select your User Pool
3. Go to "Sign-up experience" → "Attributes"
4. Add custom attributes with the names above

## Implementation Details

### 1. Sign-Up Integration

#### Cognito Attributes Mapping
```javascript
Standard Attributes:
- email → User's email address
- name → Full Name
- phone_number → Mobile Number (auto-formatted with +91)
- gender → Gender

Custom Attributes:
- custom:blood_group → Blood Group (A+, B+, O+, etc.)
- custom:age → Age (as string)
- custom:city → City name
```

#### Sign-Up Flow
1. User fills registration form
2. Frontend validates all fields
3. Creates Cognito attribute list
4. Calls `userPool.signUp()` with email and password
5. Cognito sends verification email to user
6. User data stored in localStorage
7. Also registers in local database for donor matching
8. Shows success message and dashboard

#### Error Handling
- `UsernameExistsException`: Email already registered
- `InvalidPasswordException`: Password doesn't meet requirements
- `InvalidParameterException`: Invalid input parameters

### 2. Sign-In Integration

#### Authentication Flow
1. User enters email and password
2. Creates `AuthenticationDetails` object
3. Creates `CognitoUser` object
4. Calls `authenticateUser()` method
5. On success, retrieves user attributes
6. Stores user data in localStorage
7. Shows dashboard

#### Retrieved Attributes
```javascript
{
  sub: "Cognito User ID",
  email: "user@example.com",
  name: "Full Name",
  phone_number: "+911234567890",
  gender: "Male/Female",
  "custom:blood_group": "O+",
  "custom:age": "25",
  "custom:city": "Chennai"
}
```

#### Error Handling
- `NotAuthorizedException`: Incorrect username or password
- `UserNotFoundException`: User not found
- `UserNotConfirmedException`: Email not verified
- `PasswordResetRequiredException`: Password reset required

### 3. Forgot Password Integration

#### Password Reset Flow
1. User clicks "Forgot Password?"
2. Enters email address
3. Creates `CognitoUser` object
4. Calls `forgotPassword()` method
5. Cognito sends verification code to email
6. Shows success message

#### Error Handling
- `UserNotFoundException`: User not found
- `InvalidParameterException`: Invalid email format
- `LimitExceededException`: Too many attempts
- `NotAuthorizedException`: User not authorized

## Installation Steps

### 1. Install Dependencies
```bash
npm install aws-amplify
```

### 2. Files Modified

#### package.json
- Added `aws-amplify` dependency

#### public/index.html
- Added Amazon Cognito Identity JS CDN script

#### public/app.js
- Added Cognito configuration
- Updated `handleLandingRegistration()` for Cognito sign-up
- Updated `handleLandingSignIn()` for Cognito authentication
- Updated `handlePasswordReset()` for Cognito forgot password

## Testing Instructions

### Test Sign-Up
1. Open the app and go to Sign-Up tab
2. Fill in all required fields:
   - Full Name
   - Age (18-60)
   - Gender
   - Blood Group
   - Email (valid format)
   - Mobile Number
   - City
   - Password (min 6 characters)
   - Confirm Password
3. Click "Register Now"
4. Check console for Cognito logs
5. Check email for verification code
6. Should see success message

### Test Sign-In
1. Go to Sign-In tab
2. Enter registered email
3. Enter password
4. Click "Sign In"
5. Check console for authentication logs
6. Should redirect to dashboard
7. Check localStorage for user data

### Test Forgot Password
1. Click "Forgot Password?" link
2. Enter registered email
3. Click "Send Reset Link"
4. Check console for Cognito logs
5. Check email for verification code
6. Should see success toast

## Console Logging

### Sign-Up Logs
```
🔐 Registering with AWS Cognito: {email, name, ...}
📝 Cognito attributes prepared: [{name, value}, ...]
✅ Cognito sign-up successful: {user, userConfirmed, ...}
✅ User data stored in localStorage: {userId, fullName, ...}
```

### Sign-In Logs
```
🔐 Attempting Cognito sign in: user@example.com
✅ Cognito authentication successful
🎫 Access Token: eyJraWQiOiI...
📋 User attributes: [{Name, Value}, ...]
✅ User signed in successfully: {userId, fullName, ...}
```

### Forgot Password Logs
```
🔐 Sending Cognito password reset for: user@example.com
✅ Cognito password reset initiated: {CodeDeliveryDetails}
✅ Password reset code sent successfully
📧 Check your email for the verification code
```

## Error Messages

### User-Friendly Error Messages
All Cognito errors are translated to user-friendly messages:

- **UsernameExistsException** → "This email is already registered."
- **NotAuthorizedException** → "Incorrect username or password."
- **UserNotFoundException** → "User not found. Please check your email."
- **UserNotConfirmedException** → "Please verify your email before signing in."
- **InvalidPasswordException** → "Password does not meet requirements."
- **LimitExceededException** → "Too many attempts. Please try again later."

## Password Requirements

Cognito default password policy:
- Minimum length: 8 characters
- Requires uppercase letters
- Requires lowercase letters
- Requires numbers
- Requires special characters

**Note**: Your app validates minimum 6 characters, but Cognito may enforce stricter rules.

## Email Verification

### Verification Flow
1. User signs up
2. Cognito sends verification email with code
3. User must verify email before signing in
4. If not verified, sign-in shows: "Please verify your email before signing in"

### Manual Verification (AWS Console)
1. Go to Cognito User Pool
2. Select "Users" tab
3. Find the user
4. Click "Confirm user" to manually verify

## Local Database Integration

The app maintains dual authentication:
1. **Cognito**: Primary authentication
2. **Local Database**: For donor matching and app features

When a user signs up:
1. Registers in Cognito (primary)
2. Also registers in local database (secondary)
3. Local database stores additional fields (lastDonationDate, medicalHistory, etc.)

## Troubleshooting

### Issue: "User not found" on sign-in
**Solution**: User may not have completed sign-up or email not verified

### Issue: "Invalid password" error
**Solution**: Check Cognito password policy requirements

### Issue: "Custom attribute not found"
**Solution**: Ensure custom attributes are created in Cognito User Pool

### Issue: Phone number format error
**Solution**: App auto-formats with +91, ensure Cognito accepts this format

### Issue: Email verification not received
**Solution**: 
- Check spam folder
- Verify SES email configuration in Cognito
- Check Cognito email sending limits

## Security Considerations

### Access Tokens
- Access tokens are logged to console (for debugging)
- In production, store tokens securely
- Use tokens for API authentication

### Password Storage
- Passwords never stored locally
- Cognito handles all password hashing
- Use Cognito's secure password reset flow

### User Data
- Sensitive data stored in Cognito
- Local storage only contains non-sensitive user info
- Clear localStorage on logout

## Production Checklist

- [ ] Remove console.log statements with sensitive data
- [ ] Configure Cognito email templates
- [ ] Set up custom domain for Cognito
- [ ] Configure MFA (Multi-Factor Authentication)
- [ ] Set up password policy
- [ ] Configure account recovery options
- [ ] Set up CloudWatch logging
- [ ] Test email delivery
- [ ] Test SMS delivery (if using phone verification)
- [ ] Configure CORS for Cognito endpoints
- [ ] Set up user pool triggers (Lambda)
- [ ] Configure token expiration times

## API Reference

### userPool.signUp()
```javascript
userPool.signUp(username, password, attributeList, validationData, callback)
```

### cognitoUser.authenticateUser()
```javascript
cognitoUser.authenticateUser(authenticationDetails, callbacks)
```

### cognitoUser.forgotPassword()
```javascript
cognitoUser.forgotPassword(callbacks)
```

### cognitoUser.getUserAttributes()
```javascript
cognitoUser.getUserAttributes(callback)
```

## Next Steps

### Implement Password Reset Confirmation
Create a page to handle the verification code:
1. User receives code via email
2. User enters code and new password
3. Call `cognitoUser.confirmPassword(code, newPassword, callbacks)`

### Implement Email Verification
Create a page to handle email verification:
1. User receives code via email
2. User enters code
3. Call `cognitoUser.confirmRegistration(code, forceAliasCreation, callback)`

### Implement MFA
Enable Multi-Factor Authentication:
1. Configure MFA in Cognito User Pool
2. Update sign-in flow to handle MFA challenge
3. Implement TOTP or SMS verification

## Support

For issues with AWS Cognito:
- Check AWS Cognito documentation
- Review CloudWatch logs
- Check Cognito User Pool settings
- Verify custom attributes are created
- Ensure email/SMS services are configured

For app-specific issues:
- Check browser console for detailed error logs
- Verify Cognito credentials in app.js
- Test with a fresh user account
- Clear localStorage and try again
