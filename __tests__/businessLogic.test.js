/**
 * Business Logic Tests for Rapid Red Care Circle
 * Tests: Age Constraint, Red Band Timeout, Donor Sorting
 */

const userService = require('../src/services/userService');
const requestService = require('../src/services/requestService');
const donorMatchingService = require('../src/services/donorMatchingService');

describe('Business Logic Tests', () => {
  
  describe('Age Constraint Validation', () => {
    
    test('should successfully register user with age 18 (lower boundary - inclusive)', () => {
      const userData = {
        fullName: 'John Doe',
        age: 18,
        gender: 'Male',
        mobileNumber: '+1234567890',
        city: 'New York',
        bloodGroup: 'O+'
      };

      const result = userService.registerUser(userData);
      
      expect(result).toBeDefined();
      expect(result.age).toBe(18);
      expect(result.fullName).toBe('John Doe');
    });

    test('should reject user registration with age 61', () => {
      const userData = {
        fullName: 'Jane Smith',
        age: 61,
        gender: 'Female',
        mobileNumber: '+1234567891',
        city: 'Los Angeles',
        bloodGroup: 'A+'
      };

      expect(() => userService.registerUser(userData)).toThrow('Age must be between 18 and 60 years inclusive');
    });

    test('should successfully register user with age 25', () => {
      const userData = {
        fullName: 'Alice Johnson',
        age: 25,
        gender: 'Female',
        mobileNumber: '+1234567892',
        city: 'Chicago',
        bloodGroup: 'B+'
      };

      const result = userService.registerUser(userData);
      
      expect(result).toBeDefined();
      expect(result.age).toBe(25);
      expect(result.fullName).toBe('Alice Johnson');
    });
  });

  describe('Red Band Timeout Logic', () => {
    
    test('should expire Red Band request after 21 minutes and trigger notification', () => {
      // Create a Red Band request
      const request = requestService.createRequest({
        bloodGroup: 'O+',
        location: { lat: 40.7128, lng: -74.0060 },
        requiredTimeframe: 'immediate',
        requesterId: 123
      });

      expect(request.urgencyBand).toBe('RED');
      expect(request.status).toBe('PENDING');

      // Simulate request created 21 minutes ago
      const twentyOneMinutesAgo = new Date(Date.now() - 21 * 60 * 1000);
      request.createdAt = twentyOneMinutesAgo;

      // Run expiration check
      const isExpired = requestService.checkRedBandExpiration(request);

      // Assert request expired
      expect(isExpired).toBe(true);
      expect(request.status).toBe('EXPIRED');
    });

    test('should not expire Red Band request before timeout', () => {
      const request = requestService.createRequest({
        bloodGroup: 'A+',
        location: { lat: 34.0522, lng: -118.2437 },
        requiredTimeframe: 'immediate',
        requesterId: 456
      });

      // Request just created (0 minutes ago)
      const isExpired = requestService.checkRedBandExpiration(request);

      expect(isExpired).toBe(false);
      expect(request.status).toBe('PENDING');
    });
  });

  describe('Donor Sorting Algorithm', () => {
    
    test('should sort donors with Donor A (1km, 90% reliability) before Donor B (5km, 50% reliability)', () => {
      const donors = [
        {
          id: 1,
          name: 'Donor A',
          bloodGroup: 'O+',
          distance: 1, // km
          reliability: 90, // percentage
          isActive: true
        },
        {
          id: 2,
          name: 'Donor B',
          bloodGroup: 'O+',
          distance: 5, // km
          reliability: 50, // percentage
          isActive: true
        }
      ];

      const sortedDonors = donorMatchingService.sortDonors(donors);

      // Assert Donor A appears first
      expect(sortedDonors[0].name).toBe('Donor A');
      expect(sortedDonors[0].distance).toBe(1);
      expect(sortedDonors[0].reliability).toBe(90);

      // Assert Donor B appears second
      expect(sortedDonors[1].name).toBe('Donor B');
      expect(sortedDonors[1].distance).toBe(5);
      expect(sortedDonors[1].reliability).toBe(50);

      // Verify Donor A has higher score
      expect(sortedDonors[0].score).toBeGreaterThan(sortedDonors[1].score);
    });

    test('should prioritize reliability over distance in sorting', () => {
      const donors = [
        {
          id: 1,
          name: 'Close but unreliable',
          bloodGroup: 'A+',
          distance: 0.5,
          reliability: 30,
          isActive: true
        },
        {
          id: 2,
          name: 'Far but reliable',
          bloodGroup: 'A+',
          distance: 10,
          reliability: 95,
          isActive: true
        }
      ];

      const sortedDonors = donorMatchingService.sortDonors(donors);

      // With 70% weight on reliability, the far but reliable donor should rank higher
      expect(sortedDonors[0].name).toBe('Far but reliable');
    });
  });
});
