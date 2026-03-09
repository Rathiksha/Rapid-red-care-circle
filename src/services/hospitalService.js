/**
 * Hospital Service
 * Business logic for hospital discovery and smart priority ranking
 */

const db = require('../models');
const { Sequelize } = require('sequelize');

/**
 * Calculate priority score for a hospital
 * @param {Object} hospital - Hospital instance
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @param {string} bloodGroup - Required blood group (optional)
 * @returns {number} Priority score (0-100)
 */
function calculatePriorityScore(hospital, userLat, userLng, bloodGroup = null) {
  let score = 0;
  
  // 1. Blood Availability (40 points)
  if (bloodGroup && hospital.hasBloodType(bloodGroup)) {
    const units = hospital.getUnitsAvailable(bloodGroup);
    // More units = higher score
    const availabilityScore = Math.min(units / 20 * 40, 40); // Max 40 points
    score += availabilityScore;
    
    // Penalty for stale data
    if (hospital.isInventoryStale(bloodGroup)) {
      score -= 10; // Reduce score if data is old
    }
  }
  
  // 2. Proximity (35 points)
  const distance = hospital.calculateDistance(userLat, userLng);
  if (distance !== null) {
    // Closer = higher score (inverse relationship)
    // 0-5km = 35 points, 5-10km = 25 points, 10-20km = 15 points, >20km = 5 points
    let proximityScore = 35;
    if (distance > 20) {
      proximityScore = 5;
    } else if (distance > 10) {
      proximityScore = 15;
    } else if (distance > 5) {
      proximityScore = 25;
    }
    score += proximityScore;
  }
  
  // 3. Service Rating (15 points)
  const rating = parseFloat(hospital.service_rating) || 0;
  const ratingScore = (rating / 5) * 15; // Convert 0-5 rating to 0-15 points
  score += ratingScore;
  
  // 4. Inventory Freshness (10 points)
  if (bloodGroup) {
    const isStale = hospital.isInventoryStale(bloodGroup);
    score += isStale ? 0 : 10;
  } else {
    // If no specific blood group, check overall freshness
    score += 5; // Default partial credit
  }
  
  return Math.round(score * 10) / 10; // Round to 1 decimal place
}

/**
 * Find nearby hospitals within radius
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {number} radius - Search radius in km (default: 20)
 * @param {string} bloodGroup - Filter by blood availability (optional)
 * @returns {Promise<Array>} Array of hospitals with distance and priority
 */
async function findNearbyHospitals(latitude, longitude, radius = 20, bloodGroup = null) {
  try {
    // Find all active hospitals
    const hospitals = await db.HospitalBloodBank.findAll({
      where: {
        is_active: true
      }
    });
    
    // Calculate distance and filter by radius
    const hospitalsWithDistance = hospitals
      .map(hospital => {
        const distance = hospital.calculateDistance(latitude, longitude);
        const location = hospital.getLocation();
        
        return {
          id: hospital.id,
          name: hospital.hospital_name,
          address: hospital.address,
          coordinates: location ? {
            lat: location.coordinates[1],
            lng: location.coordinates[0]
          } : null,
          distance: distance ? Math.round(distance * 10) / 10 : null,
          contact: hospital.contact_number,
          emergencyContact: hospital.emergency_contact,
          serviceRating: parseFloat(hospital.service_rating) || 0,
          bloodAvailability: hospital.blood_availability,
          lastUpdated: hospital.last_updated,
          operatingHours: hospital.operating_hours,
          isActive: hospital.is_active,
          priorityScore: calculatePriorityScore(hospital, latitude, longitude, bloodGroup),
          _instance: hospital // Keep instance for further processing
        };
      })
      .filter(h => h.distance !== null && h.distance <= radius);
    
    // Filter by blood availability if specified
    let filteredHospitals = hospitalsWithDistance;
    if (bloodGroup) {
      filteredHospitals = hospitalsWithDistance.filter(h => 
        h._instance.hasBloodType(bloodGroup)
      );
    }
    
    // Sort by priority score (highest first)
    filteredHospitals.sort((a, b) => b.priorityScore - a.priorityScore);
    
    // Remove internal instance reference
    filteredHospitals.forEach(h => delete h._instance);
    
    return filteredHospitals;
  } catch (error) {
    console.error('Error finding nearby hospitals:', error);
    throw error;
  }
}

