/**
 * Donor Matching and Sorting Service
 * Implements complete matching algorithm with distance, ETA, eligibility, and reliability
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 14.1, 14.2
 */

const { Sequelize } = require('sequelize');
const db = require('../models');
const axios = require('axios');

class DonorMatchingService {
  /**
   * Finds eligible donors matching blood group and active status
   * Requirements: 4.1
   * 
   * @param {string} bloodGroup - Required blood group
   * @returns {Promise<Array>} Array of eligible donors
   */
  async findEligibleDonors(bloodGroup) {
    const donors = await db.Donor.findAll({
      include: [{
        model: db.User,
        as: 'user',
        where: {
          blood_group: bloodGroup,
          is_active: true,
          notification_enabled: true
        }
      }],
      where: {
        eligibility_score: {
          [Sequelize.Op.gt]: 0
        }
      }
    });

    return donors;
  }

  /**
   * Calculates distance and ETA between two locations
   * Requirements: 4.2, 4.3, 14.1, 14.2
   * 
   * @param {Object} donorLocation - Donor's location (POINT geography)
   * @param {Object} requestLocation - Request location (POINT geography)
   * @returns {Promise<Object>} Object with distance (km) and eta (minutes)
   */
  async calculateDistanceAndETA(donorLocation, requestLocation) {
    // Calculate distance using PostGIS ST_Distance (Requirement 4.2)
    // ST_Distance returns meters, convert to kilometers
    const distanceQuery = `
      SELECT ST_Distance(
        ST_GeogFromText(:donorLocation),
        ST_GeogFromText(:requestLocation)
      ) / 1000 as distance
    `;

    const [result] = await db.sequelize.query(distanceQuery, {
      replacements: {
        donorLocation,
        requestLocation
      },
      type: Sequelize.QueryTypes.SELECT
    });

    const distance = result.distance;

    // Calculate ETA with traffic API integration (Requirements 4.3, 14.1, 14.2)
    let eta;
    try {
      eta = await this.getTrafficETA(donorLocation, requestLocation);
    } catch (error) {
      // Fallback: Calculate ETA based on distance and average speed (Requirement 14.2)
      const averageSpeed = 40; // km/h
      eta = (distance / averageSpeed) * 60; // Convert to minutes
    }

    return {
      distance: parseFloat(distance.toFixed(2)),
      eta: Math.round(eta)
    };
  }

