// Rapid Red Care Circle - Frontend JavaScript

// User session management
let currentUser = null;

let map = null;
let markers = [];
let currentUserId = 1; // Demo user ID
let allDonors = []; // Store all donors for best donor calculation
let bestDonorMarker = null;
let routeLine = null;
let userLocation = { lat: 13.0827, lng: 80.2707 }; // Chennai center as user location

// Hospital discovery variables
let currentMapView = 'donors'; // 'donors' or 'hospitals'
let allHospitals = []; // Store all hospitals
let selectedHospital = null; // Currently selected hospital
let userLocationMarker = null; // User's location marker
let lastETAUpdateLocation = null; // Last location when ETAs were calculated
let etaCache = new Map(); // Cache for ETA results

// ETA Configuration
const DISTANCE_MATRIX_CONFIG = {
  apiKey: '', // Will be set from environment
  baseUrl: 'https://maps.googleapis.com/maps/api/distancematrix/json',
  mode: 'driving',
  units: 'metric',
  batchSize: 25,
  cacheTTL: 300000 // 5 minutes in milliseconds
};

// ============================================================================
// GEOLOCATION ERROR CLASS
// ============================================================================

/**
 * Custom error class for geolocation errors
 */
class GeolocationError extends Error {
  constructor(type, message) {
    super(message);
    this.type = type; // PERMISSION_DENIED, TIMEOUT, UNAVAILABLE, UNSUPPORTED
    this.name = 'GeolocationError';
  }
}

// ============================================================================
// GEOLOCATION FUNCTIONS
// ============================================================================

/**
 * Get user's current location using browser geolocation API
 * @returns {Promise<{lat: number, lng: number}>} User coordinates
 * @throws {GeolocationError} with specific error type
 */
async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new GeolocationError('UNSUPPORTED', 
        'Geolocation is not supported by your browser'));
      return;
    }
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        switch(error.code) {
          case error.PERMISSION_DENIED:
            reject(new GeolocationError('PERMISSION_DENIED', 
              'Location access is required to find nearby hospitals'));
            break;
          case error.TIMEOUT:
            reject(new GeolocationError('TIMEOUT', 
              'Unable to determine your location'));
            break;
          default:
            reject(new GeolocationError('UNAVAILABLE', 
              'Geolocation service unavailable'));
        }
      },
      options
    );
  });
}

// Theme management
let currentTheme = 'light';

// Socket.io connection
let socket = null;

// AWS Cognito Configuration
const COGNITO_CONFIG = {
    region: 'ap-south-1',
    userPoolId: 'ap-south-1_l7SwLmeTj',
    clientId: '70ijps4hmn6ncdeqld8taeaf7e'
};

// Initialize Cognito User Pool
const poolData = {
    UserPoolId: COGNITO_CONFIG.userPoolId,
    ClientId: COGNITO_CONFIG.clientId
};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

console.log('🔐 AWS Cognito initialized:', COGNITO_CONFIG);

// Initialize Socket.io connection
function initializeSocket() {
    socket = io('http://localhost:3000');
    
    socket.on('connect', () => {
        console.log('🔌 Connected to server:', socket.id);
        
        // Identify user if logged in
        if (currentUser && currentUser.userId) {
            socket.emit('identify', currentUser.userId);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
    });
    
    // Listen for blood request notifications
    socket.on('bloodRequestNotification', (data) => {
        console.log('📢 Received notification:', data);
        showNotification(data);
    });
}

// Show notification toast
function showNotification(data) {
    const toast = document.getElementById('notification-toast');
    const title = document.getElementById('notification-title');
    const message = document.getElementById('notification-message');
    
    // Remove existing color classes
    toast.classList.remove('red', 'pink', 'white');
    
    // Determine color based on urgency band
    let colorClass = 'white';
    let titleText = 'BLOOD REQUEST';
    
    if (data.urgencyBand === 'RED') {
        colorClass = 'red';
        titleText = 'URGENT REQUIRE OF BLOOD';
    } else if (data.urgencyBand === 'PINK') {
        colorClass = 'pink';
        titleText = 'BLOOD NEEDED WITHIN 24 HOURS';
    } else if (data.urgencyBand === 'WHITE') {
        colorClass = 'white';
        titleText = 'BLOOD REQUEST - AFTER 24 HOURS';
    }
    
    // Add color class
    toast.classList.add(colorClass);
    
    // Set content
    title.textContent = titleText;
    message.textContent = `${data.bloodGroup} blood needed in ${data.area}`;
    
    // Show toast
    toast.classList.add('show');
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 10000);
}

// Close notification manually
function closeNotification() {
    const toast = document.getElementById('notification-toast');
    toast.classList.remove('show');
}

// Simulate notification for testing (Debug Tool)
function simulateNotification(urgencyBand) {
    const mockData = {
        requestId: Math.floor(Math.random() * 10000),
        bloodGroup: ['A+', 'B+', 'O+', 'AB+'][Math.floor(Math.random() * 4)],
        urgencyBand: urgencyBand,
        area: ['Anna Nagar', 'T. Nagar', 'Adyar', 'Velachery'][Math.floor(Math.random() * 4)],
        requiredTimeframe: urgencyBand === 'RED' ? 'immediate' : urgencyBand === 'PINK' ? 'within_24_hours' : 'after_24_hours',
        emergencyWarning: urgencyBand === 'RED',
        timestamp: new Date().toISOString()
    };
    
    console.log('🧪 Simulating notification:', mockData);
    showNotification(mockData);
}

// Forgot Password Modal Functions
function openForgotPasswordModal() {
    const modal = document.getElementById('reset-password-modal');
    modal.classList.add('show');
    
    // Clear previous input
    document.getElementById('reset-email').value = '';
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('reset-password-modal');
    modal.classList.remove('show');
}

// Handle Password Reset
async function handlePasswordReset(event) {
    event.preventDefault();
    
    const email = document.getElementById('reset-email').value;
    
    console.log('🔐 [PASSWORD RESET] Starting password reset flow');
    console.log('📧 [PASSWORD RESET] Email:', email);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.error('❌ [PASSWORD RESET] Validation Error: Invalid email format:', email);
        alert('Please enter a valid email address');
        return;
    }
    
    console.log('✅ [PASSWORD RESET] Email format validated');
    console.log('🔐 [PASSWORD RESET] Initiating Cognito forgotPassword call...');
    
    try {
        // Create Cognito user
        const userData = {
            Username: email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        
        console.log('👤 [PASSWORD RESET] Cognito user object created');
        console.log('🔧 [PASSWORD RESET] User Pool ID:', COGNITO_CONFIG.userPoolId);
        console.log('🔧 [PASSWORD RESET] Client ID:', COGNITO_CONFIG.clientId);
        console.log('🔧 [PASSWORD RESET] Region:', COGNITO_CONFIG.region);
        
        // Request password reset
        await new Promise((resolve, reject) => {
            console.log('📞 [PASSWORD RESET] Calling cognitoUser.forgotPassword()...');
            
            cognitoUser.forgotPassword({
                onSuccess: (data) => {
                    console.log('✅ [PASSWORD RESET] SUCCESS - Cognito password reset initiated');
                    console.log('📊 [PASSWORD RESET] Success data:', JSON.stringify(data, null, 2));
                    resolve(data);
                },
                onFailure: (err) => {
                    console.error('❌ [PASSWORD RESET] FAILURE - Cognito password reset failed');
                    console.error('❌ [PASSWORD RESET] Error object:', err);
                    console.error('❌ [PASSWORD RESET] Error name:', err.name);
                    console.error('❌ [PASSWORD RESET] Error code:', err.code);
                    console.error('❌ [PASSWORD RESET] Error message:', err.message);
                    console.error('❌ [PASSWORD RESET] Full error JSON:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
                    reject(err);
                },
                inputVerificationCode: (data) => {
                    console.log('📝 [PASSWORD RESET] Input verification code callback triggered');
                    console.log('📊 [PASSWORD RESET] Verification data:', data);
                    // This callback is for when verification code is needed
                    // For now, we'll just resolve as the code was sent
                    resolve(data);
                }
            });
        });
        
        console.log('✅ [PASSWORD RESET] Promise resolved successfully');
        
        // Show success message
        showToast('Password reset code sent to your email');
        
        // Close modal
        closeForgotPasswordModal();
        
        console.log('✅ [PASSWORD RESET] Password reset code sent successfully');
        console.log('📧 [PASSWORD RESET] Check your email for the verification code');
        
    } catch (error) {
        console.error('❌ [PASSWORD RESET] CAUGHT ERROR in try-catch block');
        console.error('❌ [PASSWORD RESET] Error object:', error);
        console.error('❌ [PASSWORD RESET] Error type:', typeof error);
        console.error('❌ [PASSWORD RESET] Error name:', error.name);
        console.error('❌ [PASSWORD RESET] Error code:', error.code);
        console.error('❌ [PASSWORD RESET] Error message:', error.message);
        console.error('❌ [PASSWORD RESET] Error stack:', error.stack);
        console.error('❌ [PASSWORD RESET] Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        
        // Log all error properties
        console.error('❌ [PASSWORD RESET] All error properties:');
        for (let key in error) {
            console.error(`   - ${key}:`, error[key]);
        }
        
        // Handle specific Cognito errors
        let errorMessage = 'Password reset failed. ';
        if (error.code === 'UserNotFoundException') {
            errorMessage += 'User not found. Please check your email.';
            console.error('❌ [PASSWORD RESET] Specific error: User not found in Cognito');
        } else if (error.code === 'InvalidParameterException') {
            errorMessage += 'Invalid email format or parameter.';
            console.error('❌ [PASSWORD RESET] Specific error: Invalid parameter');
        } else if (error.code === 'LimitExceededException') {
            errorMessage += 'Too many attempts. Please try again later.';
            console.error('❌ [PASSWORD RESET] Specific error: Rate limit exceeded');
        } else if (error.code === 'NotAuthorizedException') {
            errorMessage += 'User account is not authorized for this action.';
            console.error('❌ [PASSWORD RESET] Specific error: Not authorized');
        } else if (error.code === 'ResourceNotFoundException') {
            errorMessage += 'Cognito User Pool not found. Please check configuration.';
            console.error('❌ [PASSWORD RESET] Specific error: User Pool not found');
        } else if (error.name === 'NetworkError' || error.message.includes('Network')) {
            errorMessage += 'Network error. Please check your internet connection.';
            console.error('❌ [PASSWORD RESET] Specific error: Network issue');
        } else {
            errorMessage += error.message || 'Unknown error occurred.';
            console.error('❌ [PASSWORD RESET] Specific error: Unknown/Other -', error.message);
        }
        
        console.error('❌ [PASSWORD RESET] Displaying error to user:', errorMessage);
        alert(errorMessage + '\n\nCheck console for detailed error information.');
    }
}

// Initialize theme on page load
function initializeTheme() {
    // Load theme from localStorage or default to light
    const savedTheme = localStorage.getItem('rapidRedTheme') || 'light';
    currentTheme = savedTheme;
    applyTheme(currentTheme);
}

// Toggle between light and dark theme
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('rapidRedTheme', currentTheme);
}

// Apply theme to document
function applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
    } else {
        root.removeAttribute('data-theme');
    }
}

// Check for existing user on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme first
    initializeTheme();
    
    // Initialize Socket.io connection
    initializeSocket();
    
    // TEMPORARY: Clear localStorage on first load for fresh start
    // Remove this after testing
    if (!sessionStorage.getItem('dbReset')) {
        console.log('🔄 Clearing localStorage for fresh database start...');
        // Save theme before clearing
        const savedTheme = localStorage.getItem('rapidRedTheme');
        localStorage.clear();
        // Restore theme
        if (savedTheme) {
            localStorage.setItem('rapidRedTheme', savedTheme);
        }
        sessionStorage.setItem('dbReset', 'true');
        console.log('✅ localStorage cleared. You can now register fresh.');
    }
    
    checkExistingUser();
});

// Check if user is already registered
function checkExistingUser() {
    const userData = localStorage.getItem('rapidRedUser');
    
    console.log('Checking for existing user...', userData ? 'User found in localStorage' : 'No user found');
    
    if (userData) {
        currentUser = JSON.parse(userData);
        console.log('Logged in as:', currentUser.fullName);
        showDashboard(false); // Show dashboard without animation
    } else {
        console.log('Showing landing page for new user');
        // Show sign-in tab by default
        switchAuthTab('signin');
    }
}