/**
 * Get hospital by ID with full details
 * @param {number} hospitalId - Hospital ID
 * @param {number} userLat - User's latitude (for distance calculation)
 * @param {number} userLng - User's longitude (for distance calculation)
 * @returns {Promise<Object>} Hospital details
 */
async function getHospitalDetails(hospitalId, userLat = null, userLng = null) {
  try {
    const hospital = await db.HospitalBloodBank.findByPk(hospitalId);
    
    if (!hospital) {
      throw new Error('Hospital not found');
    }
    
    const location = hospital.getLocation();
    let distance = null;
    let priorityScore = null;
    
    if (userLat && userLng) {
      distance = hospital.calculateDistance(userLat, userLng);
      priorityScore = calculatePriorityScore(hospital, userLat, userLng);
    }
    
    return {
      id: hospital.id,
      name: hospital.hospital_name,
      address: hospital.address,
      coordinates: location ? {
        lat: location.coordinates[1],
        lng: location.coordinates[0]
      } : null,
      distance: distance ? Math.round(distance * 10) / 10 : null,
      contact: hospital.contact_number,
      emergencyContact: hospital.emergency_contact,
      serviceRating: parseFloat(hospital.service_rating) || 0,
      bloodAvailability: hospital.blood_availability,
      lastUpdated: hospital.last_updated,
      operatingHours: hospital.operating_hours,
      isActive: hospital.is_active,
      priorityScore
    };
  } catch (error) {
    console.error('Error getting hospital details:', error);
    throw error;
  }
}

/**
 * Update hospital blood inventory
 * @param {number} hospitalId - Hospital ID
 * @param {Object} inventory - Blood inventory object
 * @returns {Promise<Object>} Updated hospital
 */
async function updateBloodInventory(hospitalId, inventory) {
  try {
    const hospital = await db.HospitalBloodBank.findByPk(hospitalId);
    
    if (!hospital) {
      throw new Error('Hospital not found');
    }
    
    // Update inventory with timestamps
    const updatedInventory = {};
    const now = new Date().toISOString();
    
    for (const [bloodGroup, data] of Object.entries(inventory)) {
      updatedInventory[bloodGroup] = {
        units: data.units || 0,
        updated_at: now
      };
    }
    
    hospital.blood_availability = updatedInventory;
    hospital.last_updated = new Date();
    await hospital.save();
    
    return {
      id: hospital.id,
      name: hospital.hospital_name,
      bloodAvailability: hospital.blood_availability,
      lastUpdated: hospital.last_updated
    };
  } catch (error) {
    console.error('Error updating blood inventory:', error);
    throw error;
  }
}

/**
 * Search hospitals with smart priority ranking
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {string} bloodGroup - Required blood group
 * @param {string} urgency - "emergency" or "routine"
 * @returns {Promise<Object>} Ranked hospitals with recommendations
 */
async function searchHospitalsWithPriority(latitude, longitude, bloodGroup, urgency = 'routine') {
  try {
    // Adjust radius based on urgency
    const radius = urgency === 'emergency' ? 30 : 20;
    
    const hospitals = await findNearbyHospitals(latitude, longitude, radius, bloodGroup);
    
    // Get top 3 recommendations
    const topRecommendations = hospitals.slice(0, 3);
    
    // Calculate statistics
    const withBlood = hospitals.filter(h => {
      const availability = h.bloodAvailability[bloodGroup];
      return availability && availability.units > 0;
    }).length;
    
    const averageDistance = hospitals.length > 0
      ? hospitals.reduce((sum, h) => sum + h.distance, 0) / hospitals.length
      : 0;
    
    return {
      hospitals,
      topRecommendations,
      summary: {
        total: hospitals.length,
        withBlood,
        averageDistance: Math.round(averageDistance * 10) / 10,
        searchRadius: radius,
        urgency
      }
    };
  } catch (error) {
    console.error('Error searching hospitals:', error);
    throw error;
  }
}

module.exports = {
  findNearbyHospitals,
  getHospitalDetails,
  updateBloodInventory,
  searchHospitalsWithPriority,
  calculatePriorityScore
};
