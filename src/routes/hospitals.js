const express = require('express');
const router = express.Router();
const hospitalService = require('../services/hospitalService');
const db = require('../models');

/**
 * GET /api/hospitals/nearby
 * Get hospitals within specified radius
 */
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius, bloodGroup } = req.query;
    
    console.log('🏥 [HOSPITALS] Fetching nearby hospitals');
    console.log('📍 [HOSPITALS] Location:', { latitude, longitude });
    console.log('📏 [HOSPITALS] Radius:', radius || '20km (default)');
    if (bloodGroup) {
      console.log('🩸 [HOSPITALS] Blood group filter:', bloodGroup);
    }
    
    // Validate required parameters
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const searchRadius = radius ? parseFloat(radius) : 20;
    
    if (isNaN(lat) || isNaN(lng) || isNaN(searchRadius)) {
      return res.status(400).json({ 
        error: 'Invalid coordinates or radius' 
      });
    }
    
    const hospitals = await hospitalService.findNearbyHospitals(
      lat, 
      lng, 
      searchRadius, 
      bloodGroup
    );
    
    console.log('✅ [HOSPITALS] Found', hospitals.length, 'hospitals');
    
    // Calculate summary statistics
    const withBlood = bloodGroup 
      ? hospitals.filter(h => {
          const availability = h.bloodAvailability[bloodGroup];
          return availability && availability.units > 0;
        }).length
      : hospitals.length;
    
    const averageDistance = hospitals.length > 0
      ? hospitals.reduce((sum, h) => sum + h.distance, 0) / hospitals.length
      : 0;
    
    res.json({
      hospitals,
      summary: {
        total: hospitals.length,
        withBlood,
        averageDistance: Math.round(averageDistance * 10) / 10,
        searchRadius
      }
    });
  } catch (error) {
    console.error('❌ [HOSPITALS] Error fetching nearby hospitals:', error);
    res.status(500).json({ 
      error: 'Failed to fetch nearby hospitals',
      message: error.message 
    });
  }
});

/**
 * GET /api/hospitals/search
 * Smart search with priority ranking
 */
router.get('/search', async (req, res) => {
  try {
    const { latitude, longitude, bloodGroup, urgency } = req.query;
    
    console.log('🔍 [HOSPITALS] Smart search request');
    console.log('📍 [HOSPITALS] Location:', { latitude, longitude });
    console.log('🩸 [HOSPITALS] Blood group:', bloodGroup);
    console.log('⚡ [HOSPITALS] Urgency:', urgency || 'routine');
    
    // Validate required parameters
    if (!latitude || !longitude || !bloodGroup) {
      return res.status(400).json({ 
        error: 'Latitude, longitude, and blood group are required' 
      });
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ 
        error: 'Invalid coordinates' 
      });
    }
    
    const result = await hospitalService.searchHospitalsWithPriority(
      lat,
      lng,
      bloodGroup,
      urgency
    );
    
    console.log('✅ [HOSPITALS] Found', result.hospitals.length, 'hospitals');
    console.log('⭐ [HOSPITALS] Top recommendations:', result.topRecommendations.length);
    
    res.json(result);
  } catch (error) {
    console.error('❌ [HOSPITALS] Error in smart search:', error);
    res.status(500).json({ 
      error: 'Failed to search hospitals',
      message: error.message 
    });
  }
});

/**
 * GET /api/hospitals/:id
 * Get hospital details by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.query;
    
    console.log('🏥 [HOSPITALS] Fetching hospital details:', id);
    
    const lat = latitude ? parseFloat(latitude) : null;
    const lng = longitude ? parseFloat(longitude) : null;
    
    const hospital = await hospitalService.getHospitalDetails(id, lat, lng);
    
    console.log('✅ [HOSPITALS] Hospital found:', hospital.name);
    
    res.json(hospital);
  } catch (error) {
    console.error('❌ [HOSPITALS] Error fetching hospital:', error);
    
    if (error.message === 'Hospital not found') {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch hospital details',
      message: error.message 
    });
  }
});

/**
 * GET /api/hospitals/:id/inventory
 * Get blood inventory for specific hospital
 */
router.get('/:id/inventory', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📊 [HOSPITALS] Fetching inventory for hospital:', id);
    
    const hospital = await db.HospitalBloodBank.findByPk(id);
    
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    res.json({
      hospitalId: hospital.id,
      hospitalName: hospital.hospital_name,
      bloodAvailability: hospital.blood_availability,
      lastUpdated: hospital.last_updated
    });
  } catch (error) {
    console.error('❌ [HOSPITALS] Error fetching inventory:', error);
    res.status(500).json({ 
      error: 'Failed to fetch inventory',
      message: error.message 
    });
  }
});

/**
 * PUT /api/hospitals/:id/inventory
 * Update blood inventory (admin only - add auth middleware in production)
 */
router.put('/:id/inventory', async (req, res) => {
  try {
    const { id } = req.params;
    const { inventory } = req.body;
    
    console.log('📝 [HOSPITALS] Updating inventory for hospital:', id);
    console.log('📊 [HOSPITALS] New inventory:', inventory);
    
    if (!inventory || typeof inventory !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid inventory data' 
      });
    }
    
    const result = await hospitalService.updateBloodInventory(id, inventory);
    
    console.log('✅ [HOSPITALS] Inventory updated successfully');
    
    res.json({
      message: 'Inventory updated successfully',
      hospital: result
    });
  } catch (error) {
    console.error('❌ [HOSPITALS] Error updating inventory:', error);
    
    if (error.message === 'Hospital not found') {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to update inventory',
      message: error.message 
    });
  }
});

/**
 * GET /api/hospitals
 * Get all hospitals (with optional filters)
 */
router.get('/', async (req, res) => {
  try {
    const { isActive } = req.query;
    
    console.log('🏥 [HOSPITALS] Fetching all hospitals');
    
    const where = {};
    if (isActive !== undefined) {
      where.is_active = isActive === 'true';
    }
    
    const hospitals = await db.HospitalBloodBank.findAll({
      where,
      order: [['hospital_name', 'ASC']]
    });
    
    const hospitalsData = hospitals.map(h => {
      const location = h.getLocation();
      return {
        id: h.id,
        name: h.hospital_name,
        address: h.address,
        coordinates: location ? {
          lat: location.coordinates[1],
          lng: location.coordinates[0]
        } : null,
        contact: h.contact_number,
        emergencyContact: h.emergency_contact,
        serviceRating: parseFloat(h.service_rating) || 0,
        bloodAvailability: h.blood_availability,
        lastUpdated: h.last_updated,
        isActive: h.is_active
      };
    });
    
    console.log('✅ [HOSPITALS] Found', hospitalsData.length, 'hospitals');
    
    res.json({
      hospitals: hospitalsData,
      total: hospitalsData.length
    });
  } catch (error) {
    console.error('❌ [HOSPITALS] Error fetching hospitals:', error);
    res.status(500).json({ 
      error: 'Failed to fetch hospitals',
      message: error.message 
    });
  }
});

module.exports = router;
