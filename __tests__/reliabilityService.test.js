/**
 * Unit Tests for ReliabilityService
 * Tests reliability score calculation with time-weighted decay
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

const reliabilityService = require('../src/services/reliabilityService');

describe('ReliabilityService', () => {
  
  describe('calculateReliabilityScore', () => {
    
    test('should return base score of 50 for donor with no history', () => {
      const score = reliabilityService.calculateReliabilityScore([]);
      expect(score).toBe(50);
    });

    test('should increase score by 10 for completed donation', () => {
      const history = [
        {
          status: 'COMPLETED',
          completed_at: new Date().toISOString()
        }
      ];
      
      const score = reliabilityService.calculateReliabilityScore(history);
      expect(score).toBe(60); // 50 + 10
    });

    test('should decrease score by 15 for cancelled donation', () => {
      const history = [
        {
          status: 'CANCELLED',
          cancelled_at: new Date().toISOString()
        }
      ];
      
      const score = reliabilityService.calculateReliabilityScore(history);
      expect(score).toBe(35); // 50 - 15
    });

    test('should decrease score by 5 for ignored notification', () => {
      const history = [
        {
          status: 'PENDING',
          response_type: 'IGNORED',
          accepted_at: new Date().toISOString()
        }
      ];
      
      const score = reliabilityService.calculateReliabilityScore(history);
      expect(score).toBe(45); // 50 - 5
    });

    test('should decrease score by 2 for declined request', () => {
      const history = [
        {
          status: 'PENDING',
          response_type: 'DECLINED',
          accepted_at: new Date().toISOString()
        }
      ];
      
      const score = reliabilityService.calculateReliabilityScore(history);
      expect(score).toBe(48); // 50 - 2
    });

    test('should apply time decay for actions older than 6 months', () => {
      const eightMonthsAgo = new Date();
      eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);
      
      const history = [
        {
          status: 'COMPLETED',
          completed_at: eightMonthsAgo.toISOString()
        }
      ];
      
      const score = reliabilityService.calculateReliabilityScore(history);
      // 50 + (10 * 0.5) = 55 (older actions weighted at 0.5x)
      expect(score).toBe(55);
    });

    test('should weight recent actions (< 6 months) at full value', () => {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      
      const history = [
        {
          status: 'COMPLETED',
          completed_at: twoMonthsAgo.toISOString()
        }
      ];
      
      const score = reliabilityService.calculateReliabilityScore(history);
      // 50 + (10 * 1.0) = 60 (recent actions weighted at 1.0x)
      expect(score).toBe(60);
    });

    test('should handle multiple actions with mixed time periods', () => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const eightMonthsAgo = new Date();
      eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);
      
      const history = [
        {
          status: 'COMPLETED',
          completed_at: oneMonthAgo.toISOString()
        },
        {
          status: 'COMPLETED',
          completed_at: eightMonthsAgo.toISOString()
        },
        {
          status: 'CANCELLED',
          cancelled_at: oneMonthAgo.toISOString()
        }
      ];
      
      const score = reliabilityService.calculateReliabilityScore(history);
      // 50 + (10 * 1.0) + (10 * 0.5) - (15 * 1.0) = 50
      expect(score).toBe(50);
    });

    test('should not go below 0%', () => {
      const history = [
        { status: 'CANCELLED', cancelled_at: new Date().toISOString() },
        { status: 'CANCELLED', cancelled_at: new Date().toISOString() },
        { status: 'CANCELLED', cancelled_at: new Date().toISOString() },
        { status: 'CANCELLED', cancelled_at: new Date().toISOString() }
      ];
      
      const score = reliabilityService.calculateReliabilityScore(history);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    test('should not exceed 100%', () => {
      const history = Array(20).fill({
        status: 'COMPLETED',
        completed_at: new Date().toISOString()
      });
      
      const score = reliabilityService.calculateReliabilityScore(history);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getMonthsDifference', () => {
    
    test('should calculate correct months difference', () => {
      const date1 = new Date('2024-06-15');
      const date2 = new Date('2024-01-15');
      
      const months = reliabilityService.getMonthsDifference(date1, date2);
      expect(months).toBe(5);
    });

    test('should handle same dates', () => {
      const date = new Date('2024-01-15');
      
      const months = reliabilityService.getMonthsDifference(date, date);
      expect(months).toBe(0);
    });

    test('should handle year boundaries', () => {
      const date1 = new Date('2024-02-15');
      const date2 = new Date('2023-11-15');
      
      const months = reliabilityService.getMonthsDifference(date1, date2);
      expect(months).toBe(3);
    });
  });

  describe('getReliabilityStatus', () => {
    
    test('should return EXCELLENT for score >= 80', () => {
      const status = reliabilityService.getReliabilityStatus(85);
      expect(status.level).toBe('EXCELLENT');
      expect(status.message).toBe('Highly reliable donor');
    });

    test('should return GOOD for score >= 60', () => {
      const status = reliabilityService.getReliabilityStatus(65);
      expect(status.level).toBe('GOOD');
      expect(status.message).toBe('Reliable donor');
    });

    test('should return FAIR for score >= 40', () => {
      const status = reliabilityService.getReliabilityStatus(45);
      expect(status.level).toBe('FAIR');
      expect(status.message).toBe('Moderately reliable donor');
    });

    test('should return POOR for score >= 20', () => {
      const status = reliabilityService.getReliabilityStatus(25);
      expect(status.level).toBe('POOR');
      expect(status.message).toBe('Low reliability');
    });

    test('should return VERY_POOR for score < 20', () => {
      const status = reliabilityService.getReliabilityStatus(10);
      expect(status.level).toBe('VERY_POOR');
      expect(status.message).toBe('Very low reliability');
    });
  });
});
