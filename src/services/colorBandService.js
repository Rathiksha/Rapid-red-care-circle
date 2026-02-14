/**
 * Color Band Classification Service
 * Handles urgency band assignment based on required timeframe
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.6
 */

class ColorBandService {
  /**
   * Assigns color band based on required timeframe
   * Requirements: 3.1, 3.2, 3.3, 3.4
   * 
   * @param {string} requiredTimeframe - The timeframe for blood requirement
   * @returns {Object} Object containing urgencyBand and emergencyWarning
   */
  assignColorBand(requiredTimeframe) {
    if (!requiredTimeframe) {
      throw new Error('Required timeframe is mandatory');
    }

    const timeframeMap = {
      'immediate': 'RED',
      'within_2_hours': 'RED',
      'within_24_hours': 'PINK',
      'after_24_hours': 'WHITE'
    };

    const urgencyBand = timeframeMap[requiredTimeframe] || 'WHITE';
    
    // RED band requests get emergency warning flag (Requirement 3.6)
    const emergencyWarning = (urgencyBand === 'RED');

    return {
      urgencyBand,
      emergencyWarning
    };
  }

  /**
   * Validates if a timeframe value is valid
   * 
   * @param {string} timeframe - The timeframe to validate
   * @returns {boolean} True if valid
   */
  isValidTimeframe(timeframe) {
    const validTimeframes = ['immediate', 'within_2_hours', 'within_24_hours', 'after_24_hours'];
    return validTimeframes.includes(timeframe);
  }

  /**
   * Gets timeout thresholds for a given urgency band
   * 
   * @param {string} urgencyBand - The urgency band (RED/PINK/WHITE)
   * @returns {Object} Object containing view and response timeout in minutes
   */
  getTimeoutThresholds(urgencyBand) {
    const thresholds = {
      'RED': {
        viewTimeout: 10,      // 10 minutes to view
        responseTimeout: 20   // 20 minutes to respond after viewing
      },
      'PINK': {
        viewTimeout: null,    // No view timeout
        responseTimeout: 30   // 30 minutes to respond
      },
      'WHITE': {
        viewTimeout: null,    // No view timeout
        responseTimeout: null // No response timeout
      }
    };

    return thresholds[urgencyBand] || thresholds['WHITE'];
  }
}

module.exports = new ColorBandService();
