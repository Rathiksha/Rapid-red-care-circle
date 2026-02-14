/**
 * Eligibility Score Calculation Service
 * Calculates donor eligibility based on last donation date and medical history
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

class EligibilityService {
  /**
   * Calculates eligibility score for a donor
   * Requirements: 2.1, 2.2, 2.3
   * 
   * Formula:
   * - Base Score: 100%
   * - Last donation < 90 days: -50%
   * - Last donation 90-120 days: -25%
   * - Diabetes: -15%
   * - Seizures: -20%
   * - Minimum: 0%, Maximum: 100%
   * 
   * @param {Object} donor - Donor object with lastDonationDate and medicalHistory
   * @returns {number} Eligibility score (0-100)
   */
  calculateEligibilityScore(donor) {
    let score = 100;

    // Check last donation date (Requirement 2.2)
    if (donor.last_donation_date || donor.lastDonationDate) {
      const lastDonationDate = donor.last_donation_date || donor.lastDonationDate;
      const daysSinceLastDonation = this.getDaysDifference(
        new Date(),
        new Date(lastDonationDate)
      );

      if (daysSinceLastDonation < 90) {
        score -= 50;
      } else if (daysSinceLastDonation < 120) {
        score -= 25;
      }
    }

    // Check medical history (Requirement 2.3)
    const medicalHistory = donor.medical_history || donor.medicalHistory;
    if (medicalHistory) {
      if (medicalHistory.diabetes) {
        score -= 15;
      }
      if (medicalHistory.seizures) {
        score -= 20;
      }
    }

    // Ensure score stays within 0-100% range (Requirement 2.4)
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculates the difference in days between two dates
   * 
   * @param {Date} date1 - First date (usually current date)
   * @param {Date} date2 - Second date (usually last donation date)
   * @returns {number} Number of days between dates
   */
  getDaysDifference(date1, date2) {
    const diffTime = Math.abs(date1 - date2);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Recalculates eligibility score and updates donor record
   * Requirement: 2.5
   * 
   * @param {Object} donor - Donor model instance
   * @returns {Promise<number>} Updated eligibility score
   */
  async recalculateAndUpdate(donor) {
    const newScore = this.calculateEligibilityScore(donor);
    
    // Update the donor's eligibility score
    donor.eligibility_score = newScore;
    await donor.save();

    return newScore;
  }

  /**
   * Checks if a donor is eligible to donate (score > 0)
   * 
   * @param {Object} donor - Donor object
   * @returns {boolean} True if eligible
   */
  isEligible(donor) {
    const score = this.calculateEligibilityScore(donor);
    return score > 0;
  }

  /**
   * Gets eligibility status with human-readable message
   * 
   * @param {Object} donor - Donor object
   * @returns {Object} Object with score, eligible flag, and message
   */
  getEligibilityStatus(donor) {
    const score = this.calculateEligibilityScore(donor);
    const eligible = score > 0;

    let message = '';
    if (score === 100) {
      message = 'Fully eligible to donate';
    } else if (score >= 50) {
      message = 'Eligible with some restrictions';
    } else if (score > 0) {
      message = 'Limited eligibility';
    } else {
      message = 'Currently not eligible to donate';
    }

    return {
      score,
      eligible,
      message
    };
  }
}

module.exports = new EligibilityService();
