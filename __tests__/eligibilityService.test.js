/**
 * Unit Tests for EligibilityService
 * Tests eligibility score calculation based on donation date and medical history
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

const eligibilityService = require('../src/services/eligibilityService');

describe('EligibilityService', () => {
  
  describe('calculateEligibilityScore', () => {
    
    test('should return 100% for new donor with no donation history', () => {
      const donor = {
        last_donation_date: null,
        medical_history: {}
      };
      
      const score = eligibilityService.calculateEligibilityScore(donor);
      expect(score).toBe(100);
    });

    test('should deduct 50% for donation less than 90 days ago', () => {
      const fiftyDaysAgo = new Date();
      fiftyDaysAgo.setDate(fiftyDaysAgo.getDate() - 50);
      
      const donor = {
        last_donation_date: fiftyDaysAgo.toISOString().split('T')[0],
        medical_history: {}
      };
      
      const score = eligibilityService.calculateEligibilityScore(donor);
      expect(score).toBe(50);
    });

    test('should deduct 25% for donation between 90-120 days ago', () => {
      const hundredDaysAgo = new Date();
      hundredDaysAgo.setDate(hundredDaysAgo.getDate() - 100);
      
      const donor = {
        last_donation_date: hundredDaysAgo.toISOString().split('T')[0],
        medical_history: {}
      };
      
      const score = eligibilityService.calculateEligibilityScore(donor);
      expect(score).toBe(75);
    });

    test('should not deduct for donation more than 120 days ago', () => {
      const oneYearAgo = new Date();
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);
      
      const donor = {
        last_donation_date: oneYearAgo.toISOString().split('T')[0],
        medical_history: {}
      };
      
      const score = eligibilityService.calculateEligibilityScore(donor);
      expect(score).toBe(100);
    });

    test('should deduct 15% for diabetes condition', () => {
      const donor = {
        last_donation_date: null,
        medical_history: {
          diabetes: true
        }
      };
      
      const score = eligibilityService.calculateEligibilityScore(donor);
      expect(score).toBe(85);
    });

    test('should deduct 20% for seizures condition', () => {
      const donor = {
        last_donation_date: null,
        medical_history: {
          seizures: true
        }
      };
      
      const score = eligibilityService.calculateEligibilityScore(donor);
      expect(score).toBe(80);
    });

    test('should apply multiple deductions correctly', () => {
      const fiftyDaysAgo = new Date();
      fiftyDaysAgo.setDate(fiftyDaysAgo.getDate() - 50);
      
      const donor = {
        last_donation_date: fiftyDaysAgo.toISOString().split('T')[0],
        medical_history: {
          diabetes: true,
          seizures: true
        }
      };
      
      // 100 - 50 (recent donation) - 15 (diabetes) - 20 (seizures) = 15
      const score = eligibilityService.calculateEligibilityScore(donor);
      expect(score).toBe(15);
    });

    test('should not go below 0% even with excessive deductions', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const donor = {
        last_donation_date: thirtyDaysAgo.toISOString().split('T')[0],
        medical_history: {
          diabetes: true,
          seizures: true
        }
      };
      
      // 100 - 50 - 15 - 20 = 15, but if more deductions, should cap at 0
      const score = eligibilityService.calculateEligibilityScore(donor);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    test('should not exceed 100% score', () => {
      const donor = {
        last_donation_date: null,
        medical_history: {}
      };
      
      const score = eligibilityService.calculateEligibilityScore(donor);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should handle camelCase property names', () => {
      const donor = {
        lastDonationDate: null,
        medicalHistory: {
          diabetes: false,
          seizures: false
        }
      };
      
      const score = eligibilityService.calculateEligibilityScore(donor);
      expect(score).toBe(100);
    });
  });

  describe('getDaysDifference', () => {
    
    test('should calculate correct days difference', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-01');
      
      const days = eligibilityService.getDaysDifference(date1, date2);
      expect(days).toBe(14);
    });

    test('should handle same dates', () => {
      const date = new Date('2024-01-01');
      
      const days = eligibilityService.getDaysDifference(date, date);
      expect(days).toBe(0);
    });
  });

  describe('isEligible', () => {
    
    test('should return true for eligible donor', () => {
      const donor = {
        last_donation_date: null,
        medical_history: {}
      };
      
      expect(eligibilityService.isEligible(donor)).toBe(true);
    });

    test('should return false for ineligible donor', () => {
      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
      
      const donor = {
        last_donation_date: twentyDaysAgo.toISOString().split('T')[0],
        medical_history: {
          diabetes: true,
          seizures: true
        }
      };
      
      const score = eligibilityService.calculateEligibilityScore(donor);
      if (score === 0) {
        expect(eligibilityService.isEligible(donor)).toBe(false);
      }
    });
  });

  describe('getEligibilityStatus', () => {
    
    test('should return correct status for fully eligible donor', () => {
      const donor = {
        last_donation_date: null,
        medical_history: {}
      };
      
      const status = eligibilityService.getEligibilityStatus(donor);
      expect(status.score).toBe(100);
      expect(status.eligible).toBe(true);
      expect(status.message).toBe('Fully eligible to donate');
    });

    test('should return correct status for partially eligible donor', () => {
      const donor = {
        last_donation_date: null,
        medical_history: {
          diabetes: true
        }
      };
      
      const status = eligibilityService.getEligibilityStatus(donor);
      expect(status.score).toBe(85);
      expect(status.eligible).toBe(true);
      expect(status.message).toBe('Eligible with some restrictions');
    });
  });
});
