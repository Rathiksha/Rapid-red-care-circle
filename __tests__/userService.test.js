/**
 * Unit Tests for UserService
 * Tests: OTP generation/verification, medical history validation,
 * notification preferences, and complete registration logic
 */

const userService = require('../src/services/userService');

describe('UserService - Enhanced Registration Logic', () => {
  
  beforeEach(() => {
    // Clear OTP store before each test
    userService.otpStore.clear();
  });

  describe('OTP Generation and Verification', () => {
    
    test('should generate OTP for valid mobile number', () => {
      const mobileNumber = '+1234567890';
      const result = userService.generateOTP(mobileNumber);

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP sent successfully');
      expect(result.expiresIn).toBe(10);
      expect(userService.otpStore.has(mobileNumber)).toBe(true);
    });

    test('should throw error when generating OTP without mobile number', () => {
      expect(() => userService.generateOTP()).toThrow('Mobile number is required for OTP generation');
    });

    test('should verify correct OTP', () => {
      const mobileNumber = '+1234567890';
      userService.generateOTP(mobileNumber);
      
      const otpData = userService.otpStore.get(mobileNumber);
      const result = userService.verifyOTP(mobileNumber, otpData.otp);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Mobile number verified successfully');
      expect(userService.otpStore.has(mobileNumber)).toBe(false);
    });

    test('should reject incorrect OTP', () => {
      const mobileNumber = '+1234567890';
      userService.generateOTP(mobileNumber);

      expect(() => userService.verifyOTP(mobileNumber, '000000')).toThrow('Invalid OTP');
    });

    test('should reject expired OTP', () => {
      const mobileNumber = '+1234567890';
      userService.generateOTP(mobileNumber);

      // Manually expire the OTP
      const otpData = userService.otpStore.get(mobileNumber);
      otpData.expiryTime = Date.now() - 1000;

      expect(() => userService.verifyOTP(mobileNumber, otpData.otp)).toThrow('OTP has expired');
    });

    test('should limit OTP verification attempts to 3', () => {
      const mobileNumber = '+1234567890';
      userService.generateOTP(mobileNumber);

      // Make 3 failed attempts
      try { userService.verifyOTP(mobileNumber, '000000'); } catch (e) {}
      try { userService.verifyOTP(mobileNumber, '000000'); } catch (e) {}
      try { userService.verifyOTP(mobileNumber, '000000'); } catch (e) {}

      // 4th attempt should fail with different error
      expect(() => userService.verifyOTP(mobileNumber, '000000'))
        .toThrow('Maximum OTP verification attempts exceeded');
    });
  });

  describe('Medical History Validation', () => {
    
    test('should accept valid medical history with diabetes', () => {
      const medicalHistory = {
        diabetes: true,
        seizures: false
      };

      expect(() => userService.validateMedicalHistory(medicalHistory)).not.toThrow();
    });

    test('should accept valid medical history with multiple conditions', () => {
      const medicalHistory = {
        diabetes: true,
        seizures: true,
        heartDisease: false,
        hypertension: true
      };

      expect(() => userService.validateMedicalHistory(medicalHistory)).not.toThrow();
    });

    test('should reject non-object medical history', () => {
      expect(() => userService.validateMedicalHistory('invalid'))
        .toThrow('Medical history must be a valid object');
    });

    test('should reject medical history with non-boolean values', () => {
      const medicalHistory = {
        diabetes: 'yes'
      };

      expect(() => userService.validateMedicalHistory(medicalHistory))
        .toThrow("Medical history field 'diabetes' must be a boolean");
    });

    test('should accept empty medical history object', () => {
      const medicalHistory = {};
      expect(() => userService.validateMedicalHistory(medicalHistory)).not.toThrow();
    });
  });

  describe('Notification Preferences Validation', () => {
    
    test('should accept valid notification preferences with quiet hours', () => {
      const preferences = {
        notificationEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      };

      expect(() => userService.validateNotificationPreferences(preferences)).not.toThrow();
    });

    test('should reject invalid time format for quiet hours', () => {
      const preferences = {
        notificationEnabled: true,
        quietHoursStart: '25:00',
        quietHoursEnd: '08:00'
      };

      expect(() => userService.validateNotificationPreferences(preferences))
        .toThrow('Quiet hours must be in HH:MM format');
    });

    test('should reject quiet hours with only start time', () => {
      const preferences = {
        notificationEnabled: true,
        quietHoursStart: '22:00'
      };

      expect(() => userService.validateNotificationPreferences(preferences))
        .toThrow('Both quietHoursStart and quietHoursEnd must be provided together');
    });

    test('should reject non-boolean notificationEnabled', () => {
      const preferences = {
        notificationEnabled: 'yes'
      };

      expect(() => userService.validateNotificationPreferences(preferences))
        .toThrow('notificationEnabled must be a boolean');
    });

    test('should accept preferences without quiet hours', () => {
      const preferences = {
        notificationEnabled: false
      };

      expect(() => userService.validateNotificationPreferences(preferences)).not.toThrow();
    });
  });

  describe('Complete User Registration', () => {
    
    test('should register user with all required fields', () => {
      const userData = {
        fullName: 'John Doe',
        age: 25,
        gender: 'Male',
        mobileNumber: '+1234567890',
        city: 'New York',
        bloodGroup: 'O+'
      };

      const user = userService.registerUser(userData);

      expect(user).toBeDefined();
      expect(user.fullName).toBe('John Doe');
      expect(user.age).toBe(25);
      expect(user.mobileVerified).toBe(false);
      expect(user.medicalHistory).toEqual({});
      expect(user.notificationEnabled).toBe(true);
    });

    test('should register user with medical history', () => {
      const userData = {
        fullName: 'Jane Smith',
        age: 30,
        gender: 'Female',
        mobileNumber: '+1234567891',
        city: 'Los Angeles',
        bloodGroup: 'A+',
        medicalHistory: {
          diabetes: true,
          seizures: false
        }
      };

      const user = userService.registerUser(userData);

      expect(user.medicalHistory).toEqual({
        diabetes: true,
        seizures: false
      });
    });

    test('should register user with notification preferences', () => {
      const userData = {
        fullName: 'Bob Johnson',
        age: 35,
        gender: 'Male',
        mobileNumber: '+1234567892',
        city: 'Chicago',
        bloodGroup: 'B+',
        notificationPreferences: {
          notificationEnabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00'
        }
      };

      const user = userService.registerUser(userData);

      expect(user.notificationEnabled).toBe(true);
      expect(user.quietHoursStart).toBe('22:00');
      expect(user.quietHoursEnd).toBe('07:00');
    });

    test('should register user with last donation date', () => {
      const userData = {
        fullName: 'Alice Brown',
        age: 28,
        gender: 'Female',
        mobileNumber: '+1234567893',
        city: 'Houston',
        bloodGroup: 'AB+',
        lastDonationDate: '2024-01-15'
      };

      const user = userService.registerUser(userData);

      expect(user.lastDonationDate).toBe('2024-01-15');
    });

    test('should reject registration with invalid age', () => {
      const userData = {
        fullName: 'Young User',
        age: 17,
        gender: 'Male',
        mobileNumber: '+1234567894',
        city: 'Miami',
        bloodGroup: 'O-'
      };

      expect(() => userService.registerUser(userData))
        .toThrow('Age must be between 18 and 60 years inclusive');
    });

    test('should reject registration with missing required fields', () => {
      const userData = {
        fullName: 'Incomplete User',
        age: 25
      };

      expect(() => userService.registerUser(userData))
        .toThrow('All required fields must be provided');
    });
  });

  describe('Quiet Hours Logic', () => {
    
    test('should detect time within quiet hours (same day)', () => {
      // Mock current time to 23:00
      const now = new Date();
      now.setHours(23, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => now);

      const isQuiet = userService.isInQuietHours('22:00', '08:00');
      expect(isQuiet).toBe(true);

      global.Date.mockRestore();
    });

    test('should detect time outside quiet hours', () => {
      // Mock current time to 12:00
      const now = new Date();
      now.setHours(12, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => now);

      const isQuiet = userService.isInQuietHours('22:00', '08:00');
      expect(isQuiet).toBe(false);

      global.Date.mockRestore();
    });

    test('should return false when quiet hours not configured', () => {
      const isQuiet = userService.isInQuietHours(null, null);
      expect(isQuiet).toBe(false);
    });
  });

  describe('Notification Decision Logic', () => {
    
    test('should not send notification when notifications disabled', () => {
      const user = {
        notificationEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null
      };

      const shouldSend = userService.shouldSendNotification(user, 'PINK');
      expect(shouldSend).toBe(false);
    });

    test('should send RED band notification even during quiet hours', () => {
      const user = {
        notificationEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      };

      // Mock current time to 23:00 (within quiet hours)
      const now = new Date();
      now.setHours(23, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => now);

      const shouldSend = userService.shouldSendNotification(user, 'RED');
      expect(shouldSend).toBe(true);

      global.Date.mockRestore();
    });

    test('should not send PINK band notification during quiet hours', () => {
      const user = {
        notificationEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      };

      // Mock current time to 23:00 (within quiet hours)
      const now = new Date();
      now.setHours(23, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => now);

      const shouldSend = userService.shouldSendNotification(user, 'PINK');
      expect(shouldSend).toBe(false);

      global.Date.mockRestore();
    });

    test('should send notification outside quiet hours', () => {
      const user = {
        notificationEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      };

      // Mock current time to 12:00 (outside quiet hours)
      const now = new Date();
      now.setHours(12, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => now);

      const shouldSend = userService.shouldSendNotification(user, 'PINK');
      expect(shouldSend).toBe(true);

      global.Date.mockRestore();
    });
  });

  describe('Configure Notification Preferences', () => {
    
    test('should configure notification preferences with all options', () => {
      const preferences = {
        notificationEnabled: false,
        quietHoursStart: '23:00',
        quietHoursEnd: '07:00'
      };

      const config = userService.configureNotificationPreferences(123, preferences);

      expect(config.userId).toBe(123);
      expect(config.notificationEnabled).toBe(false);
      expect(config.quietHoursStart).toBe('23:00');
      expect(config.quietHoursEnd).toBe('07:00');
      expect(config.updatedAt).toBeInstanceOf(Date);
    });

    test('should use default notification enabled when not specified', () => {
      const preferences = {};
      const config = userService.configureNotificationPreferences(456, preferences);

      expect(config.notificationEnabled).toBe(true);
      expect(config.quietHoursStart).toBe(null);
      expect(config.quietHoursEnd).toBe(null);
    });

    test('should throw error when userId not provided', () => {
      const preferences = { notificationEnabled: true };
      
      expect(() => userService.configureNotificationPreferences(null, preferences))
        .toThrow('User ID is required');
    });
  });
});