// Switch between Sign In and Sign Up tabs
function switchAuthTab(tab) {
    const signinContainer = document.getElementById('signin-form-container');
    const signupContainer = document.getElementById('signup-form-container');
    const tabs = document.querySelectorAll('.auth-tab');
    
    if (tab === 'signin') {
        signinContainer.classList.add('active');
        signupContainer.classList.remove('active');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        signinContainer.classList.remove('active');
        signupContainer.classList.add('active');
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

// Handle Landing Page Sign In
async function handleLandingSignIn(event) {
    event.preventDefault();
    
    const emailOrMobile = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    
    console.log('🔐 Attempting Cognito sign in:', emailOrMobile);
    
    try {
        // Create authentication details
        const authenticationData = {
            Username: emailOrMobile,
            Password: password
        };
        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
        
        // Create user data
        const userData = {
            Username: emailOrMobile,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        
        // Authenticate user
        const session = await new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: (result) => {
                    console.log('✅ Cognito authentication successful');
                    console.log('🎫 Access Token:', result.getAccessToken().getJwtToken());
                    resolve(result);
                },
                onFailure: (err) => {
                    console.error('❌ Cognito authentication failed:', err);
                    reject(err);
                },
                newPasswordRequired: (userAttributes, requiredAttributes) => {
                    console.log('⚠️ New password required');
                    reject(new Error('New password required. Please contact support.'));
                }
            });
        });
        
        // Get user attributes
        const userAttributes = await new Promise((resolve, reject) => {
            cognitoUser.getUserAttributes((err, attributes) => {
                if (err) {
                    console.error('❌ Error getting user attributes:', err);
                    reject(err);
                    return;
                }
                console.log('📋 User attributes:', attributes);
                resolve(attributes);
            });
        });
        
        // Parse attributes
        const attributesMap = {};
        userAttributes.forEach(attr => {
            attributesMap[attr.Name] = attr.Value;
        });
        
        console.log('📋 [SIGN IN] Parsed attributes map:', attributesMap);
        console.log('📧 [SIGN IN] Email from attributes:', attributesMap.email);
        console.log('👤 [SIGN IN] Sub (user ID):', attributesMap.sub);
        console.log('🩸 [SIGN IN] Blood Group:', attributesMap['custom:BloodGroup']);
        
        // Store user data
        currentUser = {
            userId: attributesMap.sub || emailOrMobile,
            fullName: attributesMap.name || 'User',
            bloodGroup: attributesMap['custom:BloodGroup'] || 'Unknown',
            city: attributesMap['custom:City'] || 'Unknown',
            email: attributesMap.email || emailOrMobile,
            isDonor: true // Default to true
        };
        localStorage.setItem('rapidRedUser', JSON.stringify(currentUser));
        
        console.log('✅ [SIGN IN] User signed in successfully');
        console.log('✅ [SIGN IN] currentUser object:', currentUser);
        console.log('✅ [SIGN IN] Email stored:', currentUser.email);
        console.log('✅ [SIGN IN] Saved to localStorage');
        
        // Show dashboard with animation and navigate to donate view
        showDashboard(true, currentUser.fullName, 'donate');
        
    } catch (error) {
        console.error('❌ Sign in error:', error);
        
        // Handle specific Cognito errors
        let errorMessage = 'Sign in failed. ';
        if (error.code === 'NotAuthorizedException') {
            errorMessage += 'Incorrect username or password.';
        } else if (error.code === 'UserNotFoundException') {
            errorMessage += 'User not found. Please check your email.';
        } else if (error.code === 'UserNotConfirmedException') {
            // User hasn't verified their email yet
            alert('Please verify your email first. Redirecting to verification page...');
            showVerificationPage(emailOrMobile);
            return; // Don't show the generic error
        } else if (error.code === 'PasswordResetRequiredException') {
            errorMessage += 'Password reset required. Please use Forgot Password.';
        } else {
            errorMessage += error.message || 'Please try again.';
        }
        
        alert(errorMessage);
    }
}

// Handle Landing Page Registration
async function handleLandingRegistration(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('landing-fullName').value.trim();
    const ageValue = document.getElementById('landing-age').value;
    const age = ageValue ? parseInt(ageValue) : null;
    const gender = document.getElementById('landing-gender').value;
    const bloodGroup = document.getElementById('landing-bloodGroup').value.trim();
    const email = document.getElementById('landing-email').value.trim();
    const mobileNumber = document.getElementById('landing-mobileNumber').value.trim();
    const city = document.getElementById('landing-city').value.trim();
    const password = document.getElementById('landing-password').value;
    const confirmPassword = document.getElementById('landing-confirmPassword').value;
    const lastDonationDate = document.getElementById('landing-lastDonationDate').value;
    const medicalHistory = document.getElementById('landing-medicalHistory').value;
    const isDonor = document.getElementById('landing-isDonor').checked;
    
    console.log('📋 [REGISTRATION] Form values extracted:', { 
        fullName, age, gender, bloodGroup, email, mobileNumber, city, 
        password: '***', confirmPassword: '***', isDonor 
    });
    
    // Validate required fields
    if (!fullName || !age || !email || !mobileNumber || !city || !password || !confirmPassword) {
        alert('Please fill in all required fields');
        console.error('❌ [REGISTRATION] Missing required fields');
        return;
    }
    
    // Validate Gender dropdown selection
    if (!gender || gender === '' || gender === 'Select Gender') {
        alert('Please select a Gender from the dropdown');
        console.error('❌ [REGISTRATION] Gender validation failed. Value:', gender);
        return;
    }
    
    // Validate Blood Group text input
    if (!bloodGroup || bloodGroup === '') {
        alert('Please enter your Blood Group (e.g., O+, A-, B+)');
        console.error('❌ [REGISTRATION] Blood Group validation failed. Value:', bloodGroup);
        return;
    }
    
    console.log('✅ [REGISTRATION] Gender and Blood Group validated:', { gender, bloodGroup });
    
    // Validate age
    if (isNaN(age) || age < 18 || age > 60) {
        alert('Age must be between 18 and 60 years');
        console.error('❌ [REGISTRATION] Age validation failed. Value:', age);
        return;
    }
    
    // Validate password match
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        console.error('❌ [REGISTRATION] Password mismatch');
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        console.error('❌ [REGISTRATION] Password too short');
        return;
    }
    
    console.log('✅ [REGISTRATION] All validations passed');
    console.log('🔐 [REGISTRATION] Preparing AWS Cognito sign-up...');
    console.log('📊 [REGISTRATION] Registration data:', { fullName, age, gender, bloodGroup, email, mobileNumber, city, isDonor });
    
    try {
        // Prepare Cognito attributes - ONLY include attributes with valid values
        // AWS Cognito custom attributes CANNOT be empty strings - they must have a value or be omitted
        const attributeList = [
            new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'email', Value: email }),
            new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'name', Value: fullName }),
            new AmazonCognitoIdentity.CognitoUserAttribute({ 
                Name: 'phone_number', 
                Value: mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}` 
            }),
            new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'gender', Value: gender })
        ];
        
        // Add custom attributes ONLY if they have valid non-empty values
        if (bloodGroup && bloodGroup.trim() !== '') {
            attributeList.push(
                new AmazonCognitoIdentity.CognitoUserAttribute({ 
                    Name: 'custom:BloodGroup', 
                    Value: bloodGroup.trim() 
                })
            );
            console.log('✅ [REGISTRATION] Added custom:BloodGroup:', bloodGroup.trim());
        } else {
            console.warn('⚠️ [REGISTRATION] Skipping custom:BloodGroup - empty value');
        }
        
        if (age && !isNaN(age)) {
            attributeList.push(
                new AmazonCognitoIdentity.CognitoUserAttribute({ 
                    Name: 'custom:Age', 
                    Value: String(age) 
                })
            );
            console.log('✅ [REGISTRATION] Added custom:Age:', age);
        } else {
            console.warn('⚠️ [REGISTRATION] Skipping custom:Age - invalid value');
        }
        
        if (city && city.trim() !== '') {
            attributeList.push(
                new AmazonCognitoIdentity.CognitoUserAttribute({ 
                    Name: 'custom:City', 
                    Value: city.trim() 
                })
            );
            console.log('✅ [REGISTRATION] Added custom:City:', city.trim());
        } else {
            console.warn('⚠️ [REGISTRATION] Skipping custom:City - empty value');
        }
        
        console.log('📝 [REGISTRATION] Cognito attributes prepared:', attributeList.map(attr => ({ 
            name: attr.Name, 
            value: attr.Value,
            valueType: typeof attr.Value,
            valueLength: attr.Value ? attr.Value.length : 0
        })));
        
        console.log('🚀 [REGISTRATION] Sending to AWS Cognito with attributes:', {
            email,
            attributes: attributeList.map(attr => `${attr.Name}=${attr.Value}`)
        });
        
        // Sign up with Cognito
        await new Promise((resolve, reject) => {
            console.log('📞 [REGISTRATION] Calling userPool.signUp()...');
            userPool.signUp(email, password, attributeList, null, (err, result) => {
                if (err) {
                    console.error('❌ [REGISTRATION] Cognito sign-up error:', err);
                    console.error('❌ [REGISTRATION] Error code:', err.code);
                    console.error('❌ [REGISTRATION] Error message:', err.message);
                    console.error('❌ [REGISTRATION] Error name:', err.name);
                    reject(err);
                    return;
                }
                console.log('✅ [REGISTRATION] Cognito sign-up successful:', result);
                console.log('✅ [REGISTRATION] User sub:', result.userSub);
                resolve(result);
            });
        });
        
        // Store user data locally
        currentUser = {
            userId: email, // Use email as userId for Cognito
            fullName,
            bloodGroup,
            city,
            email,
            isDonor
        };
        localStorage.setItem('rapidRedUser', JSON.stringify(currentUser));
        
        console.log('✅ [REGISTRATION] User data stored in localStorage');
        console.log('✅ [REGISTRATION] currentUser object:', currentUser);
        console.log('✅ [REGISTRATION] Email stored:', currentUser.email);
        console.log('✅ [REGISTRATION] User ID:', currentUser.userId);
        
        // Also register in local database for donor matching
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName,
                    age,
                    gender,
                    bloodGroup,
                    email,
                    mobileNumber,
                    city,
                    lastDonationDate: lastDonationDate || null,
                    medicalHistory,
                    isDonor,
                    password,
                    cognitoUser: true
                })
            });
            
            const data = await response.json();
            console.log('📊 [REGISTRATION] Local database registration:', data);
            
            // Update donor location if applicable
            if (isDonor && data.userId) {
                await updateDonorLocation(data.userId);
            }
        } catch (dbError) {
            console.warn('⚠️ [REGISTRATION] Local database registration failed (non-critical):', dbError);
        }
        
        // Show success message
        alert('Registration successful! Please check your email to verify your account.');
        
        // Navigate to verification page
        showVerificationPage(email);
        
    } catch (error) {
        console.error('❌ [REGISTRATION] Registration error:', error);
        console.error('❌ [REGISTRATION] Error details:', {
            code: error.code,
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        
        // Handle specific Cognito errors
        let errorMessage = 'Registration failed. ';
        if (error.code === 'UsernameExistsException') {
            errorMessage += 'This email is already registered.';
        } else if (error.code === 'InvalidPasswordException') {
            errorMessage += 'Password does not meet requirements.';
        } else if (error.code === 'InvalidParameterException') {
            errorMessage += error.message || 'Invalid input parameters.';
        } else {
            errorMessage += error.message || 'Please try again.';
        }
        
        alert(errorMessage);
    }
}

// Show Dashboard with Animation
function showDashboard(animate = true, userName = '', initialView = 'donate') {
    const landingPage = document.getElementById('landing-page');
    const dashboard = document.getElementById('main-dashboard');
    
    if (animate) {
        // Fade out landing page
        landingPage.classList.add('fade-out');
        
        // Show success toast
        if (userName) {
            showToast(`Welcome, ${userName}! You are now logged in.`);
        }
        
        // Wait for fade out, then show dashboard
        setTimeout(() => {
            landingPage.style.display = 'none';
            dashboard.style.display = 'block';
            dashboard.classList.add('show');
            
            // Navigate to initial view (donate blood page by default)
            showView(initialView);
        }, 500);
    } else {
        // Instant switch (for returning users)
        landingPage.style.display = 'none';
        dashboard.style.display = 'block';
        dashboard.classList.add('show');
        
        // Navigate to initial view
        showView(initialView);
    }
}

// Show Success Toast
function showToast(message) {
    const toast = document.getElementById('success-toast');
    const messageSpan = document.getElementById('toast-message');
    
    messageSpan.textContent = message;
    toast.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

// Logout Function
function logout() {
    localStorage.removeItem('rapidRedUser');
    currentUser = null;
    
    // Reload page to show landing page
    window.location.reload();
}

// Clear session for testing (accessible from console)
function clearSession() {
    localStorage.removeItem('rapidRedUser');
    currentUser = null;
    window.location.reload();
}

// Clear all localStorage data (for testing)
function clearAllData() {
    localStorage.clear();
    console.log('All localStorage data cleared');
    window.location.reload();
}

// Show Verification Page
function showVerificationPage(email) {
    console.log('📧 [VERIFICATION] Showing verification page for:', email);
    
    // Hide landing page and dashboard
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('main-dashboard').style.display = 'none';
    
    // Show verification page
    const verificationPage = document.getElementById('verification-page');
    verificationPage.style.display = 'block';
    
    // Set email in the form
    document.getElementById('verify-email').value = email;
    
    // Clear any previous code
    document.getElementById('verify-code').value = '';
    
    // Focus on code input
    document.getElementById('verify-code').focus();
}

// Handle Email Verification
async function handleEmailVerification(event) {
    event.preventDefault();
    
    const email = document.getElementById('verify-email').value;
    const code = document.getElementById('verify-code').value;
    
    console.log('📧 [VERIFICATION] Verifying email:', email);
    console.log('📧 [VERIFICATION] Code:', code);
    
    if (!code || code.length !== 6) {
        alert('Please enter a valid 6-digit code');
        return;
    }
    
    try {
        // Create Cognito user
        const userData = {
            Username: email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        
        // Confirm registration
        await new Promise((resolve, reject) => {
            cognitoUser.confirmRegistration(code, true, (err, result) => {
                if (err) {
                    console.error('❌ [VERIFICATION] Confirmation failed:', err);
                    reject(err);
                    return;
                }
                console.log('✅ [VERIFICATION] Confirmation successful:', result);
                resolve(result);
            });
        });
        
        // Show success message
        alert('Email verified successfully! You can now sign in.');
        
        // Navigate back to sign-in page
        backToSignIn();
        
    } catch (error) {
        console.error('❌ [VERIFICATION] Error:', error);
        
        let errorMessage = 'Verification failed. ';
        if (error.code === 'CodeMismatchException') {
            errorMessage += 'Invalid verification code. Please check and try again.';
        } else if (error.code === 'ExpiredCodeException') {
            errorMessage += 'Verification code has expired. Please request a new code.';
        } else if (error.code === 'NotAuthorizedException') {
            errorMessage += 'User is already confirmed.';
        } else {
            errorMessage += error.message || 'Please try again.';
        }
        
        alert(errorMessage);
    }
}

// Resend Verification Code
async function resendVerificationCode() {
    const email = document.getElementById('verify-email').value;
    
    console.log('📧 [VERIFICATION] Resending code to:', email);
    
    try {
        // Create Cognito user
        const userData = {
            Username: email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        
        // Resend confirmation code
        await new Promise((resolve, reject) => {
            cognitoUser.resendConfirmationCode((err, result) => {
                if (err) {
                    console.error('❌ [VERIFICATION] Resend failed:', err);
                    reject(err);
                    return;
                }
                console.log('✅ [VERIFICATION] Code resent:', result);
                resolve(result);
            });
        });
        
        alert('Verification code resent! Please check your email.');
        
    } catch (error) {
        console.error('❌ [VERIFICATION] Resend error:', error);
        alert('Failed to resend code: ' + (error.message || 'Please try again.'));
    }
}

// Back to Sign In
function backToSignIn() {
    console.log('📧 [VERIFICATION] Returning to sign-in page');
    
    // Hide verification page
    document.getElementById('verification-page').style.display = 'none';
    
    // Show landing page
    document.getElementById('landing-page').style.display = 'block';
    
    // Switch to sign-in tab
    switchAuthTab('signin');
}


// View switching
function showView(viewName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Handle event-based calls vs programmatic calls
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Programmatic call - find and activate the correct nav button
        const navButtons = document.querySelectorAll('.nav-btn');
        const viewIndex = ['register', 'donate', 'request', 'map', 'history'].indexOf(viewName);
        if (viewIndex >= 0 && navButtons[viewIndex]) {
            navButtons[viewIndex].classList.add('active');
        }
    }
    
    // Update views
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    // Load data for the view
    if (viewName === 'map') {
        initMap();
        loadDonors();
    } else if (viewName === 'history') {
        loadHistory();
    } else if (viewName === 'register') {
        loadProfileData();
    }
}

// Load profile data into form
async function loadProfileData() {
    console.log('👤 [PROFILE] Loading profile data...');
    
    if (!currentUser) {
        console.log('⚠️ [PROFILE] No current user, form will be empty');
        return;
    }
    
    try {
        const userEmail = currentUser.email || currentUser.userId;
        console.log('📧 [PROFILE] Fetching profile for:', userEmail);
        
        const response = await fetch(`/api/auth/profile?email=${encodeURIComponent(userEmail)}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ [PROFILE] Profile data loaded:', data);
            
            // Populate form fields
            if (data.user) {
                document.getElementById('fullName').value = data.user.full_name || '';
                document.getElementById('age').value = data.user.age || '';
                document.getElementById('gender').value = data.user.gender || '';
                document.getElementById('bloodGroup').value = data.user.blood_group || '';
                document.getElementById('mobileNumber').value = data.user.mobile_number || '';
                document.getElementById('city').value = data.user.city || '';
                document.getElementById('address').value = data.user.address || '';
                document.getElementById('medicalHistory').value = 
                    typeof data.user.medical_history === 'object' 
                        ? data.user.medical_history.notes || '' 
                        : data.user.medical_history || '';
                
                if (data.donor) {
                    document.getElementById('lastDonationDate').value = data.donor.last_donation_date || '';
                    document.getElementById('isDonor').checked = true;
                } else {
                    document.getElementById('isDonor').checked = false;
                }
            }
        } else {
            console.warn('⚠️ [PROFILE] Could not load profile data');
        }
    } catch (error) {
        console.error('❌ [PROFILE] Error loading profile:', error);
    }
}

