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

// Update donor availability and location (supports both email and numeric ID)
router.put('/:identifier/availability', async (req, res) => {
  try {
    const { is_available, latitude, longitude } = req.body;
    const identifier = req.params.identifier;
    
    console.log('📍 [AVAILABILITY] ========================================');
    console.log('📍 [AVAILABILITY] Updating donor availability');
    console.log('📍 [AVAILABILITY] Received identifier:', identifier);
    console.log('📍 [AVAILABILITY] Payload:', { is_available, latitude, longitude });
    console.log('📍 [AVAILABILITY] ========================================');
    
    // Determine if identifier is email or numeric ID
    const isEmail = identifier.includes('@');
    console.log('📍 [AVAILABILITY] Identifier type:', isEmail ? 'EMAIL' : 'NUMERIC ID');
    
    let user;
    let donor;
    
    if (isEmail) {
      // Find user by email first (CASE-INSENSITIVE)
      const emailLower = identifier.toLowerCase().trim();
      console.log('📍 [AVAILABILITY] Searching for user with email (lowercase):', emailLower);
      
      // First, let's log all users in the database for debugging
      const allUsers = await db.User.findAll({
        attributes: ['id', 'email', 'full_name'],
        raw: true
      });
      console.log('📊 [AVAILABILITY] All users in database:', allUsers.length);
      allUsers.forEach(u => {
        console.log(`   - User ID ${u.id}: ${u.email} (${u.full_name})`);
      });
      
      // Case-insensitive email search using Sequelize.where with fn.lower
      user = await db.User.findOne({
        where: db.Sequelize.where(
          db.Sequelize.fn('LOWER', db.Sequelize.col('email')),
          emailLower
        ),
        include: [{
          model: db.Donor,
          as: 'donorProfile',
          required: false
        }]
      });
      
      if (!user) {
        console.error('❌ [AVAILABILITY] User NOT FOUND with email:', identifier);
        console.error('❌ [AVAILABILITY] Searched for (lowercase):', emailLower);
        console.error('❌ [AVAILABILITY] Available emails in DB:', allUsers.map(u => u.email).join(', '));
        return res.status(404).json({ 
          error: 'User not found',
          details: `No user found with email: ${identifier}`,
          availableEmails: allUsers.map(u => u.email)
        });
      }
      
      console.log('✅ [AVAILABILITY] User FOUND!');
      console.log('✅ [AVAILABILITY] User ID:', user.id);
      console.log('✅ [AVAILABILITY] User Email:', user.email);
      console.log('✅ [AVAILABILITY] User Name:', user.full_name);
      
      // Check if user has a donor profile
      if (user.donorProfile) {
        donor = user.donorProfile;
        console.log('✅ [AVAILABILITY] Existing donor profile found:', donor.id);
      } else {
        // Create donor profile if it doesn't exist
        console.log('📝 [AVAILABILITY] No donor profile exists. Creating new donor profile...');
        donor = await db.Donor.create({
          user_id: user.id
        });
        console.log('✅ [AVAILABILITY] New donor profile created with ID:', donor.id);
      }
    } else {
      // Lookup by numeric ID
      console.log('📍 [AVAILABILITY] Looking up donor by numeric ID:', identifier);
      donor = await db.Donor.findByPk(identifier, {
        include: [{
          model: db.User,
          as: 'user',
          required: true
        }]
      });
      
      if (!donor) {
        console.error('❌ [AVAILABILITY] Donor not found with ID:', identifier);
        return res.status(404).json({ error: 'Donor not found' });
      }
      
      user = donor.user;
      console.log('✅ [AVAILABILITY] Donor found:', donor.id);
      console.log('✅ [AVAILABILITY] Associated user found:', user.id);
    }

    // Update user.is_active (this is what the map filters by)
    if (typeof is_available === 'boolean') {
      user.is_active = is_available;
      console.log('📍 [AVAILABILITY] Setting user.is_active to:', is_available);
    }
    
    // Update donor location if provided
    if (latitude && longitude) {
      console.log('📍 [AVAILABILITY] Updating location:', { latitude, longitude });
      
      // Set location using POINT format directly
      donor.current_location = `POINT(${longitude} ${latitude})`;
      donor.location_updated_at = new Date();
      
      console.log('📍 [AVAILABILITY] Location set to:', donor.current_location);
    }
    
    // Save both user and donor records
    console.log('💾 [AVAILABILITY] Saving user record...');
    await user.save();
    console.log('✅ [AVAILABILITY] User saved successfully');
    
    console.log('💾 [AVAILABILITY] Saving donor record...');
    await donor.save();
    console.log('✅ [AVAILABILITY] Donor saved successfully');

    console.log('✅ [AVAILABILITY] ========================================');
    console.log('✅ [AVAILABILITY] SUCCESS! Availability updated');
    console.log('✅ [AVAILABILITY] User ID:', user.id);
    console.log('✅ [AVAILABILITY] User Email:', user.email);
    console.log('✅ [AVAILABILITY] User Name:', user.full_name);
    console.log('✅ [AVAILABILITY] Donor ID:', donor.id);
    console.log('✅ [AVAILABILITY] Is Active:', user.is_active);
    console.log('✅ [AVAILABILITY] Location:', donor.current_location);
    console.log('✅ [AVAILABILITY] Location Updated:', donor.location_updated_at);
    console.log('✅ [AVAILABILITY] ========================================');
    
    res.json({ 
      message: 'Availability updated successfully',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        is_active: user.is_active
      },
      donor: {
        id: donor.id,
        user_id: donor.user_id,
        current_location: donor.current_location,
        location_updated_at: donor.location_updated_at
      }
    });
  } catch (error) {
    console.error('❌ [AVAILABILITY] ========================================');
    console.error('❌ [AVAILABILITY] ERROR updating availability');
    console.error('❌ [AVAILABILITY] Error message:', error.message);
    console.error('❌ [AVAILABILITY] Error name:', error.name);
    console.error('❌ [AVAILABILITY] Error stack:', error.stack);
    console.error('❌ [AVAILABILITY] ========================================');
    res.status(500).json({ 
      error: 'Failed to update availability', 
      message: error.message,
      details: error.toString()
    });
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

// Confirm willingness to donate
router.post('/willingness', async (req, res) => {
  try {
    const { email, isWilling, passedEligibility } = req.body;
    
    console.log('💚 [WILLINGNESS] ========================================');
    console.log('💚 [WILLINGNESS] Willingness confirmation request');
    console.log('📧 [WILLINGNESS] Email:', email);
    console.log('💚 [WILLINGNESS] Is Willing:', isWilling);
    console.log('✅ [WILLINGNESS] Passed Eligibility:', passedEligibility);
    
    if (!email) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find user by email (case-insensitive)
    const emailLower = email.toLowerCase().trim();
    const user = await db.User.findOne({
      where: db.Sequelize.where(
        db.Sequelize.fn('LOWER', db.Sequelize.col('email')),
        emailLower
      ),
      include: [{
        model: db.Donor,
        as: 'donorProfile',
        required: false
      }]
    });
    
    if (!user) {
      console.error('❌ [WILLINGNESS] User not found:', email);
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ [WILLINGNESS] User found:', user.id);
    
    let donor = user.donorProfile;
    
    // Create donor profile if it doesn't exist
    if (!donor) {
      console.log('📝 [WILLINGNESS] Creating donor profile...');
      donor = await db.Donor.create({
        user_id: user.id
      });
      console.log('✅ [WILLINGNESS] Donor profile created:', donor.id);
    }
    
    // Update willingness and eligibility status
    donor.is_willing = isWilling;
    donor.passed_eligibility = passedEligibility;
    
    if (passedEligibility) {
      donor.eligibility_passed_at = new Date();
    }
    
    if (isWilling) {
      donor.willingness_confirmed_at = new Date();
    }
    
    // Set location from user's address if available
    if (user.address) {
      console.log('📍 [WILLINGNESS] User has address, will geocode later');
      // For now, use default Chennai coordinates
      // In production, you would geocode the address
      const defaultLat = 13.0827 + (Math.random() - 0.5) * 0.1;
      const defaultLng = 80.2707 + (Math.random() - 0.5) * 0.1;
      donor.current_location = `POINT(${defaultLng} ${defaultLat})`;
      donor.location_updated_at = new Date();
    }
    
    // Mark user as active
    user.is_active = isWilling;
    
    await user.save();
    await donor.save();
    
    console.log('✅ [WILLINGNESS] Updated successfully');
    console.log('💚 [WILLINGNESS] Donor ID:', donor.id);
    console.log('💚 [WILLINGNESS] Is Willing:', donor.is_willing);
    console.log('💚 [WILLINGNESS] Passed Eligibility:', donor.passed_eligibility);
    console.log('💚 [WILLINGNESS] ========================================');
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      message: 'Willingness confirmed successfully',
      donor: {
        id: donor.id,
        is_willing: donor.is_willing,
        passed_eligibility: donor.passed_eligibility,
        eligibility_passed_at: donor.eligibility_passed_at,
        willingness_confirmed_at: donor.willingness_confirmed_at
      }
    });
  } catch (error) {
    console.error('❌ [WILLINGNESS] Error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      error: 'Failed to confirm willingness', 
      message: error.message 
    });
  }
});

// Alias route for backward compatibility
router.post('/confirm-willingness', async (req, res) => {
  console.log('⚠️ [WILLINGNESS] Using deprecated /confirm-willingness endpoint');
  console.log('⚠️ [WILLINGNESS] Redirecting to /willingness');
  
  // Forward to the main willingness handler
  req.url = '/willingness';
  return router.handle(req, res);
});

module.exports = router;
