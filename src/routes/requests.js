const express = require('express');
const router = express.Router();
const db = require('../models');
const colorBandService = require('../services/colorBandService');

// Create blood request
router.post('/', async (req, res) => {
  try {
    const { requesterId, bloodGroup, requiredTimeframe, latitude, longitude, hospitalName } = req.body;

    // Assign color band
    const { urgencyBand, emergencyWarning } = colorBandService.assignColorBand(requiredTimeframe);

    // Create request
    const request = await db.BloodRequest.create({
      requester_id: requesterId,
      blood_group: bloodGroup,
      urgency_band: urgencyBand,
      required_timeframe: requiredTimeframe,
      hospital_name: hospitalName,
      emergency_warning: emergencyWarning,
      status: 'PENDING'
    });

    // Set location
    request.setLocation(longitude, latitude);
    await request.save();

    res.status(201).json({
      message: 'Blood request created successfully',
      request: {
        id: request.id,
        urgencyBand,
        emergencyWarning,
        status: request.status
      }
    });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Failed to create request', message: error.message });
  }
});

// Get active requests
router.get('/active', async (req, res) => {
  try {
    const requests = await db.BloodRequest.findAll({
      where: {
        status: ['PENDING', 'DONOR_ACCEPTED', 'IN_PROGRESS']
      },
      include: [{
        model: db.User,
        as: 'requester',
        attributes: ['full_name', 'city']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

module.exports = router;