// Handle registration form submission (kept for backward compatibility)
async function handleRegistration(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const bloodGroup = document.getElementById('bloodGroup').value;
    const mobileNumber = document.getElementById('mobileNumber').value;
    const city = document.getElementById('city').value;
    const address = document.getElementById('address').value;
    const lastDonationDate = document.getElementById('lastDonationDate').value;
    const medicalHistory = document.getElementById('medicalHistory').value;
    const isDonor = document.getElementById('isDonor').checked;
    
    // Validate age
    const ageError = document.getElementById('age-error');
    if (age < 18 || age > 60) {
        ageError.classList.add('show');
        return;
    } else {
        ageError.classList.remove('show');
    }
    
    const successMessage = document.getElementById('registration-success');
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName,
                age,
                gender,
                bloodGroup,
                mobileNumber,
                city,
                address,
                lastDonationDate: lastDonationDate || null,
                medicalHistory,
                isDonor,
                password: 'demo123'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            successMessage.textContent = `✓ Registration successful! Welcome ${fullName}`;
            successMessage.classList.add('show');
            
            // Reset form
            document.getElementById('registration-form').reset();
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successMessage.classList.remove('show');
            }, 5000);
            
            // If donor, update location
            if (isDonor && data.userId) {
                await updateDonorLocation(data.userId);
            }
        } else {
            alert('Registration failed: ' + data.error);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
}

// Handle profile update
async function handleProfileUpdate(event) {
    event.preventDefault();
    
    console.log('👤 [PROFILE] Starting profile update...');
    
    if (!currentUser) {
        console.error('❌ [PROFILE] No current user found');
        alert('Please log in to update your profile');
        return;
    }
    
    const fullName = document.getElementById('fullName').value;
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const bloodGroup = document.getElementById('bloodGroup').value;
    const mobileNumber = document.getElementById('mobileNumber').value;
    const city = document.getElementById('city').value;
    const address = document.getElementById('address').value;
    const lastDonationDate = document.getElementById('lastDonationDate').value;
    const medicalHistory = document.getElementById('medicalHistory').value;
    const isDonor = document.getElementById('isDonor').checked;
    
    console.log('📋 [PROFILE] Form data:', { fullName, age, gender, bloodGroup, city, address });
    
    // Validate age
    const ageError = document.getElementById('age-error');
    if (age < 18 || age > 60) {
        ageError.classList.add('show');
        console.error('❌ [PROFILE] Age validation failed');
        return;
    } else {
        ageError.classList.remove('show');
    }
    
    const successMessage = document.getElementById('registration-success');
    
    try {
        // Get user email for API call
        const userEmail = currentUser.email || currentUser.userId;
        console.log('📧 [PROFILE] User email:', userEmail);
        
        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                fullName,
                age,
                gender,
                bloodGroup,
                mobileNumber,
                city,
                address,
                lastDonationDate: lastDonationDate || null,
                medicalHistory,
                isDonor
            })
        });
        
        const data = await response.json();
        console.log('📊 [PROFILE] Response:', data);
        
        if (response.ok) {
            // Update currentUser object
            currentUser.fullName = fullName;
            currentUser.bloodGroup = bloodGroup;
            currentUser.city = city;
            localStorage.setItem('rapidRedUser', JSON.stringify(currentUser));
            
            console.log('✅ [PROFILE] Profile updated successfully');
            
            successMessage.textContent = '✓ Profile Updated Successfully!';
            successMessage.classList.add('show');
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successMessage.classList.remove('show');
            }, 5000);
        } else {
            console.error('❌ [PROFILE] Update failed:', data.error);
            alert('Profile update failed: ' + data.error);
        }
    } catch (error) {
        console.error('❌ [PROFILE] Error:', error);
        alert('Profile update failed. Please try again.');
    }
}

// Update donor location (using browser geolocation or default)
async function updateDonorLocation(userId) {
    try {
        // Use default New York coordinates for demo
        const lat = 40.7128 + (Math.random() - 0.5) * 0.1;
        const lng = -74.0060 + (Math.random() - 0.5) * 0.1;
        
        await fetch(`/api/donors/${userId}/location`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: lat, longitude: lng })
        });
    } catch (error) {
        console.error('Error updating location:', error);
    }
}

