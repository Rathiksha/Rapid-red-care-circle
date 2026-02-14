const express = require('express');
const router = express.Router();
const db = require('../models');
const { Sequelize } = require('sequelize');

// Get all active donors for map display
router.get('/donors', async (req, res) => {
  try {
    const donors = await db.Donor.findAll({
      include: [{
        model: db.User,
        as: 'user',
        where: {
          is_active: true,
          notification_enabled: true
        },
        attributes: ['id', 'full_name', 'blood_group', 'city']
      }],
      where: {
        current_location: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    const donorData = donors.map(donor => {
      // Parse location
      let coordinates = null;
      if (donor.current_location) {
        const match = donor.current_location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
        if (match) {
          coordinates = {
            lng: parseFloat(match[1]),
            lat: parseFloat(match[2])
          };
        }
      }

      return {
        id: donor.id,
        userId: donor.user_id,
        fullName: donor.user.full_name,
        bloodGroup: donor.user.blood_group,
        city: donor.user.city,
        eligibilityScore: parseFloat(donor.eligibility_score),
        reliabilityScore: parseFloat(donor.reliability_score),
        totalDonations: donor.total_donations,
        completedDonations: donor.completed_donations,
        coordinates
      };
    });

    res.json({ donors: donorData });
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({ error: 'Failed to fetch donors' });
  }
});

// Get donor details by ID
router.get('/donors/:id', async (req, res) => {
  try {
    const donor = await db.Donor.findByPk(req.params.id, {
      include: [{
        model: db.User,
        as: 'user'
      }]
    });

    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    res.json({
      id: donor.id,
      fullName: donor.user.full_name,
      bloodGroup: donor.user.blood_group,
      city: donor.user.city,
      eligibilityScore: parseFloat(donor.eligibility_score),
      reliabilityScore: parseFloat(donor.reliability_score),
      totalDonations: donor.total_donations,
      completedDonations: donor.completed_donations,
      lastDonationDate: donor.last_donation_date
    });
  } catch (error) {
    console.error('Error fetching donor details:', error);
    res.status(500).json({ error: 'Failed to fetch donor details' });
  }
});

module.exports = router;
