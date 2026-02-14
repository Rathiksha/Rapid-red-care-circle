/**
 * Unit Tests for ColorBandService
 * Tests color band assignment and emergency warning logic
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.6
 */

const colorBandService = require('../src/services/colorBandService');

describe('ColorBandService', () => {
  
  describe('assignColorBand', () => {
    
    test('should assign RED band for immediate timeframe', () => {
      const result = colorBandService.assignColorBand('immediate');
      
      expect(result.urgencyBand).toBe('RED');
      expect(result.emergencyWarning).toBe(true);
    });

    test('should assign RED band for within_2_hours timeframe', () => {
      const result = colorBandService.assignColorBand('within_2_hours');
      
      expect(result.urgencyBand).toBe('RED');
      expect(result.emergencyWarning).toBe(true);
    });

    test('should assign PINK band for within_24_hours timeframe', () => {
      const result = colorBandService.assignColorBand('within_24_hours');
      
      expect(result.urgencyBand).toBe('PINK');
      expect(result.emergencyWarning).toBe(false);
    });

    test('should assign WHITE band for after_24_hours timeframe', () => {
      const result = colorBandService.assignColorBand('after_24_hours');
      
      expect(result.urgencyBand).toBe('WHITE');
      expect(result.emergencyWarning).toBe(false);
    });

    test('should default to WHITE band for unknown timeframe', () => {
      const result = colorBandService.assignColorBand('unknown_timeframe');
      
      expect(result.urgencyBand).toBe('WHITE');
      expect(result.emergencyWarning).toBe(false);
    });

    test('should throw error when timeframe is not provided', () => {
      expect(() => colorBandService.assignColorBand(null)).toThrow('Required timeframe is mandatory');
      expect(() => colorBandService.assignColorBand(undefined)).toThrow('Required timeframe is mandatory');
    });

    test('should set emergency warning only for RED band', () => {
      const redResult = colorBandService.assignColorBand('immediate');
      const pinkResult = colorBandService.assignColorBand('within_24_hours');
      const whiteResult = colorBandService.assignColorBand('after_24_hours');
      
      expect(redResult.emergencyWarning).toBe(true);
      expect(pinkResult.emergencyWarning).toBe(false);
      expect(whiteResult.emergencyWarning).toBe(false);
    });
  });

  describe('isValidTimeframe', () => {
    
    test('should validate correct timeframe values', () => {
      expect(colorBandService.isValidTimeframe('immediate')).toBe(true);
      expect(colorBandService.isValidTimeframe('within_2_hours')).toBe(true);
      expect(colorBandService.isValidTimeframe('within_24_hours')).toBe(true);
      expect(colorBandService.isValidTimeframe('after_24_hours')).toBe(true);
    });

    test('should reject invalid timeframe values', () => {
      expect(colorBandService.isValidTimeframe('invalid')).toBe(false);
      expect(colorBandService.isValidTimeframe('')).toBe(false);
      expect(colorBandService.isValidTimeframe(null)).toBe(false);
    });
  });

  describe('getTimeoutThresholds', () => {
    
    test('should return correct thresholds for RED band', () => {
      const thresholds = colorBandService.getTimeoutThresholds('RED');
      
      expect(thresholds.viewTimeout).toBe(10);
      expect(thresholds.responseTimeout).toBe(20);
    });

    test('should return correct thresholds for PINK band', () => {
      const thresholds = colorBandService.getTimeoutThresholds('PINK');
      
      expect(thresholds.viewTimeout).toBe(null);
      expect(thresholds.responseTimeout).toBe(30);
    });

    test('should return correct thresholds for WHITE band', () => {
      const thresholds = colorBandService.getTimeoutThresholds('WHITE');
      
      expect(thresholds.viewTimeout).toBe(null);
      expect(thresholds.responseTimeout).toBe(null);
    });

    test('should default to WHITE thresholds for unknown band', () => {
      const thresholds = colorBandService.getTimeoutThresholds('UNKNOWN');
      
      expect(thresholds.viewTimeout).toBe(null);
      expect(thresholds.responseTimeout).toBe(null);
    });
  });
});
