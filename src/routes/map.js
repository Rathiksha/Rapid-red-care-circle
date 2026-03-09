const express = require('express');
const router = express.Router();
const db = require('../models');
const { Sequelize } = require('sequelize');

// Get all active donors for map display
router.get('/donors', async (req, res) => {
  try {
    const { bloodGroup } = req.query;
    
    console.log('🗺️ [MAP] Fetching donors for map display');
    if (bloodGroup) {
      console.log('🩸 [MAP] Filtering by blood group:', bloodGroup);
    }
    
    // Build where clause for users
    const userWhere = {
      is_active: true
    };
    
    // Add blood group filter if provided
    if (bloodGroup) {
      userWhere.blood_group = bloodGroup;
    }
    
    const donors = await db.Donor.findAll({
      include: [{
        model: db.User,
        as: 'user',
        where: userWhere,
        attributes: ['id', 'full_name', 'blood_group', 'city', 'address', 'is_active']
      }],
      where: {
        current_location: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    console.log('📊 [MAP] Found', donors.length, 'donors');

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
      
      // Determine donor status for color coding
      // GREEN: Willing AND Passed Eligibility (Best Donors)
      // RED: Not willing OR Not passed eligibility (Default users)
      const isGreen = donor.is_willing && donor.passed_eligibility;
      const status = isGreen ? 'willing' : 'default';
      const markerColor = isGreen ? 'green' : 'red';

      return {
        id: donor.id,
        userId: donor.user_id,
        fullName: donor.user.full_name,
        bloodGroup: donor.user.blood_group,
        city: donor.user.city,
        address: donor.user.address,
        eligibilityScore: parseFloat(donor.eligibility_score),
        reliabilityScore: parseFloat(donor.reliability_score),
        totalDonations: donor.total_donations,
        completedDonations: donor.completed_donations,
        coordinates,
        isWilling: donor.is_willing,
        passedEligibility: donor.passed_eligibility,
        status,
        markerColor
      };
    });
    
    // Separate willing and default donors
    const willingDonors = donorData.filter(d => d.status === 'willing');
    const defaultDonors = donorData.filter(d => d.status === 'default');
    
    console.log('💚 [MAP] Willing donors (green):', willingDonors.length);
    console.log('🔴 [MAP] Default donors (red):', defaultDonors.length);

    res.json({ 
      donors: donorData,
      summary: {
        total: donorData.length,
        willing: willingDonors.length,
        default: defaultDonors.length
      }
    });
  } catch (error) {
    console.error('❌ [MAP] Error fetching donors:', error);
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