// Initialize map centered on Chennai, India
function initMap() {
    if (map) return;
    
    // Center on Chennai, India (13.0827, 80.2707) with zoom level 12
    map = L.map('map').setView([13.0827, 80.2707], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add dummy donors immediately
    addDummyDonors();
}

// Add dummy donor data for Chennai
function addDummyDonors() {
    // Comprehensive dummy donor data - ALL blood groups in ALL locations
    const locations = [
        { name: 'Anna Nagar', lat: 13.0850, lng: 80.2100 },
        { name: 'T. Nagar', lat: 13.0418, lng: 80.2341 },
        { name: 'Adyar', lat: 13.0012, lng: 80.2565 },
        { name: 'Velachery', lat: 12.9815, lng: 80.2180 },
        { name: 'Egmore', lat: 13.0732, lng: 80.2609 }
    ];
    
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    
    const firstNames = ['Ravi', 'Priya', 'Ahmed', 'Sarah', 'John', 'Lakshmi', 'Kumar', 'Anjali', 
                        'Vijay', 'Meera', 'Arjun', 'Divya', 'Karthik', 'Sneha', 'Rahul', 'Pooja',
                        'Suresh', 'Kavya', 'Arun', 'Nisha', 'Prakash', 'Deepa', 'Manoj', 'Swathi',
                        'Ganesh', 'Preethi', 'Naveen', 'Harini', 'Rajesh', 'Mythili', 'Sanjay', 'Keerthi',
                        'Venkat', 'Ramya', 'Ashok', 'Sangeetha', 'Dinesh', 'Pavithra', 'Mohan', 'Varsha'];
    
    const dummyDonors = [];
    let nameIndex = 0;
    
    // Generate donors for each location and blood group combination
    locations.forEach(location => {
        bloodGroups.forEach(bloodGroup => {
            const name = firstNames[nameIndex % firstNames.length];
            nameIndex++;
            
            // Add slight random offset to coordinates so markers don't overlap
            const latOffset = (Math.random() - 0.5) * 0.01;
            const lngOffset = (Math.random() - 0.5) * 0.01;
            
            dummyDonors.push({
                name: name,
                location: location.name,
                bloodGroup: bloodGroup,
                distance: (Math.random() * 9 + 1).toFixed(1), // Will be recalculated based on search
                eta: Math.floor(Math.random() * 40 + 5), // Will be recalculated
                reliability: Math.floor(Math.random() * 40 + 60), // 60-100%
                eligibility: Math.floor(Math.random() * 30 + 70), // 70-100%
                coordinates: {
                    lat: location.lat + latOffset,
                    lng: location.lng + lngOffset
                }
            });
        });
    });
    
    // Store donors for best donor calculation
    allDonors = [...dummyDonors];
    
    // Create custom red blinking icon
    const redIcon = L.divIcon({
        className: 'blinking-icon',
        html: '<div class="red-marker"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
    
    // Add markers for each dummy donor
    dummyDonors.forEach(donor => {
        const marker = L.marker(
            [donor.coordinates.lat, donor.coordinates.lng],
            { icon: redIcon }
        ).addTo(map);
        
        // Bind popup with donor details
        marker.bindPopup(`
            <div style="font-family: 'Segoe UI', sans-serif; min-width: 200px;">
                <b>Name:</b> ${donor.name}<br>
                <b>Location:</b> ${donor.location}<br>
                <b>Blood:</b> ${donor.bloodGroup}<br>
                <b>Distance:</b> ${donor.distance} km<br>
                <b>ETA:</b> ${donor.eta} min
            </div>
        `);
        
        markers.push(marker);
    });
    
    console.log(`Generated ${dummyDonors.length} dummy donors across ${locations.length} locations`);
}

// Load donors on map (from database)
async function loadDonors() {
    try {
        console.log('🗺️ [MAP] Loading donors...');
        
        const response = await fetch('/api/map/donors');
        const data = await response.json();
        
        console.log('📊 [MAP] Received donors:', data.summary);
        
        // Clear existing markers (except dummy donors if you want to keep them)
        // markers.forEach(marker => map.removeLayer(marker));
        // markers = [];
        
        // Create custom green icon for willing donors (passed eligibility + willing)
        const greenIcon = L.divIcon({
            className: 'willing-donor-icon',
            html: '<div class="green-marker"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
        });
        
        // Create custom red icon for default donors (not willing or not passed eligibility)
        const redIcon = L.divIcon({
            className: 'default-donor-icon',
            html: '<div class="red-marker"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
        });
        
        // Add donor markers from database
        data.donors.forEach(donor => {
            if (donor.coordinates) {
                const reliabilityLevel = getReliabilityLevel(donor.reliabilityScore);
                
                // Choose icon based on willingness and eligibility
                const icon = donor.markerColor === 'green' ? greenIcon : redIcon;
                const statusText = donor.markerColor === 'green' 
                    ? '✅ Willing & Eligible' 
                    : '⚠️ Not Available';
                const statusColor = donor.markerColor === 'green' ? '#22c55e' : '#dc2626';
                
                const marker = L.marker(
                    [donor.coordinates.lat, donor.coordinates.lng],
                    { icon: icon }
                ).addTo(map);
                
                marker.bindPopup(`
                    <div style="min-width: 250px; font-family: 'Segoe UI', sans-serif;">
                        <h3 style="margin-bottom: 0.75rem; color: ${statusColor}; font-size: 1.1rem;">${donor.fullName}</h3>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <strong>Status:</strong> 
                                <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <strong>Blood Group:</strong> 
                                <span style="color: ${statusColor}; font-weight: bold;">${donor.bloodGroup}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <strong>City:</strong> 
                                <span>${donor.city}</span>
                            </div>
                            ${donor.address ? `
                            <div style="display: flex; justify-content: space-between;">
                                <strong>Address:</strong> 
                                <span style="font-size: 0.85rem;">${donor.address}</span>
                            </div>
                            ` : ''}
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <strong>Reliability:</strong> 
                                <span class="badge badge-${reliabilityLevel.class}" style="padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem;">
                                    ${reliabilityLevel.label} (${donor.reliabilityScore}%)
                                </span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <strong>Eligibility:</strong> 
                                <span>${donor.eligibilityScore}%</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <strong>Donations:</strong> 
                                <span>${donor.completedDonations}/${donor.totalDonations}</span>
                            </div>
                        </div>
                    </div>
                `);
                
                markers.push(marker);
            }
        });
        
        console.log('✅ [MAP] Loaded', markers.length, 'donor markers');
        console.log('💚 [MAP] Green markers (willing):', data.summary.willing);
        console.log('🔴 [MAP] Red markers (default):', data.summary.default);
        
        if (data.donors.length === 0) {
            console.log('⚠️ [MAP] No database donors found. Showing dummy donors only.');
        }
    } catch (error) {
        console.error('❌ [MAP] Error loading donors:', error);
        console.log('⚠️ [MAP] Showing dummy donors only.');
    }
}

// Get reliability level
function getReliabilityLevel(score) {
    if (score >= 80) return { label: 'High', class: 'high' };
    if (score >= 60) return { label: 'Medium', class: 'medium' };
    return { label: 'Low', class: 'low' };
}

// Load history with card-based layout
async function loadHistory() {
    try {
        const response = await fetch(`/api/history/requester/${currentUserId}`);
        const data = await response.json();
        
        // Display accepted donations
        const acceptedList = document.getElementById('accepted-list');
        if (data.accepted.length === 0) {
            acceptedList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>No Accepted Donations Yet</h3>
                    <p>Accepted donations will appear here</p>
                </div>
            `;
        } else {
            acceptedList.innerHTML = data.accepted.map(d => `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3>${d.donorName}</h3>
                            <span class="badge badge-${d.urgencyBand?.toLowerCase()}">${d.urgencyBand || 'N/A'}</span>
                        </div>
                        <div class="card-icon">✅</div>
                    </div>
                    <div class="card-info">
                        <div class="info-row">
                            <span class="info-label">Blood Group</span>
                            <span class="info-value">${d.bloodGroup}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">City</span>
                            <span class="info-value">${d.city}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Type</span>
                            <span class="info-value">${d.donationType || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Status</span>
                            <span class="info-value">${d.status}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Accepted</span>
                            <span class="info-value">${new Date(d.acceptedAt).toLocaleDateString()}</span>
                        </div>
                        ${d.completedAt ? `
                        <div class="info-row">
                            <span class="info-label">Completed</span>
                            <span class="info-value">${new Date(d.completedAt).toLocaleDateString()}</span>
                        </div>
                        ` : ''}
                    </div>
                    <button class="btn-private" style="width: 100%; margin-top: 1rem;" onclick="openPrivateRequestModal(${d.donorId}, '${d.donorName}')">
                        💬 Private Request
                    </button>
                </div>
            `).join('');
        }
        
        // Display future commitments
        const futureList = document.getElementById('future-list');
        if (data.futureCommitments.length === 0) {
            futureList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🤝</div>
                    <h3>No Future Commitments Yet</h3>
                    <p>Future donation commitments will appear here</p>
                </div>
            `;
        } else {
            futureList.innerHTML = data.futureCommitments.map(d => `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3>${d.donorName}</h3>
                            <span class="badge badge-${d.urgencyBand?.toLowerCase()}">${d.urgencyBand}</span>
                        </div>
                        <div class="card-icon">📅</div>
                    </div>
                    <div class="card-info">
                        <div class="info-row">
                            <span class="info-label">Blood Group</span>
                            <span class="info-value">${d.bloodGroup}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">City</span>
                            <span class="info-value">${d.city}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Committed</span>
                            <span class="info-value">${new Date(d.respondedAt).toLocaleDateString()}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Request Date</span>
                            <span class="info-value">${new Date(d.requestDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading history:', error);
        alert('Failed to load history');
    }
}

// Create sample data
async function createSampleData() {
    const successMessage = document.getElementById('registration-success');
    successMessage.textContent = 'Creating sample data...';
    successMessage.classList.add('show');
    
    try {
        const donors = [
            { fullName: 'John Doe', age: 25, gender: 'Male', mobileNumber: '+1234567890', city: 'New York', bloodGroup: 'O+', lat: 40.7128, lng: -74.0060 },
            { fullName: 'Jane Smith', age: 30, gender: 'Female', mobileNumber: '+1234567891', city: 'New York', bloodGroup: 'A+', lat: 40.7580, lng: -73.9855 },
            { fullName: 'Bob Johnson', age: 35, gender: 'Male', mobileNumber: '+1234567892', city: 'New York', bloodGroup: 'B+', lat: 40.7489, lng: -73.9680 },
            { fullName: 'Alice Williams', age: 28, gender: 'Female', mobileNumber: '+1234567893', city: 'New York', bloodGroup: 'AB+', lat: 40.7614, lng: -73.9776 }
        ];
        
        const donorIds = [];
        
        for (const donor of donors) {
            const userResponse = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...donor,
                    password: 'demo123',
                    isDonor: true,
                    lastDonationDate: '2024-01-15',
                    medicalHistory: ''
                })
            });
            
            const userData = await userResponse.json();
            
            if (userData.userId && userData.isDonor) {
                donorIds.push(userData.userId);
                
                await fetch(`/api/donors/${userData.userId}/location`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        latitude: donor.lat,
                        longitude: donor.lng
                    })
                });
            }
        }
        
        successMessage.textContent = `✓ Sample data created! ${donors.length} donors added. Check the Map View.`;
        
        setTimeout(() => {
            successMessage.classList.remove('show');
        }, 5000);
    } catch (error) {
        console.error('Error creating sample data:', error);
        successMessage.textContent = `✗ Error: ${error.message}`;
    }
}


// Find Best Donor Feature
async function findBestDonor() {
    const fabButton = document.querySelector('.fab');
    fabButton.classList.add('scanning');
    fabButton.innerHTML = '<span>🔍</span><span>SCANNING...</span>';
    
    // Create radar pulse effect
    createRadarPulse();
    
    // Wait 3 seconds for "calculating" animation
    setTimeout(() => {
        const bestDonor = calculateBestDonor();
        
        if (bestDonor) {
            highlightBestDonor(bestDonor);
            drawRouteToBestDonor(bestDonor);
            showBestDonorModal(bestDonor);
        }
        
        // Reset button
        fabButton.classList.remove('scanning');
        fabButton.innerHTML = '<span>🎯</span><span>FIND BEST DONOR</span>';
    }, 3000);
}

// Calculate Best Donor using weighted scoring algorithm
function calculateBestDonor() {
    if (allDonors.length === 0) {
        alert('No donors available');
        return null;
    }
    
    const scoredDonors = allDonors.map(donor => {
        // Distance Score (30%): Closer is better
        const distanceScore = Math.max(0, 100 - (parseFloat(donor.distance) * 5));
        
        // ETA Score (20%): Lower time is better
        const etaScore = Math.max(0, 100 - (donor.eta * 2));
        
        // Reliability Score (30%): Use existing reliability
        let reliabilityScore = 50; // Default
        if (donor.reliability) {
            reliabilityScore = donor.reliability;
        } else if (donor.reliabilityScore) {
            reliabilityScore = donor.reliabilityScore;
        }
        
        // Eligibility Score (20%): Use existing eligibility
        let eligibilityScore = 80; // Default
        if (donor.eligibility) {
            eligibilityScore = donor.eligibility;
        } else if (donor.eligibilityScore) {
            eligibilityScore = donor.eligibilityScore;
        }
        
        // Calculate weighted total score
        const totalScore = (
            (distanceScore * 0.30) +
            (etaScore * 0.20) +
            (reliabilityScore * 0.30) +
            (eligibilityScore * 0.20)
        );
        
        return {
            ...donor,
            score: Math.round(totalScore),
            breakdown: {
                distance: Math.round(distanceScore * 0.30),
                eta: Math.round(etaScore * 0.20),
                reliability: Math.round(reliabilityScore * 0.30),
                eligibility: Math.round(eligibilityScore * 0.20)
            }
        };
    });
    
    // Sort by score (highest first)
    scoredDonors.sort((a, b) => b.score - a.score);
    
    return scoredDonors[0];
}

// Highlight the best donor with green marker
function highlightBestDonor(donor) {
    // Remove previous best donor marker if exists
    if (bestDonorMarker) {
        map.removeLayer(bestDonorMarker);
    }
    
    // Create green pulsing icon
    const greenIcon = L.divIcon({
        className: '',
        html: '<div class="green-marker"></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
    
    // Add green marker
    bestDonorMarker = L.marker(
        [donor.coordinates.lat, donor.coordinates.lng],
        { icon: greenIcon }
    ).addTo(map);
    
    // Bind popup
    bestDonorMarker.bindPopup(`
        <div style="font-family: 'Segoe UI', sans-serif; min-width: 200px;">
            <h3 style="color: #10b981; margin-bottom: 0.5rem;">🏆 BEST MATCH</h3>
            <b>Name:</b> ${donor.name}<br>
            <b>Blood:</b> ${donor.bloodGroup}<br>
            <b>Distance:</b> ${donor.distance} km<br>
            <b>ETA:</b> ${donor.eta} min<br>
            <b>Score:</b> <span style="color: #10b981; font-weight: bold;">${donor.score}/100</span>
        </div>
    `).openPopup();
    
    // Pan to best donor
    map.setView([donor.coordinates.lat, donor.coordinates.lng], 14, {
        animate: true,
        duration: 1
    });
}

// Draw route from user to best donor
function drawRouteToBestDonor(donor) {
    // Remove previous route if exists
    if (routeLine) {
        map.removeLayer(routeLine);
    }
    
    // Draw blue polyline
    const latlngs = [
        [userLocation.lat, userLocation.lng],
        [donor.coordinates.lat, donor.coordinates.lng]
    ];
    
    routeLine = L.polyline(latlngs, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
        lineJoin: 'round'
    }).addTo(map);
    
    // Add user location marker
    const userIcon = L.divIcon({
        className: '',
        html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.6);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    
    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Your Location</b>');
}

// Show best donor result modal
function showBestDonorModal(donor) {
    const modal = document.getElementById('bestDonorModal');
    const scoreElement = document.getElementById('modalScore');
    const detailsElement = document.getElementById('modalDetails');
    
    scoreElement.textContent = `${donor.score}/100`;
    
    detailsElement.innerHTML = `
        <div class="modal-detail-row">
            <strong>Donor Name:</strong>
            <span>${donor.name}</span>
        </div>
        <div class="modal-detail-row">
            <strong>Blood Group:</strong>
            <span style="color: #dc2626; font-weight: bold;">${donor.bloodGroup}</span>
        </div>
        <div class="modal-detail-row">
            <strong>Distance:</strong>
            <span>${donor.distance} km</span>
        </div>
        <div class="modal-detail-row">
            <strong>ETA:</strong>
            <span>${donor.eta} minutes</span>
        </div>
        <div class="modal-detail-row">
            <strong>Reliability:</strong>
            <span>${donor.reliability || donor.reliabilityScore || 50}%</span>
        </div>
        <div class="modal-detail-row">
            <strong>Eligibility:</strong>
            <span>${donor.eligibility || donor.eligibilityScore || 80}%</span>
        </div>
        <hr style="margin: 1rem 0; border: none; border-top: 2px solid #e5e7eb;">
        <div style="font-size: 0.875rem; color: #6b7280; margin-top: 1rem;">
            <strong>Score Breakdown:</strong><br>
            Distance (30%): ${donor.breakdown.distance} points<br>
            ETA (20%): ${donor.breakdown.eta} points<br>
            Reliability (30%): ${donor.breakdown.reliability} points<br>
            Eligibility (20%): ${donor.breakdown.eligibility} points
        </div>
    `;
    
    modal.classList.add('show');
}

// Close modal
function closeModal() {
    document.getElementById('bestDonorModal').classList.remove('show');
}

// Request donor (placeholder)
function requestDonor() {
    alert('Request sent to donor! They will be notified immediately.');
    closeModal();
}

// Create radar pulse animation
function createRadarPulse() {
    const mapContainer = document.getElementById('map');
    const pulse = document.createElement('div');
    pulse.className = 'radar-pulse';
    pulse.style.position = 'absolute';
    pulse.style.top = '50%';
    pulse.style.left = '50%';
    pulse.style.transform = 'translate(-50%, -50%)';
    
    mapContainer.appendChild(pulse);
    
    setTimeout(() => {
        pulse.remove();
    }, 3000);
}


// Private Request Feature
let isEmergencyRequest = false;
let activeTimeouts = {}; // Store active timeout timers

// Open Private Request Modal
function openPrivateRequestModal(donorId, donorName) {
    document.getElementById('privateRequestDonorId').value = donorId;
    document.getElementById('privateRequestDonorName').textContent = donorName;
    document.getElementById('privateRequestMessage').value = '';
    
    // Reset emergency toggle
    isEmergencyRequest = false;
    const toggle = document.getElementById('emergencyToggle');
    const container = document.getElementById('emergencyToggleContainer');
    toggle.classList.remove('active');
    container.classList.remove('emergency');
    
    document.getElementById('privateRequestModal').classList.add('show');
}

// Close Private Request Modal
function closePrivateRequestModal() {
    document.getElementById('privateRequestModal').classList.remove('show');
}

// Toggle Emergency Status
function toggleEmergency() {
    isEmergencyRequest = !isEmergencyRequest;
    const toggle = document.getElementById('emergencyToggle');
    const container = document.getElementById('emergencyToggleContainer');
    
    if (isEmergencyRequest) {
        toggle.classList.add('active');
        container.classList.add('emergency');
    } else {
        toggle.classList.remove('active');
        container.classList.remove('emergency');
    }
}

// Handle Private Request Submission
async function handlePrivateRequest(event) {
    event.preventDefault();
    
    const donorId = document.getElementById('privateRequestDonorId').value;
    const donorName = document.getElementById('privateRequestDonorName').textContent;
    const message = document.getElementById('privateRequestMessage').value;
    
    try {
        // Create a mock request ID (in real app, this would come from backend)
        const requestId = `req_${Date.now()}`;
        
        // Close modal
        closePrivateRequestModal();
        
        // Show success message
        alert(`Private request sent to ${donorName}!${isEmergencyRequest ? '\n\nEmergency timeout: 10 seconds for testing.' : ''}`);
        
        // If emergency, start timeout timer
        if (isEmergencyRequest) {
            startTimeoutTimer(requestId, donorId, donorName);
        }
        
        // In a real app, you would send this to the backend:
        // await fetch('/api/requests/private', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         donorId,
        //         message,
        //         isEmergency: isEmergencyRequest,
        //         requesterId: currentUserId
        //     })
        // });
        
    } catch (error) {
        console.error('Error sending private request:', error);
        alert('Failed to send private request. Please try again.');
    }
}

// Start Timeout Timer (10 seconds for testing)
function startTimeoutTimer(requestId, donorId, donorName) {
    console.log(`Starting 10-second timeout for request ${requestId} to donor ${donorName}`);
    
    // Store the timeout
    activeTimeouts[requestId] = {
        donorId,
        donorName,
        startTime: Date.now(),
        timer: setTimeout(() => {
            handleTimeout(requestId, donorId, donorName);
        }, 10000) // 10 seconds for testing (20 minutes = 1200000 ms for production)
    };
    
    // Show countdown notification
    showCountdownNotification(requestId, donorName, 10);
}

// Show Countdown Notification
function showCountdownNotification(requestId, donorName, seconds) {
    let remainingSeconds = seconds;
    
    const notification = document.getElementById('timeoutNotification');
    const message = document.getElementById('timeoutNotificationMessage');
    
    message.innerHTML = `Waiting for <strong>${donorName}</strong> to respond... <span class="countdown-timer" id="countdown-${requestId}">${remainingSeconds}s</span>`;
    notification.classList.add('show');
    
    // Update countdown every second
    const countdownInterval = setInterval(() => {
        remainingSeconds--;
        const countdownElement = document.getElementById(`countdown-${requestId}`);
        
        if (countdownElement) {
            countdownElement.textContent = `${remainingSeconds}s`;
        }
        
        if (remainingSeconds <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
    
    // Store interval for cleanup
    if (activeTimeouts[requestId]) {
        activeTimeouts[requestId].countdownInterval = countdownInterval;
    }
}

// Handle Timeout (Auto-rejection)
function handleTimeout(requestId, donorId, donorName) {
    console.log(`Timeout occurred for request ${requestId} to donor ${donorName}`);
    
    // Clear countdown interval
    if (activeTimeouts[requestId] && activeTimeouts[requestId].countdownInterval) {
        clearInterval(activeTimeouts[requestId].countdownInterval);
    }
    
    // Show "Not Available" notification
    showTimeoutNotification(donorName);
    
    // Clean up timeout data
    delete activeTimeouts[requestId];
    
    // In a real app, you would:
    // 1. Update request status to "EXPIRED" in backend
    // 2. Send notification to requester
    // 3. Move to next donor in the list
    // await fetch(`/api/requests/${requestId}/timeout`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ donorId })
    // });
}

// Show Timeout Notification
function showTimeoutNotification(donorName) {
    const notification = document.getElementById('timeoutNotification');
    const message = document.getElementById('timeoutNotificationMessage');
    
    message.innerHTML = `<strong>${donorName}</strong> did not respond in time. The request has been marked as "Not Available".`;
    notification.classList.add('show');
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 8000);
}

// Cancel Timeout (if donor responds)
function cancelTimeout(requestId) {
    if (activeTimeouts[requestId]) {
        clearTimeout(activeTimeouts[requestId].timer);
        
        if (activeTimeouts[requestId].countdownInterval) {
            clearInterval(activeTimeouts[requestId].countdownInterval);
        }
        
        delete activeTimeouts[requestId];
        
        // Hide notification
        document.getElementById('timeoutNotification').classList.remove('show');
        
        console.log(`Timeout cancelled for request ${requestId}`);
    }
}


// Eligibility Questionnaire Feature
const eligibilityQuestions = [
    { id: 1, text: "Do you feel well and healthy today?", correctAnswer: "YES", category: "General Health" },
    { id: 2, text: "Did you sleep well last night (at least 5 hours)?", correctAnswer: "YES", category: "General Health" },
    { id: 3, text: "Did you take fatty food in the last 6 hours?", correctAnswer: "NO", category: "General Health" },
    { id: 4, text: "Any chronic disease or health problem?", correctAnswer: "NO", category: "General Health" },
    { id: 5, text: "Taking antibiotics or medication for infection in last 7 days?", correctAnswer: "NO", category: "General Health" },
    { id: 6, text: "Taken aspirin/pain killers in last 48 hours?", correctAnswer: "NO", category: "General Health" },
    { id: 7, text: "Taking biotin or herbal supplements regularly?", correctAnswer: "NO", category: "General Health" },
    { id: 8, text: "Drunk alcohol in last 24 hours?", correctAnswer: "NO", category: "General Health" },
    { id: 9, text: "Pregnant, breastfeeding, or given birth in last 6 months?", correctAnswer: "NO", category: "Risk Factors" },
    { id: 10, text: "Engaged in risky sexual behavior or new partners in last 6 months?", correctAnswer: "NO", category: "Risk Factors" },
    { id: 11, text: "History of drug use, needle sharing, or imprisonment?", correctAnswer: "NO", category: "Risk Factors" },
    { id: 12, text: "Any dental procedures, piercings, or tattoos in last 4 months?", correctAnswer: "NO", category: "Risk Factors" },
    { id: 13, text: "Had diarrhea or minor surgery in last 7 days?", correctAnswer: "NO", category: "Risk Factors" },
    { id: 14, text: "Traveled to malaria-risk areas in last 3 years?", correctAnswer: "NO", category: "Risk Factors" },
    { id: 15, text: "Lived in UK/France/Ireland between 1980-1996 (Mad Cow risk)?", correctAnswer: "NO", category: "Risk Factors" },
    { id: 16, text: "Ever tested positive for HIV, Hepatitis B/C, or Syphilis?", correctAnswer: "NO", category: "Risk Factors" },
    { id: 17, text: "Are you confident your blood is safe for transfusion?", correctAnswer: "YES", category: "Final Declaration" }
];

let questionAnswers = {};

// Open Eligibility Modal
function openEligibilityModal() {
    // Reset answers
    questionAnswers = {};
    
    // Hide result alert
    document.getElementById('resultAlert').classList.remove('show');
    
    // Auto-fill personal details if user is registered
    // (In a real app, you'd fetch this from the backend)
    
    // Generate questions
    renderQuestions();
    
    // Show modal
    document.getElementById('eligibilityModal').classList.add('show');
    
    // Scroll to top
    document.getElementById('eligibilityContent').scrollTop = 0;
}

// Close Eligibility Modal
function closeEligibilityModal() {
    document.getElementById('eligibilityModal').classList.remove('show');
}

// Render Questions
function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    
    let currentCategory = '';
    let html = '';
    
    eligibilityQuestions.forEach(q => {
        // Add category header if new category
        if (q.category !== currentCategory) {
            if (currentCategory !== '') {
                html += '<div style="margin-bottom: 2rem;"></div>';
            }
            html += `<h4 style="color: #dc2626; font-size: 1.1rem; margin-bottom: 1rem;">${q.category}</h4>`;
            currentCategory = q.category;
        }
        
        html += `
            <div class="question-item" id="question-${q.id}">
                <div class="question-header">
                    <div class="question-text">${q.text}</div>
                    <div class="question-number">${q.id}</div>
                </div>
                <div class="question-toggle">
                    <div class="toggle-option" onclick="answerQuestion(${q.id}, 'YES')">
                        ✓ YES
                    </div>
                    <div class="toggle-option" onclick="answerQuestion(${q.id}, 'NO')">
                        ✗ NO
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Answer Question
function answerQuestion(questionId, answer) {
    // Store answer
    questionAnswers[questionId] = answer;
    
    // Update UI
    const questionItem = document.getElementById(`question-${questionId}`);
    const toggles = questionItem.querySelectorAll('.toggle-option');
    
    toggles.forEach(toggle => {
        toggle.classList.remove('selected-yes', 'selected-no');
    });
    
    if (answer === 'YES') {
        toggles[0].classList.add('selected-yes');
    } else {
        toggles[1].classList.add('selected-no');
    }
    
    // Remove error/success classes
    questionItem.classList.remove('error', 'success');
}

// Check Eligibility
function checkEligibility() {
    // Validate personal details
    const fullName = document.getElementById('eligFullName').value;
    const dob = document.getElementById('eligDOB').value;
    const age = parseInt(document.getElementById('eligAge').value);
    const gender = document.getElementById('eligGender').value;
    const weight = parseInt(document.getElementById('eligWeight').value);
    const mobile = document.getElementById('eligMobile').value;
    
    if (!fullName || !dob || !age || !gender || !weight || !mobile) {
        showResult('error', '❌ Incomplete Information', 'Please fill in all required personal details.');
        return;
    }
    
    if (age < 18 || age > 60) {
        showResult('error', '❌ Age Requirement Not Met', 'Donors must be between 18 and 60 years old.');
        return;
    }
    
    if (weight < 45) {
        showResult('error', '❌ Weight Requirement Not Met', 'Donors must weigh at least 45 kg.');
        return;
    }
    
    // Check if all questions are answered
    if (Object.keys(questionAnswers).length < eligibilityQuestions.length) {
        showResult('error', '❌ Incomplete Questionnaire', 'Please answer all health questions.');
        return;
    }
    
    // Validate answers
    let failedQuestions = [];
    
    eligibilityQuestions.forEach(q => {
        const userAnswer = questionAnswers[q.id];
        const questionItem = document.getElementById(`question-${q.id}`);
        
        if (userAnswer === q.correctAnswer) {
            questionItem.classList.add('success');
            questionItem.classList.remove('error');
        } else {
            questionItem.classList.add('error');
            questionItem.classList.remove('success');
            failedQuestions.push(q);
        }
    });
    
    // Show result
    if (failedQuestions.length > 0) {
        const failedList = failedQuestions.map(q => `Question ${q.id}: ${q.text}`).join('<br>');
        showResult(
            'error',
            '❌ Not Eligible',
            `Based on your responses, you cannot donate today.<br><br><strong>Failed Questions:</strong><br>${failedList}<br><br>Please consult with a healthcare professional or try again when eligible.`
        );
        
        // Scroll to first failed question
        const firstFailed = document.getElementById(`question-${failedQuestions[0].id}`);
        firstFailed.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // Mark eligibility as passed
        console.log('✅ [ELIGIBILITY] User passed all eligibility checks');
        
        showResult(
            'success',
            '✅ Eligible to Donate!',
            `Congratulations ${fullName}! You have passed the eligibility test.<br><br>You are cleared to proceed with blood donation.<br><br><strong>Are you willing to donate blood?</strong><br><br><button class="btn btn-emergency" onclick="confirmWillingness()" style="margin-top: 1rem; width: 100%;">✅ Yes, I'm Willing to Donate</button><br><button class="btn btn-future" onclick="closeEligibilityModal()" style="margin-top: 0.5rem; width: 100%;">❌ Not Right Now</button>`
        );
    }
}

// Show Result
function showResult(type, title, message) {
    const alert = document.getElementById('resultAlert');
    const icon = document.getElementById('resultIcon');
    const messageDiv = document.getElementById('resultMessage');
    
    alert.className = `result-alert ${type} show`;
    icon.textContent = type === 'success' ? '✅' : '❌';
    messageDiv.innerHTML = `<strong>${title}</strong><br>${message}`;
    
    // Scroll to top to show result
    document.getElementById('eligibilityContent').scrollTop = 0;
}

// Confirm willingness to donate
async function confirmWillingness() {
    console.log('💚 [WILLINGNESS] ========================================');
    console.log('💚 [WILLINGNESS] User confirmed willingness to donate');
    
    if (!currentUser) {
        console.error('❌ [WILLINGNESS] No current user found');
        alert('Please log in to proceed');
        return;
    }
    
    // Get user email
    let userEmail = currentUser.email || (currentUser.userId && currentUser.userId.includes('@') ? currentUser.userId : null);
    
    console.log('📧 [WILLINGNESS] User email:', userEmail);
    
    if (!userEmail) {
        console.error('❌ [WILLINGNESS] No email found for user');
        alert('Unable to identify user email. Please log in again.');
        return;
    }
    
    try {
        // Show loading message
        showToast('💚 Confirming your willingness to donate...');
        
        console.log('🚀 [WILLINGNESS] Sending willingness confirmation to backend...');
        
        // Send willingness confirmation to backend
        const response = await fetch('/api/donors/willingness', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail,
                isWilling: true,
                passedEligibility: true
            })
        });
        
        const data = await response.json();
        console.log('📊 [WILLINGNESS] Response:', data);
        
        if (!response.ok) {
            console.error('❌ [WILLINGNESS] Failed:', data.error);
            throw new Error(data.error || 'Failed to confirm willingness');
        }
        
        console.log('✅ [WILLINGNESS] Willingness confirmed successfully');
        console.log('💚 [WILLINGNESS] ========================================');
        
        // Close eligibility modal
        closeEligibilityModal();
        
        // Show confirmation message
        showToast('✅ Confirmed! You are now a willing donor and visible on the map to requesters!');
        
        // Navigate to request view to show the map
        setTimeout(() => {
            showView('request');
        }, 2000);
        
    } catch (error) {
        console.error('❌ [WILLINGNESS] Error:', error);
        alert(`Failed to confirm willingness: ${error.message}\n\nPlease try again.`);
    }
}

// Proceed to Live Map - DEPRECATED - Kept for backward compatibility
async function proceedToLiveMap() {
    console.log('🗺️ [LIVE MAP] ========================================');
    console.log('🗺️ [LIVE MAP] Proceeding to live map...');
    console.log('🗺️ [LIVE MAP] Current user object:', currentUser);
    console.log('🗺️ [LIVE MAP] ========================================');
    
    if (!currentUser) {
        console.error('❌ [LIVE MAP] No current user found');
        alert('Please log in to proceed');
        return;
    }
    
    // Get user email - prioritize email field, fallback to userId if it's an email
    let userEmail = currentUser.email || (currentUser.userId && currentUser.userId.includes('@') ? currentUser.userId : null);
    
    console.log('🔍 [LIVE MAP] Email detection:');
    console.log('   - currentUser.email:', currentUser.email);
    console.log('   - currentUser.userId:', currentUser.userId);
    console.log('   - Detected email:', userEmail);
    
    // If still no email, try to get it from Cognito session
    if (!userEmail) {
        console.log('⚠️ [LIVE MAP] No email in currentUser, attempting to fetch from Cognito...');
        try {
            const cognitoUser = userPool.getCurrentUser();
            if (cognitoUser) {
                console.log('🔐 [LIVE MAP] Cognito user found, getting session...');
                await new Promise((resolve, reject) => {
                    cognitoUser.getSession((err, session) => {
                        if (err) {
                            console.error('❌ [LIVE MAP] Error getting Cognito session:', err);
                            reject(err);
                            return;
                        }
                        console.log('✅ [LIVE MAP] Cognito session retrieved');
                        
                        cognitoUser.getUserAttributes((err, attributes) => {
                            if (err) {
                                console.error('❌ [LIVE MAP] Error getting user attributes:', err);
                                reject(err);
                                return;
                            }
                            
                            console.log('📋 [LIVE MAP] Cognito attributes:', attributes);
                            const emailAttr = attributes.find(attr => attr.Name === 'email');
                            if (emailAttr) {
                                userEmail = emailAttr.Value;
                                console.log('✅ [LIVE MAP] Email retrieved from Cognito:', userEmail);
                                
                                // Update currentUser object
                                currentUser.email = userEmail;
                                localStorage.setItem('rapidRedUser', JSON.stringify(currentUser));
                            }
                            resolve();
                        });
                    });
                });
            } else {
                console.warn('⚠️ [LIVE MAP] No Cognito user session found');
            }
        } catch (cognitoError) {
            console.error('❌ [LIVE MAP] Failed to retrieve email from Cognito:', cognitoError);
        }
    }
    
    if (!userEmail) {
        console.error('❌ [LIVE MAP] ========================================');
        console.error('❌ [LIVE MAP] CRITICAL: No email found for user');
        console.error('❌ [LIVE MAP] currentUser:', currentUser);
        console.error('❌ [LIVE MAP] ========================================');
        alert('Unable to identify user email. Please log in again.');
        return;
    }
    
    console.log('✅ [LIVE MAP] Using email:', userEmail);
    console.log('✅ [LIVE MAP] Email type:', typeof userEmail);
    console.log('✅ [LIVE MAP] Email length:', userEmail.length);
    console.log('✅ [LIVE MAP] Email trimmed:', userEmail.trim());
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
        console.error('❌ [LIVE MAP] Geolocation not supported');
        alert('Geolocation is not supported by your browser. Please enable location services.');
        return;
    }
    
    // Show loading state
    showToast('📍 Getting your location...');
    
    try {
        // Request user's current location
        console.log('📍 [LIVE MAP] Requesting geolocation...');
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });
        
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        console.log('✅ [LIVE MAP] Location obtained:');
        console.log('   - Latitude:', latitude);
        console.log('   - Longitude:', longitude);
        console.log('   - Accuracy:', position.coords.accuracy, 'meters');
        
        // Prepare payload
        const payload = {
            is_available: true,
            latitude: latitude,
            longitude: longitude
        };
        
        // Encode email for URL (handle special characters)
        const encodedEmail = encodeURIComponent(userEmail.trim());
        const apiUrl = `/api/donors/${encodedEmail}/availability`;
        
        console.log('📦 [LIVE MAP] ========================================');
        console.log('📦 [LIVE MAP] Preparing API request');
        console.log('📦 [LIVE MAP] Raw email:', userEmail);
        console.log('📦 [LIVE MAP] Trimmed email:', userEmail.trim());
        console.log('📦 [LIVE MAP] Encoded email:', encodedEmail);
        console.log('📦 [LIVE MAP] API URL:', apiUrl);
        console.log('📦 [LIVE MAP] Payload:', JSON.stringify(payload, null, 2));
        console.log('📦 [LIVE MAP] ========================================');
        
        // Update donor availability and location in backend
        console.log('🚀 [LIVE MAP] Sending PUT request...');
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log('📡 [LIVE MAP] ========================================');
        console.log('📡 [LIVE MAP] Response received');
        console.log('📡 [LIVE MAP] Status:', response.status, response.statusText);
        console.log('📡 [LIVE MAP] OK:', response.ok);
        console.log('📡 [LIVE MAP] ========================================');
        
        // Try to parse response
        let data;
        const contentType = response.headers.get('content-type');
        console.log('📄 [LIVE MAP] Response content-type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
            console.log('📊 [LIVE MAP] Response data:', JSON.stringify(data, null, 2));
        } else {
            const text = await response.text();
            console.log('📄 [LIVE MAP] Response text:', text);
            data = { message: text };
        }
        
        if (!response.ok) {
            console.error('❌ [LIVE MAP] ========================================');
            console.error('❌ [LIVE MAP] Backend request FAILED');
            console.error('❌ [LIVE MAP] Status:', response.status);
            console.error('❌ [LIVE MAP] Status Text:', response.statusText);
            console.error('❌ [LIVE MAP] Error:', data.error);
            console.error('❌ [LIVE MAP] Message:', data.message);
            console.error('❌ [LIVE MAP] Details:', data.details);
            if (data.availableEmails) {
                console.error('❌ [LIVE MAP] Available emails in DB:', data.availableEmails);
            }
            console.error('❌ [LIVE MAP] ========================================');
            throw new Error(data.error || data.message || `Server returned ${response.status}`);
        }
        
        console.log('✅ [LIVE MAP] ========================================');
        console.log('✅ [LIVE MAP] SUCCESS! Availability updated');
        console.log('✅ [LIVE MAP] Response:', data);
        console.log('✅ [LIVE MAP] ========================================');
        
        // Close eligibility modal
        closeEligibilityModal();
        
        // Show success message
        showToast('🎉 You are now available to donate! Navigating to Find Donor map...');
        
        // Navigate to request (Find Donor) view instead of map view
        setTimeout(() => {
            console.log('🗺️ [LIVE MAP] Navigating to request (Find Donor) view...');
            showView('request');
            
            // Initialize map if needed
            if (!map) {
                console.log('🗺️ [LIVE MAP] Initializing map...');
                initMap();
            }
            
            // Center map on user's location
            console.log('🗺️ [LIVE MAP] Centering map on user location:', { latitude, longitude });
            map.setView([latitude, longitude], 14);
            
            // Add user marker
            const userIcon = L.divIcon({
                className: 'user-location-marker',
                html: '<div style="background: #22c55e; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            
            L.marker([latitude, longitude], { icon: userIcon })
                .addTo(map)
                .bindPopup(`<b>Your Location</b><br>You are now available to donate!`)
                .openPopup();
            
            console.log('✅ [LIVE MAP] Navigation to Find Donor view complete');
                
        }, 1500);
        
    } catch (error) {
        console.error('❌ [LIVE MAP] ========================================');
        console.error('❌ [LIVE MAP] ERROR occurred');
        console.error('❌ [LIVE MAP] Error type:', error.name);
        console.error('❌ [LIVE MAP] Error message:', error.message);
        console.error('❌ [LIVE MAP] Error stack:', error.stack);
        console.error('❌ [LIVE MAP] Full error object:', error);
        console.error('❌ [LIVE MAP] ========================================');
        
        // Check if it's a geolocation error
        if (error.code) {
            console.error('❌ [LIVE MAP] Geolocation error code:', error.code);
            if (error.code === 1) {
                alert('Location access denied. Please enable location permissions in your browser settings to proceed.');
            } else if (error.code === 2) {
                alert('Unable to determine your location. Please check your device settings.');
            } else if (error.code === 3) {
                alert('Location request timed out. Please try again.');
            }
        } else {
            // Backend or network error
            console.error('❌ [LIVE MAP] Backend/Network error');
            alert(`Failed to update your availability: ${error.message}\n\nPlease check the browser console for detailed error information.`);
        }
    }
}


// Request Blood Workflow
let currentBloodGroupFilter = '';
let currentSortFilter = 'distance'; // default sort
let searchLocation = null; // Store search location coordinates

// Chennai Area Coordinates Lookup
const chennaiAreas = {
    'anna nagar': { lat: 13.0850, lng: 80.2100, name: 'Anna Nagar' },
    'annanagar': { lat: 13.0850, lng: 80.2100, name: 'Anna Nagar' },
    't nagar': { lat: 13.0418, lng: 80.2341, name: 'T. Nagar' },
    't.nagar': { lat: 13.0418, lng: 80.2341, name: 'T. Nagar' },
    'tnagar': { lat: 13.0418, lng: 80.2341, name: 'T. Nagar' },
    'adyar': { lat: 13.0012, lng: 80.2565, name: 'Adyar' },
    'velachery': { lat: 12.9815, lng: 80.2180, name: 'Velachery' },
    'egmore': { lat: 13.0732, lng: 80.2609, name: 'Egmore' },
    'chennai': { lat: 13.0827, lng: 80.2707, name: 'Chennai' } // Default
};

// Handle Blood Request Form Submission
function handleBloodRequest(event) {
    event.preventDefault();
    
    const bloodGroup = document.getElementById('requestBloodGroup').value;
    const urgency = document.getElementById('requestUrgency').value;
    const area = document.getElementById('requestArea').value.trim();
    
    if (!bloodGroup || !urgency || !area) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Lookup area coordinates
    const areaKey = area.toLowerCase().replace(/\s+/g, ' ');
    searchLocation = chennaiAreas[areaKey] || chennaiAreas['chennai'];
    
    // Store request data
    currentBloodGroupFilter = bloodGroup;
    
    // Navigate to map view
    showView('map');
    
    // Update the nav button
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[3].classList.add('active'); // Map is 4th button
    
    // Initialize map if not already done
    initMap();
    
    // Center map on searched location with zoom level 14
    map.setView([searchLocation.lat, searchLocation.lng], 14);
    
    // Set the blood group filter
    document.getElementById('mapBloodGroupFilter').value = bloodGroup;
    
    // Filter donors by blood group and location
    filterDonorsByBloodGroup();
    
    // Show success message
    setTimeout(() => {
        alert(`Found ${bloodGroup} donors near ${searchLocation.name}`);
    }, 500);
}

// Filter Donors by Blood Group
function filterDonorsByBloodGroup() {
    const selectedBloodGroup = document.getElementById('mapBloodGroupFilter').value;
    currentBloodGroupFilter = selectedBloodGroup;
    
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Filter donors
    let filteredDonors = [...allDonors];
    
    // Filter by blood group only (no distance restriction)
    if (selectedBloodGroup) {
        filteredDonors = filteredDonors.filter(d => d.bloodGroup === selectedBloodGroup);
    }
    
    // Calculate actual distances from search location if set
    if (searchLocation) {
        filteredDonors = filteredDonors.map(donor => {
            const calculatedDistance = calculateDistance(
                searchLocation.lat,
                searchLocation.lng,
                donor.coordinates.lat,
                donor.coordinates.lng
            );
            return {
                ...donor,
                distance: calculatedDistance.toFixed(1),
                eta: Math.round(calculatedDistance / 40 * 60) // Calculate ETA at 40km/h
            };
        });
    }
    
    // Sort donors based on current filter
    filteredDonors = sortDonors(filteredDonors);
    
    // Add markers for filtered donors
    addFilteredDonors(filteredDonors);
    
    // Update message
    if (filteredDonors.length === 0) {
        const locationText = searchLocation ? ` near ${searchLocation.name}` : ' in this area';
        alert(`No ${selectedBloodGroup || 'available'} donors found${locationText}.`);
    }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

// Sort Donors
function sortDonors(donors) {
    const sorted = [...donors];
    
    switch (currentSortFilter) {
        case 'eta':
            sorted.sort((a, b) => a.eta - b.eta);
            break;
        case 'reliability':
            sorted.sort((a, b) => b.reliability - a.reliability);
            break;
        case 'distance':
        default:
            sorted.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
            break;
    }
    
    return sorted;
}

// Add Filtered Donors to Map
function addFilteredDonors(donors) {
    // Create custom red blinking icon
    const redIcon = L.divIcon({
        className: 'blinking-icon',
        html: '<div class="red-marker"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
    
    donors.forEach((donor, index) => {
        const marker = L.marker(
            [donor.coordinates.lat, donor.coordinates.lng],
            { icon: redIcon }
        ).addTo(map);
        
        // Create enhanced popup with real-time metrics
        const reliabilityLevel = getReliabilityLabel(donor.reliability);
        const eligibilityLevel = getEligibilityLabel(donor.eligibility);
        
        marker.bindPopup(`
            <div class="donor-info-card">
                <div class="donor-info-header">
                    <div class="donor-info-name">${donor.name}</div>
                    <div class="donor-info-blood">${donor.bloodGroup}</div>
                </div>
                <div class="donor-info-row">
                    <span class="donor-info-label">📍 Location:</span>
                    <span class="donor-info-value">${donor.location || 'Chennai'}</span>
                </div>
                <div class="donor-info-row">
                    <span class="donor-info-label">🚗 Distance:</span>
                    <span class="donor-info-value">${donor.distance} km</span>
                </div>
                <div class="donor-info-row">
                    <span class="donor-info-label">⏱️ ETA:</span>
                    <span class="donor-info-value">${donor.eta} mins</span>
                </div>
                <div class="donor-info-row">
                    <span class="donor-info-label">✅ Eligibility:</span>
                    <span class="donor-info-value" style="color: ${eligibilityLevel.color};">${eligibilityLevel.label} (${donor.eligibility}%)</span>
                </div>
                <div class="donor-info-row">
                    <span class="donor-info-label">⭐ Reliability:</span>
                    <span class="donor-info-value" style="color: ${reliabilityLevel.color};">${reliabilityLevel.label} (${donor.reliability}%)</span>
                </div>
                <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 2px solid #fee2e2;">
                    <div style="font-size: 0.75rem; color: #6b7280; text-align: center;">
                        Rank: #${index + 1} ${currentSortFilter === 'eta' ? '(Best ETA)' : currentSortFilter === 'reliability' ? '(Most Reliable)' : '(Closest)'}
                    </div>
                </div>
            </div>
        `);
        
        markers.push(marker);
    });
    
    // If there are donors, fit map to show all markers
    if (donors.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Get Reliability Label
function getReliabilityLabel(score) {
    if (score >= 80) return { label: 'High', color: '#10b981' };
    if (score >= 60) return { label: 'Medium', color: '#f59e0b' };
    return { label: 'Low', color: '#ef4444' };
}

// Get Eligibility Label
function getEligibilityLabel(score) {
    if (score >= 85) return { label: 'Excellent', color: '#10b981' };
    if (score >= 70) return { label: 'Good', color: '#3b82f6' };
    if (score >= 50) return { label: 'Fair', color: '#f59e0b' };
    return { label: 'Limited', color: '#ef4444' };
}

// Toggle Filter Dropdown
function toggleFilterDropdown() {
    const dropdown = document.getElementById('filterDropdown');
    const btn = document.getElementById('filterBtn');
    
    dropdown.classList.toggle('show');
    btn.classList.toggle('active');
}

// Set Sort Filter
function setSortFilter(filter) {
    currentSortFilter = filter;
    
    // Update active state
    document.querySelectorAll('.filter-option').forEach(opt => {
        opt.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Close dropdown
    toggleFilterDropdown();
    
    // Re-filter and sort
    filterDonorsByBloodGroup();
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('filterDropdown');
    const btn = document.getElementById('filterBtn');
    
    if (dropdown && btn && !dropdown.contains(event.target) && !btn.contains(event.target)) {
        dropdown.classList.remove('show');
        btn.classList.remove('active');
    }
});


// ============================================
// HOSPITAL DISCOVERY FEATURE
// ============================================

/**
 * Switch between donors and hospitals view (MODIFIED)
 * Changes:
 * - Clear user location marker when switching to donors
 * - Ensure user location marker persists in hospital view
 */
function switchMapView(view) {
    console.log('🔄 Switching map view to:', view);
    currentMapView = view;
    
    // Update toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        }
    });
    
    // Update FAB button
    const fabButton = document.getElementById('mapFabButton');
    if (view === 'donors') {
        fabButton.innerHTML = '<span>🎯</span><span>FIND BEST DONOR</span>';
    } else {
        fabButton.innerHTML = '<span>🏥</span><span>FIND BEST HOSPITAL</span>';
    }
    
    // Clear existing markers
    clearMarkers();
    
    // NEW: Clear user location marker when switching to donors
    if (view === 'donors' && userLocationMarker) {
        map.removeLayer(userLocationMarker);
        userLocationMarker = null;
    }
    
    // Load appropriate data
    if (view === 'donors') {
        loadDonors();
    } else {
        loadHospitals(); // This will create new user location marker
    }
}

/**
 * Load nearby hospitals (MODIFIED for UX improvements)
 * Changes:
 * - Get user location from geolocation API instead of hardcoded
 * - Make blood group filter optional (don't require it)
 * - Display user location marker
 */
async function loadHospitals() {
    try {
        console.log('🏥 Loading nearby hospitals...');
        showLoadingIndicator('geolocation');
        
        // NEW: Get actual user location
        const location = await getUserLocation();
        userLocation = location;
        console.log('📍 User location obtained:', location);
        
        // NEW: Display user location marker
        displayUserLocationMarker(location);
        
        showLoadingIndicator('hospitals');
        
        // MODIFIED: Blood group is now optional
        const bloodGroup = document.getElementById('mapBloodGroupFilter').value || null;
        
        const params = new URLSearchParams({
            latitude: location.lat,
            longitude: location.lng,
            radius: 20
        });
        
        if (bloodGroup) {
            params.append('bloodGroup', bloodGroup);
        }
        
        const response = await fetch(`/api/hospitals/nearby?${params}`);
        const data = await response.json();
        
        allHospitals = data.hospitals || [];
        console.log(`✅ Loaded ${allHospitals.length} hospitals`);
        
        // NEW: Fetch ETAs for all hospitals
        if (allHospitals.length > 0) {
            showLoadingIndicator('eta');
            
            const destinations = allHospitals.map(h => ({
                lat: h.coordinates.lat,
                lng: h.coordinates.lng,
                hospitalId: h.id
            }));
            
            const etas = await fetchETAsForHospitals(location, destinations);
            
            // Merge ETA data with hospital data
            allHospitals.forEach(hospital => {
                const eta = etas.get(hospital.id);
                hospital.eta = eta || null;
            });
            
            lastETAUpdateLocation = {...location};
            console.log(`✅ Fetched ETAs for ${etas.size} hospitals`);
        }
        
        displayHospitalMarkers(allHospitals);
        hideLoadingIndicator('hospitals');
        
    } catch (error) {
        console.error('❌ Error loading hospitals:', error);
        hideLoadingIndicator('hospitals');
        handleGeolocationError(error);
    }
}

/**
 * Display hospital markers on map (MODIFIED)
 * Changes:
 * - Include ETA in popup if available
 * - Show fallback message if ETA unavailable
 * - Use blue markers with ⚕️ icon
 * - Update map bounds to include user marker
 */
function displayHospitalMarkers(hospitals) {
    console.log('📍 Displaying', hospitals.length, 'hospital markers');
    
    hospitals.forEach(hospital => {
        if (!hospital.coordinates) return;
        
        // Create hospital icon (blue with ⚕️)
        const hospitalIcon = L.divIcon({
            className: 'hospital-marker-icon',
            html: '<div class="hospital-marker">⚕️</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18]
        });
        
        // Create marker
        const marker = L.marker(
            [hospital.coordinates.lat, hospital.coordinates.lng],
            { icon: hospitalIcon }
        );
        
        // NEW: Build popup with ETA
        let popupContent = `
            <div style="font-family: 'Segoe UI', sans-serif; min-width: 220px;">
                <h3 style="color: #2563eb; margin-bottom: 0.5rem;">🏥 ${hospital.name}</h3>
        `;
        
        // ETA (primary) or distance (fallback)
        if (hospital.eta && hospital.eta.duration) {
            popupContent += `<b>Travel Time:</b> ${hospital.eta.durationText}<br>`;
            popupContent += `<b>Distance:</b> ${hospital.distance} km<br>`;
        } else {
            popupContent += `<b>Distance:</b> ${hospital.distance} km<br>`;
            popupContent += `<small style="color: #6b7280;">Traffic data unavailable</small><br>`;
        }
        
        popupContent += `
                <b>Rating:</b> ⭐ ${hospital.serviceRating}/5<br>
                <b>Priority Score:</b> <span style="color: #2563eb; font-weight: bold;">${hospital.priorityScore}/100</span>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Add click handler
        marker.on('click', () => showHospitalDetails(hospital.id));
        
        marker.addTo(map);
        markers.push(marker);
    });
    
    // NEW: Fit map to show all hospitals AND user location
    if (hospitals.length > 0 && userLocationMarker) {
        const bounds = L.latLngBounds([
            ...hospitals.map(h => [h.coordinates.lat, h.coordinates.lng]),
            userLocationMarker.getLatLng()
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
    } else if (hospitals.length > 0) {
        const bounds = L.latLngBounds(
            hospitals.map(h => [h.coordinates.lat, h.coordinates.lng])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}


/**
 * Show hospital details modal
 */
async function showHospitalDetails(hospitalId) {
    try {
        console.log('🏥 Loading hospital details:', hospitalId);
        
        const response = await fetch(
            `/api/hospitals/${hospitalId}?latitude=${userLocation.lat}&longitude=${userLocation.lng}`
        );
        const hospital = await response.json();
        
        selectedHospital = hospital;
        
        // Populate modal
        document.getElementById('hospitalName').textContent = hospital.name;
        document.getElementById('hospitalAddress').textContent = hospital.address || 'Address not available';
        document.getElementById('hospitalDistance').textContent = hospital.distance ? `${hospital.distance} km` : 'N/A';
        document.getElementById('hospitalRating').textContent = `${hospital.serviceRating}/5`;
        document.getElementById('hospitalContact').textContent = hospital.contact || hospital.emergencyContact || 'N/A';
        
        // Display blood inventory
        displayBloodInventory(hospital.bloodAvailability);
        
        // Update last updated time
        if (hospital.lastUpdated) {
            const lastUpdated = new Date(hospital.lastUpdated);
            const now = new Date();
            const hoursDiff = Math.floor((now - lastUpdated) / (1000 * 60 * 60));
            
            let timeText = '';
            if (hoursDiff < 1) {
                timeText = 'Less than 1 hour ago';
            } else if (hoursDiff < 24) {
                timeText = `${hoursDiff} hour${hoursDiff > 1 ? 's' : ''} ago`;
            } else {
                const daysDiff = Math.floor(hoursDiff / 24);
                timeText = `${daysDiff} day${daysDiff > 1 ? 's' : ''} ago`;
            }
            
            document.getElementById('inventoryLastUpdated').textContent = `Last updated: ${timeText}`;
            
            // Show warning if stale
            if (hoursDiff > 24) {
                document.getElementById('inventoryLastUpdated').style.color = '#ef4444';
                document.getElementById('inventoryLastUpdated').textContent += ' ⚠️ Data may be outdated';
            }
        }
        
        // Show modal
        document.getElementById('hospitalModal').classList.add('show');
        
        console.log('✅ Hospital details displayed');
    } catch (error) {
        console.error('❌ Error loading hospital details:', error);
        showToast('Failed to load hospital details');
    }
}

/**
 * Display blood inventory grid
 */
function displayBloodInventory(availability) {
    const bloodTypes = ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'];
    const grid = document.getElementById('bloodInventoryGrid');
    grid.innerHTML = '';
    
    bloodTypes.forEach(type => {
        const data = availability[type];
        const units = data ? data.units : 0;
        const isAvailable = units > 0;
        
        const card = document.createElement('div');
        card.className = `blood-card ${isAvailable ? 'available' : 'unavailable'}`;
        card.innerHTML = `
            <div class="blood-type">${type}</div>
            <div class="blood-units">${units}</div>
            <div class="blood-label">units</div>
        `;
        grid.appendChild(card);
    });
}

/**
 * Close hospital modal
 */
function closeHospitalModal() {
    document.getElementById('hospitalModal').classList.remove('show');
    selectedHospital = null;
}

/**
 * Contact hospital (initiate phone call)
 */
function contactHospital() {
    if (!selectedHospital) return;
    
    const phone = selectedHospital.emergencyContact || selectedHospital.contact;
    if (phone) {
        window.location.href = `tel:${phone}`;
    } else {
        showToast('Contact number not available');
    }
}

/**
 * Navigate to hospital (open in Google Maps)
 */
function navigateToHospital() {
    if (!selectedHospital || !selectedHospital.coordinates) {
        showToast('Location not available');
        return;
    }
    
    const { lat, lng } = selectedHospital.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

/**
 * Handle FAB button click (context-aware)
 */
function handleFabClick() {
    if (currentMapView === 'donors') {
        findBestDonor();
    } else {
        findBestHospital();
    }
}

/**
 * Find best hospital using smart priority algorithm
 */
async function findBestHospital() {
    const fabButton = document.getElementById('mapFabButton');
    fabButton.classList.add('scanning');
    fabButton.innerHTML = '<span>🔍</span><span>SCANNING...</span>';
    
    try {
        const bloodGroup = document.getElementById('mapBloodGroupFilter').value;
        
        if (!bloodGroup) {
            showToast('Please select a blood group first');
            fabButton.classList.remove('scanning');
            fabButton.innerHTML = '<span>🏥</span><span>FIND BEST HOSPITAL</span>';
            return;
        }
        
        const params = new URLSearchParams({
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            bloodGroup: bloodGroup,
            urgency: 'routine'
        });
        
        const response = await fetch(`/api/hospitals/search?${params}`);
        const data = await response.json();
        
        if (data.topRecommendations && data.topRecommendations.length > 0) {
            const bestHospital = data.topRecommendations[0];
            
            // Highlight on map
            highlightBestHospital(bestHospital);
            
            // Show details
            setTimeout(() => {
                showHospitalDetails(bestHospital.id);
            }, 1000);
        } else {
            showToast('No hospitals found with required blood type');
        }
    } catch (error) {
        console.error('❌ Error finding best hospital:', error);
        showToast('Failed to find best hospital');
    } finally {
        setTimeout(() => {
            fabButton.classList.remove('scanning');
            fabButton.innerHTML = '<span>🏥</span><span>FIND BEST HOSPITAL</span>';
        }, 2000);
    }
}

/**
 * Highlight best hospital on map
 */
function highlightBestHospital(hospital) {
    if (!hospital.coordinates) return;
    
    // Pan to hospital
    map.setView([hospital.coordinates.lat, hospital.coordinates.lng], 14, {
        animate: true,
        duration: 1
    });
    
    // Find and open popup
    markers.forEach(marker => {
        const markerLatLng = marker.getLatLng();
        if (Math.abs(markerLatLng.lat - hospital.coordinates.lat) < 0.0001 &&
            Math.abs(markerLatLng.lng - hospital.coordinates.lng) < 0.0001) {
            marker.openPopup();
        }
    });
}

/**
 * Filter map by blood group (works for both donors and hospitals)
 */
function filterMapByBloodGroup() {
    if (currentMapView === 'donors') {
        filterDonorsByBloodGroup();
    } else {
        loadHospitals(); // Reload hospitals with filter
    }
}

console.log('✅ Hospital discovery feature loaded');

/**
 * Display user location marker on map
 * @param {Object} coordinates - {lat, lng}
 */
function displayUserLocationMarker(coordinates) {
  console.log('📍 Displaying user location marker at:', coordinates);
  
  // Remove existing user location marker if any
  if (userLocationMarker) {
    map.removeLayer(userLocationMarker);
  }
  
  // Create green marker icon for user location
  const userIcon = L.divIcon({
    className: 'user-location-marker-icon',
    html: '<div class="user-location-marker">📍</div>',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
  
  // Create marker
  userLocationMarker = L.marker(
    [coordinates.lat, coordinates.lng],
    { icon: userIcon }
  );
  
  // Add popup with label
  userLocationMarker.bindPopup(`
    <div style="font-family: 'Segoe UI', sans-serif; text-align: center;">
      <h3 style="color: #10b981; margin-bottom: 0.5rem;">📍 Your Location</h3>
      <p style="margin: 0; font-size: 0.9rem;">Lat: ${coordinates.lat.toFixed(4)}, Lng: ${coordinates.lng.toFixed(4)}</p>
    </div>
  `);
  
  // Add to map
  userLocationMarker.addTo(map);
  
  // Center map on user location
  map.setView([coordinates.lat, coordinates.lng], 13);
  
  console.log('✅ User location marker displayed');
}

/**
 * Handle geolocation errors with user-friendly messages
 * @param {Error} error - GeolocationError or generic Error
 */
function handleGeolocationError(error) {
  let message = 'Unable to load hospital data. Please try again.';
  
  if (error instanceof GeolocationError) {
    switch(error.type) {
      case 'PERMISSION_DENIED':
        message = 'Location access is required to find nearby hospitals. Please enable location permissions in your browser settings.';
        break;
      case 'TIMEOUT':
        message = 'Unable to determine your location. Please check your device settings and try again.';
        break;
      case 'UNSUPPORTED':
        message = 'Geolocation is not supported by your browser. Please use a modern browser to access this feature.';
        break;
      case 'UNAVAILABLE':
        message = 'Unable to determine your location. Please check your device settings and try again.';
        break;
    }
  } else if (error.message && error.message.includes('hospital')) {
    message = 'Unable to load hospital data. Please check your internet connection and try again.';
  }
  
  console.error('❌ Error:', error);
  showToast(message, 'error');
  
  // Log for debugging
  logError('hospital-discovery', error);
}

/**
 * Log errors for debugging
 * @param {string} context - Error context
 * @param {Error} error - Error object
 */
function logError(context, error) {
  const errorLog = {
    context,
    message: error.message,
    type: error.type || error.name,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };
  
  console.error('📝 Error Log:', errorLog);
  
  // In production, send to error tracking service
  // sendToErrorTracking(errorLog);
}

// ============================================================================
// LOADING INDICATORS
// ============================================================================

/**
 * Show loading indicator
 * @param {string} context - 'geolocation', 'hospitals', 'eta'
 */
function showLoadingIndicator(context) {
  const indicator = document.getElementById('loadingIndicator');
  if (!indicator) {
    console.warn('Loading indicator element not found');
    return;
  }
  
  const messages = {
    geolocation: 'Getting your location...',
    hospitals: 'Loading nearby hospitals...',
    eta: 'Calculating travel times...'
  };
  
  indicator.textContent = messages[context] || 'Loading...';
  indicator.style.display = 'block';
}

/**
 * Hide loading indicator
 * @param {string} context - Context to hide
 */
function hideLoadingIndicator(context) {
  const indicator = document.getElementById('loadingIndicator');
  if (!indicator) return;
  
  indicator.style.display = 'none';
}

// ============================================================================
// DISTANCE MATRIX API & ETA FUNCTIONS
// ============================================================================

/**
 * Get cached ETA or return null if expired
 * @param {string} cacheKey - "origin_lat,lng-dest_lat,lng"
 * @returns {Object|null} {duration, durationText, timestamp}
 */
function getCachedETA(cacheKey) {
  const cached = etaCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < DISTANCE_MATRIX_CONFIG.cacheTTL)) {
    return cached;
  }
  return null;
}

/**
 * Format ETA duration for display
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted string (e.g., "15 mins" or "1 hr 30 mins")
 */
function formatETA(seconds) {
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} mins`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return minutes > 0 ? `${hours} hr ${minutes} mins` : `${hours} hr`;
  }
}

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} Array of chunks
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Fetch ETAs for multiple hospitals using Distance Matrix API
 * @param {Object} origin - {lat, lng}
 * @param {Array<Object>} destinations - Array of {lat, lng, hospitalId}
 * @returns {Promise<Map<hospitalId, {duration: number, durationText: string}>>}
 */
async function fetchETAsForHospitals(origin, destinations) {
  try {
    // Check if API key is configured
    if (!DISTANCE_MATRIX_CONFIG.apiKey) {
      console.warn('Distance Matrix API key not configured, skipping ETA calculation');
      return new Map();
    }
    
    // Batch destinations (max 25 per request for Google API)
    const batches = chunkArray(destinations, DISTANCE_MATRIX_CONFIG.batchSize);
    const results = new Map();
    
    for (const batch of batches) {
      // Check cache first
      const uncachedDestinations = [];
      batch.forEach(dest => {
        const cacheKey = `${origin.lat},${origin.lng}-${dest.lat},${dest.lng}`;
        const cached = getCachedETA(cacheKey);
        if (cached) {
          results.set(dest.hospitalId, {
            duration: cached.duration,
            durationText: cached.durationText,
            distance: cached.distance,
            distanceText: cached.distanceText
          });
        } else {
          uncachedDestinations.push(dest);
        }
      });
      
      if (uncachedDestinations.length === 0) {
        continue; // All cached, skip API call
      }
      
      const destString = uncachedDestinations
        .map(d => `${d.lat},${d.lng}`)
        .join('|');
      
      const url = `${DISTANCE_MATRIX_CONFIG.baseUrl}?` +
        `origins=${origin.lat},${origin.lng}&` +
        `destinations=${destString}&` +
        `mode=${DISTANCE_MATRIX_CONFIG.mode}&` +
        `departure_time=now&` +
        `units=${DISTANCE_MATRIX_CONFIG.units}&` +
        `key=${DISTANCE_MATRIX_CONFIG.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'OK') {
        console.warn('Distance Matrix API error:', data.status);
        continue; // Skip this batch
      }
      
      // Parse results
      data.rows[0].elements.forEach((element, index) => {
        if (element.status === 'OK') {
          const dest = uncachedDestinations[index];
          const duration = element.duration_in_traffic?.value || element.duration.value;
          const durationText = element.duration_in_traffic?.text || element.duration.text;
          const distance = element.distance.value;
          const distanceText = element.distance.text;
          
          const etaData = {
            duration,
            durationText,
            distance,
            distanceText
          };
          
          results.set(dest.hospitalId, etaData);
          
          // Cache the result
          const cacheKey = `${origin.lat},${origin.lng}-${dest.lat},${dest.lng}`;
          etaCache.set(cacheKey, {
            ...etaData,
            timestamp: Date.now()
          });
        }
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching ETAs:', error);
    return new Map(); // Return empty map on error
  }
}

// ============================================================================
// LOCATION CHANGE DETECTION
// ============================================================================

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lng1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lng2 - Second longitude
 * @returns {number} Distance in meters
 */
function calculateDistanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if location has changed significantly
 * @param {Object} oldLocation - {lat, lng}
 * @param {Object} newLocation - {lat, lng}
 * @returns {boolean} True if change > 500 meters
 */
function hasLocationChangedSignificantly(oldLocation, newLocation) {
  if (!oldLocation || !newLocation) return false;
  
  const distance = calculateDistanceInMeters(
    oldLocation.lat, oldLocation.lng,
    newLocation.lat, newLocation.lng
  );
  
  return distance > 500;
}
