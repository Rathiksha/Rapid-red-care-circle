/**
 * User registration and validation service
 * Handles user registration, OTP verification, medical history validation,
 * and notification preference management
 */

const crypto = require('crypto');

class UserService {
  constructor() {
    // In-memory OTP storage (in production, use Redis)
    this.otpStore = new Map();
    this.OTP_EXPIRY_MINUTES = 10;
  }

  /**
   * Validates user age constraint (18-60 years inclusive)
   * Requirement: 1.2
   */
  validateAge(age) {
    if (age < 18 || age > 60) {
      throw new Error('Age must be between 18 and 60 years inclusive');
    }
    return true;
  }

  /**
   * Validates medical history structure and content
   * Requirement: 1.3
   */
  validateMedicalHistory(medicalHistory) {
    if (!medicalHistory || typeof medicalHistory !== 'object') {
      throw new Error('Medical history must be a valid object');
    }

    // Validate boolean fields if present
    const booleanFields = ['diabetes', 'seizures', 'heartDisease', 'hypertension'];
    for (const field of booleanFields) {
      if (medicalHistory[field] !== undefined && typeof medicalHistory[field] !== 'boolean') {
        throw new Error(`Medical history field '${field}' must be a boolean`);
      }
    }

    return true;
  }

  /**
   * Validates notification preferences
   * Requirement: 15.1, 15.2
   */
  validateNotificationPreferences(preferences) {
    if (!preferences || typeof preferences !== 'object') {
      throw new Error('Notification preferences must be a valid object');
    }

    // Validate notification_enabled
    if (preferences.notificationEnabled !== undefined && 
        typeof preferences.notificationEnabled !== 'boolean') {
      throw new Error('notificationEnabled must be a boolean');
    }

    // Validate quiet hours if provided
    if (preferences.quietHoursStart || preferences.quietHoursEnd) {
      if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
        throw new Error('Both quietHoursStart and quietHoursEnd must be provided together');
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(preferences.quietHoursStart) || 
          !timeRegex.test(preferences.quietHoursEnd)) {
        throw new Error('Quiet hours must be in HH:MM format');
      }
    }

    return true;
  }

  /**
   * Generates a 6-digit OTP for mobile verification
   * Requirement: 1.5
   */
  generateOTP(mobileNumber) {
    if (!mobileNumber) {
      throw new Error('Mobile number is required for OTP generation');
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Store OTP with expiry timestamp
    const expiryTime = Date.now() + (this.OTP_EXPIRY_MINUTES * 60 * 1000);
    this.otpStore.set(mobileNumber, {
      otp,
      expiryTime,
      attempts: 0
    });

    // In production, send OTP via SMS service
    console.log(`OTP for ${mobileNumber}: ${otp}`);

    return {
      success: true,
      message: 'OTP sent successfully',
      expiresIn: this.OTP_EXPIRY_MINUTES
    };
  }

  /**
   * Verifies OTP for mobile number
   * Requirement: 1.5
   */
  verifyOTP(mobileNumber, otp) {
    if (!mobileNumber || !otp) {
      throw new Error('Mobile number and OTP are required');
    }

    const otpData = this.otpStore.get(mobileNumber);

    if (!otpData) {
      throw new Error('No OTP found for this mobile number');
    }

    // Check if OTP expired
    if (Date.now() > otpData.expiryTime) {
      this.otpStore.delete(mobileNumber);
      throw new Error('OTP has expired');
    }

    // Check attempts limit
    if (otpData.attempts >= 3) {
      this.otpStore.delete(mobileNumber);
      throw new Error('Maximum OTP verification attempts exceeded');
    }

    // Verify OTP
    if (otpData.otp !== otp.toString()) {
      otpData.attempts++;
      throw new Error('Invalid OTP');
    }

    // OTP verified successfully
    this.otpStore.delete(mobileNumber);
    return {
      success: true,
      message: 'Mobile number verified successfully'
    };
  }

  /**
   * Configures notification preferences for a user
   * Requirement: 15.1, 15.2
   */
  configureNotificationPreferences(userId, preferences) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    this.validateNotificationPreferences(preferences);

    const config = {
      userId,
      notificationEnabled: preferences.notificationEnabled !== undefined ? 
        preferences.notificationEnabled : true,
      quietHoursStart: preferences.quietHoursStart || null,
      quietHoursEnd: preferences.quietHoursEnd || null,
      updatedAt: new Date()
    };

    return config;
  }

  /**
   * Registers a new user with complete validation
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 15.1, 15.2
   */
  registerUser(userData) {
    const { 
      fullName, 
      age, 
      gender, 
      mobileNumber, 
      city, 
      bloodGroup,
      medicalHistory,
      lastDonationDate,
      notificationPreferences
    } = userData;

    // Validate required fields (Requirement 1.1)
    if (!fullName || !age || !gender || !mobileNumber || !city || !bloodGroup) {
      throw new Error('All required fields must be provided');
    }

    // Validate age constraint (Requirement 1.2)
    this.validateAge(age);

    // Validate medical history if provided (Requirement 1.3)
    if (medicalHistory) {
      this.validateMedicalHistory(medicalHistory);
    }

    // Validate notification preferences if provided (Requirement 15.1, 15.2)
    if (notificationPreferences) {
      this.validateNotificationPreferences(notificationPreferences);
    }

    // Create user object (Requirement 1.6)
    const user = {
      id: Date.now(),
      fullName,
      age,
      gender,
      mobileNumber,
      city,
      bloodGroup,
      medicalHistory: medicalHistory || {},
      lastDonationDate: lastDonationDate || null,
      mobileVerified: false, // Requirement 1.5
      isActive: true,
      notificationEnabled: notificationPreferences?.notificationEnabled !== undefined ? 
        notificationPreferences.notificationEnabled : true,
      quietHoursStart: notificationPreferences?.quietHoursStart || null,
      quietHoursEnd: notificationPreferences?.quietHoursEnd || null,
      createdAt: new Date()
    };

    return user;
  }

  /**
   * Checks if current time is within user's quiet hours
   * Requirement: 15.2
   */
  isInQuietHours(quietHoursStart, quietHoursEnd) {
    if (!quietHoursStart || !quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Handle quiet hours that span midnight
    if (quietHoursStart <= quietHoursEnd) {
      return currentTime >= quietHoursStart && currentTime <= quietHoursEnd;
    } else {
      return currentTime >= quietHoursStart || currentTime <= quietHoursEnd;
    }
  }

  /**
   * Determines if notification should be sent based on preferences
   * Requirement: 15.1, 15.2
   */
  shouldSendNotification(user, urgencyBand) {
    // Check if notifications are enabled
    if (!user.notificationEnabled) {
      return false;
    }

    // Red Band requests override quiet hours (Requirement 15.2)
    if (urgencyBand === 'RED') {
      return true;
    }

    // Check quiet hours for non-emergency requests
    if (this.isInQuietHours(user.quietHoursStart, user.quietHoursEnd)) {
      return false;
    }

    return true;
  }
}

module.exports = new UserService();