  /**
   * Gets real-time ETA from traffic API
   * Requirements: 14.1, 14.2
   * 
   * @param {string} origin - Origin location
   * @param {string} destination - Destination location
   * @returns {Promise<number>} ETA in minutes
   */
  async getTrafficETA(origin, destination) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Traffic API key not configured');
    }

    // Parse POINT strings to extract coordinates
    const originCoords = this.parsePointString(origin);
    const destCoords = this.parsePointString(destination);

    const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
    const params = {
      origins: `${originCoords.lat},${originCoords.lng}`,
      destinations: `${destCoords.lat},${destCoords.lng}`,
      mode: 'driving',
      departure_time: 'now', // For real-time traffic
      key: apiKey
    };

    const response = await axios.get(url, { params, timeout: 5000 });

    if (response.data.status === 'OK' && response.data.rows[0].elements[0].status === 'OK') {
      const durationInTraffic = response.data.rows[0].elements[0].duration_in_traffic || 
                                response.data.rows[0].elements[0].duration;
      return durationInTraffic.value / 60; // Convert seconds to minutes
    }

    throw new Error('Traffic API request failed');
  }

  /**
   * Parses PostGIS POINT string to coordinates
   * 
   * @param {string} pointString - POINT string (e.g., "POINT(lng lat)")
   * @returns {Object} Object with lat and lng
   */
  parsePointString(pointString) {
    const match = pointString.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    if (match) {
      return {
        lng: parseFloat(match[1]),
        lat: parseFloat(match[2])
      };
    }
    throw new Error('Invalid POINT string format');
  }

  /**
   * Calculates composite score with weighted factors
   * Requirements: 4.6
   * 
   * Weights:
   * - Distance: 25%
   * - ETA: 20%
   * - Eligibility: 25%
   * - Reliability: 30%
   * 
   * @param {Object} donor - Donor object
   * @param {number} distance - Distance in km
   * @param {number} eta - ETA in minutes
   * @returns {number} Composite score (0-1)
   */
  calculateCompositeScore(donor, distance, eta) {
    // Normalize metrics to 0-1 scale
    const distanceScore = 1 / (1 + distance / 10); // Closer = higher score
    const etaScore = 1 / (1 + eta / 30); // Faster = higher score
    const eligibilityScore = donor.eligibility_score / 100;
    const reliabilityScore = donor.reliability_score / 100;

    // Weighted composite score (Requirement 4.6)
    const weights = {
      distance: 0.25,
      eta: 0.20,
      eligibility: 0.25,
      reliability: 0.30
    };

    const compositeScore = 
      (distanceScore * weights.distance) +
      (etaScore * weights.eta) +
      (eligibilityScore * weights.eligibility) +
      (reliabilityScore * weights.reliability);

    return compositeScore;
  }

  /**
   * Finds and ranks best donors for a blood request
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
   * 
   * @param {Object} requestData - Blood request data with bloodGroup and location
   * @returns {Promise<Object>} Object with bestDonor and allDonors array
   */
  async findBestDonors(requestData) {
    const { bloodGroup, location } = requestData;

    if (!bloodGroup || !location) {
      throw new Error('Blood group and location are required');
    }

    // Step 1: Find eligible donors (Requirement 4.1)
    const eligibleDonors = await this.findEligibleDonors(bloodGroup);

    if (eligibleDonors.length === 0) {
      return {
        bestDonor: null,
        allDonors: []
      };
    }

    // Step 2: Calculate distance, ETA, and composite score for each donor
    const scoredDonors = await Promise.all(
      eligibleDonors.map(async (donor) => {
        // Skip donors without location
        if (!donor.current_location) {
          return null;
        }

        // Calculate distance and ETA (Requirements 4.2, 4.3)
        const { distance, eta } = await this.calculateDistanceAndETA(
          donor.current_location,
          location
        );

        // Calculate composite score (Requirement 4.6)
        const compositeScore = this.calculateCompositeScore(donor, distance, eta);

        return {
          id: donor.id,
          userId: donor.user_id,
          fullName: donor.user.full_name,
          bloodGroup: donor.user.blood_group,
          eligibilityScore: parseFloat(donor.eligibility_score),
          reliabilityScore: parseFloat(donor.reliability_score),
          distance,
          eta,
          compositeScore: parseFloat(compositeScore.toFixed(4)),
          location: donor.current_location
        };
      })
    );

    // Filter out null entries (donors without location)
    const validDonors = scoredDonors.filter(d => d !== null);

    // Step 3: Sort by composite score (descending) (Requirement 4.7)
    validDonors.sort((a, b) => b.compositeScore - a.compositeScore);

    // Step 4: Return best donor first (Requirement 4.8)
    return {
      bestDonor: validDonors[0] || null,
      allDonors: validDonors
    };
  }

  /**
   * Legacy method for backward compatibility
   * Calculates composite score for donor ranking
   */
  calculateDonorScore(donor) {
    const distanceScore = 1 / (donor.distance + 1);
    const reliabilityScore = donor.reliability / 100;
    const compositeScore = (distanceScore * 0.3) + (reliabilityScore * 0.7);
    return compositeScore;
  }

  /**
   * Legacy method for backward compatibility
   * Sorts donors by composite score (best donor first)
   */
  sortDonors(donors) {
    return donors
      .map(donor => ({
        ...donor,
        score: this.calculateDonorScore(donor)
      }))
      .sort((a, b) => b.score - a.score);
  }
}

module.exports = new DonorMatchingService();
