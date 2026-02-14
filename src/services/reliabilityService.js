/**
 * Reliability Score Calculation Service
 * Tracks donor reliability based on response history with time-weighted decay
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

class ReliabilityService {
  /**
   * Calculates reliability score based on donation history
   * Requirements: 11.1, 11.2, 11.3, 11.4
   * 
   * Formula:
   * - Base Score: 50%
   * - Completed donation: +10 points
   * - Cancelled donation: -15 points
   * - Ignored notification: -5 points
   * - Declined request: -2 points
   * - Time decay: Recent actions (< 6 months) weighted 2x
   * - Minimum: 0%, Maximum: 100%
   * 
   * @param {Array} donationHistory - Array of donation history records
   * @returns {number} Reliability score (0-100)
   */
  calculateReliabilityScore(donationHistory) {
    let score = 50; // Base score (Requirement 11.1)

    if (!donationHistory || donationHistory.length === 0) {
      return score;
    }

    const now = new Date();

    donationHistory.forEach(action => {
      // Calculate time decay weight (Requirement 11.4)
      const actionDate = new Date(action.completed_at || action.cancelled_at || action.accepted_at);
      const monthsAgo = this.getMonthsDifference(now, actionDate);
      const weight = monthsAgo > 6 ? 0.5 : 1.0; // Recent actions weighted 2x

      // Apply score adjustments based on action type (Requirements 11.1, 11.2, 11.3)
      switch (action.status) {
        case 'COMPLETED':
          score += 10 * weight; // Requirement 11.1
          break;
        case 'CANCELLED':
          score -= 15 * weight; // Requirement 11.2
          break;
        default:
          break;
      }

      // Handle response types from notifications
      if (action.response_type) {
        switch (action.response_type) {
          case 'IGNORED':
            score -= 5 * weight; // Requirement 11.3
            break;
          case 'DECLINED':
            score -= 2 * weight; // Requirement 11.3
            break;
          default:
            break;
        }
      }
    });

    // Ensure score stays within 0-100% range
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculates the difference in months between two dates
   * 
   * @param {Date} date1 - First date (usually current date)
   * @param {Date} date2 - Second date (usually action date)
   * @returns {number} Number of months between dates
   */
  getMonthsDifference(date1, date2) {
    const yearsDiff = date1.getFullYear() - date2.getFullYear();
    const monthsDiff = date1.getMonth() - date2.getMonth();
    return yearsDiff * 12 + monthsDiff;
  }

  /**
   * Updates reliability score after a donation event
   * Requirement: 11.5
   * 
   * @param {Object} donor - Donor model instance
   * @param {Array} donationHistory - Updated donation history
   * @returns {Promise<number>} Updated reliability score
   */
  async updateReliabilityScore(donor, donationHistory) {
    const newScore = this.calculateReliabilityScore(donationHistory);
    
    // Update the donor's reliability score (Requirement 11.5)
    donor.reliability_score = newScore;
    await donor.save();

    return newScore;
  }

  /**
   * Records a donation action and updates reliability score
   * 
   * @param {Object} donor - Donor model instance
   * @param {string} actionType - Type of action (COMPLETED, CANCELLED, IGNORED, DECLINED)
   * @param {Object} actionData - Additional action data
   * @returns {Promise<number>} Updated reliability score
   */
  async recordAction(donor, actionType, actionData = {}) {
    // Fetch current donation history
    const donationHistory = await donor.getDonationHistory();

    // Add new action to history
    const newAction = {
      status: actionType,
      response_type: actionData.responseType,
      completed_at: actionType === 'COMPLETED' ? new Date() : null,
      cancelled_at: actionType === 'CANCELLED' ? new Date() : null,
      accepted_at: actionData.acceptedAt || new Date()
    };

    // Calculate and update reliability score
    const updatedHistory = [...donationHistory, newAction];
    return await this.updateReliabilityScore(donor, updatedHistory);
  }

  /**
   * Gets reliability status with human-readable message
   * 
   * @param {number} score - Reliability score
   * @returns {Object} Object with score and message
   */
  getReliabilityStatus(score) {
    let message = '';
    let level = '';

    if (score >= 80) {
      level = 'EXCELLENT';
      message = 'Highly reliable donor';
    } else if (score >= 60) {
      level = 'GOOD';
      message = 'Reliable donor';
    } else if (score >= 40) {
      level = 'FAIR';
      message = 'Moderately reliable donor';
    } else if (score >= 20) {
      level = 'POOR';
      message = 'Low reliability';
    } else {
      level = 'VERY_POOR';
      message = 'Very low reliability';
    }

    return {
      score,
      level,
      message
    };
  }
}

module.exports = new ReliabilityService();
