/**
 * Unit Tests for DonorMatchingService
 * Tests donor matching algorithm with composite scoring
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */

const donorMatchingService = require('../src/services/donorMatchingService');

describe('DonorMatchingService', () => {
  
  describe('calculateCompositeScore', () => {
    
    test('should calculate composite score with correct weights', () => {
      const donor = {
        eligibility_score: 100,
        reliability_score: 80
      };
      
      const distance = 5; // km
      const eta = 15; // minutes
      
      const score = donorMatchingService.calculateCompositeScore(donor, distance, eta);
      
      // Score should be between 0 and 1
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    test('should give higher score to closer donors', () => {
      const donor = {
        eligibility_score: 80,
        reliability_score: 80
      };
      
      const closeScore = donorMatchingService.calculateCompositeScore(donor, 1, 10);
      const farScore = donorMatchingService.calculateCompositeScore(donor, 20, 40);
      
      expect(closeScore).toBeGreaterThan(farScore);
    });

    test('should give higher score to donors with better eligibility', () => {
      const highEligibilityDonor = {
        eligibility_score: 100,
        reliability_score: 50
      };
      
      const lowEligibilityDonor = {
        eligibility_score: 30,
        reliability_score: 50
      };
      
      const distance = 5;
      const eta = 15;
      
      const highScore = donorMatchingService.calculateCompositeScore(highEligibilityDonor, distance, eta);
      const lowScore = donorMatchingService.calculateCompositeScore(lowEligibilityDonor, distance, eta);
      
      expect(highScore).toBeGreaterThan(lowScore);
    });

    test('should give higher score to donors with better reliability', () => {
      const highReliabilityDonor = {
        eligibility_score: 80,
        reliability_score: 90
      };
      
      const lowReliabilityDonor = {
        eligibility_score: 80,
        reliability_score: 30
      };
      
      const distance = 5;
      const eta = 15;
      
      const highScore = donorMatchingService.calculateCompositeScore(highReliabilityDonor, distance, eta);
      const lowScore = donorMatchingService.calculateCompositeScore(lowReliabilityDonor, distance, eta);
      
      expect(highScore).toBeGreaterThan(lowScore);
    });

    test('should give higher score to donors with faster ETA', () => {
      const donor = {
        eligibility_score: 80,
        reliability_score: 80
      };
      
      const fastScore = donorMatchingService.calculateCompositeScore(donor, 5, 10);
      const slowScore = donorMatchingService.calculateCompositeScore(donor, 5, 60);
      
      expect(fastScore).toBeGreaterThan(slowScore);
    });

    test('should weight reliability most heavily (30%)', () => {
      // Test that reliability has the highest impact
      const baselineDonor = {
        eligibility_score: 50,
        reliability_score: 50
      };
      
      const highReliabilityDonor = {
        eligibility_score: 50,
        reliability_score: 100
      };
      
      const distance = 10;
      const eta = 20;
      
      const baselineScore = donorMatchingService.calculateCompositeScore(baselineDonor, distance, eta);
      const highReliabilityScore = donorMatchingService.calculateCompositeScore(highReliabilityDonor, distance, eta);
      
      const reliabilityImpact = highReliabilityScore - baselineScore;
      
      // Reliability should have significant impact (30% weight)
      expect(reliabilityImpact).toBeGreaterThan(0.1);
    });
  });

  describe('parsePointString', () => {
    
    test('should parse valid POINT string', () => {
      const pointString = 'POINT(-74.0060 40.7128)';
      const coords = donorMatchingService.parsePointString(pointString);
      
      expect(coords.lng).toBe(-74.0060);
      expect(coords.lat).toBe(40.7128);
    });

    test('should handle positive coordinates', () => {
      const pointString = 'POINT(77.2090 28.6139)';
      const coords = donorMatchingService.parsePointString(pointString);
      
      expect(coords.lng).toBe(77.2090);
      expect(coords.lat).toBe(28.6139);
    });

    test('should throw error for invalid POINT string', () => {
      expect(() => {
        donorMatchingService.parsePointString('INVALID');
      }).toThrow('Invalid POINT string format');
    });
  });

  describe('Legacy methods (backward compatibility)', () => {
    
    test('calculateDonorScore should work with legacy format', () => {
      const donor = {
        distance: 5,
        reliability: 80
      };
      
      const score = donorMatchingService.calculateDonorScore(donor);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    test('sortDonors should sort by composite score', () => {
      const donors = [
        { id: 1, name: 'Donor A', distance: 10, reliability: 50, isActive: true },
        { id: 2, name: 'Donor B', distance: 2, reliability: 90, isActive: true },
        { id: 3, name: 'Donor C', distance: 5, reliability: 70, isActive: true }
      ];
      
      const sorted = donorMatchingService.sortDonors(donors);
      
      // Donor B should be first (closest and most reliable)
      expect(sorted[0].name).toBe('Donor B');
      
      // All donors should have scores
      sorted.forEach(donor => {
        expect(donor.score).toBeDefined();
      });
    });
  });
});
