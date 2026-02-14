const express = require('express');
const router = express.Router();
const db = require('../models');

// Get donation history for a requester
router.get('/requester/:requesterId', async (req, res) => {
  try {
    const { requesterId } = req.params;

    let acceptedDonations = [];
    let futureCommitments = [];

    // Try to get accepted donations
    try {
      acceptedDonations = await db.DonationHistory.findAll({
        where: {
          requester_id: requesterId,
          status: ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED']
        },
        include: [
          {
            model: db.Donor,
            as: 'donor',
            required: false,
            include: [{
              model: db.User,
              as: 'user',
              required: false,
              attributes: ['full_name', 'blood_group', 'city']
            }]
          },
          {
            model: db.BloodRequest,
            as: 'request',
            required: false,
            attributes: ['urgency_band', 'created_at']
          }
        ],
        order: [['accepted_at', 'DESC']]
      });
    } catch (err) {
      console.error('Error fetching accepted donations:', err.message);
      // Continue with empty array
    }

    // Try to get future commitments
    try {
      futureCommitments = await db.DonorNotification.findAll({
        where: {
          response_type: 'FUTURE_DONATION'
        },
        include: [
          {
            model: db.BloodRequest,
            as: 'request',
            required: false,
            where: {
              requester_id: requesterId
            },
            attributes: ['urgency_band', 'blood_group', 'created_at']
          },
          {
            model: db.Donor,
            as: 'donor',
            required: false,
            include: [{
              model: db.User,
              as: 'user',
              required: false,
              attributes: ['full_name', 'blood_group', 'city']
            }]
          }
        ],
        order: [['responded_at', 'DESC']]
      });
    } catch (err) {
      console.error('Error fetching future commitments:', err.message);
      // Continue with empty array
    }

    // Safely map results, handling missing associations
    const accepted = acceptedDonations.map(d => {
      try {
        return {
          id: d.id,
          donorId: d.donor_id,
          donorName: d.donor?.user?.full_name || 'Unknown Donor',
          bloodGroup: d.donor?.user?.blood_group || 'N/A',
          city: d.donor?.user?.city || 'N/A',
          donationType: d.donation_type,
          status: d.status,
          acceptedAt: d.accepted_at,
          completedAt: d.completed_at,
          urgencyBand: d.request?.urgency_band || 'N/A'
        };
      } catch (err) {
        console.error('Error mapping donation:', err.message);
        return null;
      }
    }).filter(d => d !== null);

    const future = futureCommitments.map(n => {
      try {
        return {
          id: n.id,
          donorId: n.donor_id,
          donorName: n.donor?.user?.full_name || 'Unknown Donor',
          bloodGroup: n.donor?.user?.blood_group || 'N/A',
          city: n.donor?.user?.city || 'N/A',
          respondedAt: n.responded_at,
          requestDate: n.request?.created_at || new Date(),
          urgencyBand: n.request?.urgency_band || 'N/A'
        };
      } catch (err) {
        console.error('Error mapping commitment:', err.message);
        return null;
      }
    }).filter(n => n !== null);

    res.json({
      accepted: accepted,
      futureCommitments: future
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    // Return empty arrays instead of error
    res.json({
      accepted: [],
      futureCommitments: []
    });
  }
});

// Get donation history for a donor
router.get('/donor/:donorId', async (req, res) => {
  try {
    const { donorId } = req.params;

    let donations = [];

    try {
      donations = await db.DonationHistory.findAll({
        where: {
          donor_id: donorId
        },
        include: [
          {
            model: db.User,
            as: 'requester',
            required: false,
            attributes: ['full_name', 'city']
          },
          {
            model: db.BloodRequest,
            as: 'request',
            required: false,
            attributes: ['blood_group', 'urgency_band', 'created_at']
          }
        ],
        order: [['accepted_at', 'DESC']]
      });
    } catch (err) {
      console.error('Error fetching donor donations:', err.message);
      // Continue with empty array
    }

    // Safely map results
    const mappedDonations = donations.map(d => {
      try {
        return {
          id: d.id,
          requesterName: d.requester?.full_name || 'Unknown Requester',
          city: d.requester?.city || 'N/A',
          bloodGroup: d.request?.blood_group || 'N/A',
          urgencyBand: d.request?.urgency_band || 'N/A',
          donationType: d.donation_type,
          status: d.status,
          acceptedAt: d.accepted_at,
          completedAt: d.completed_at
        };
      } catch (err) {
        console.error('Error mapping donation:', err.message);
        return null;
      }
    }).filter(d => d !== null);

    res.json({
      donations: mappedDonations
    });
  } catch (error) {
    console.error('Error fetching donor history:', error);
    // Return empty array instead of error
    res.json({
      donations: []
    });
  }
});

module.exports = router;
