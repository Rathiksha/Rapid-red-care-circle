const express = require('express');
const router = express.Router();
const db = require('../models');

// Update donor location
router.put('/:id/location', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    const donor = await db.Donor.findByPk(req.params.id);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    donor.setLocation(longitude, latitude);
    donor.location_updated_at = new Date();
    await donor.save();

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Search eligible donors
router.get('/search', async (req, res) => {
  try {
    const { bloodGroup, latitude, longitude } = req.query;
    
    if (!bloodGroup) {
      return res.status(400).json({ error: 'Blood group is required' });
    }

    const donorMatchingService = require('../services/donorMatchingService');
    
    const requestLocation = `POINT(${longitude} ${latitude})`;
    const result = await donorMatchingService.findBestDonors({
      bloodGroup,
      location: requestLocation
    });

    res.json(result);
  } catch (error) {
    console.error('Error searching donors:', error);
    res.status(500).json({ error: 'Failed to search donors', message: error.message });
  }
});

module.exports = router;
