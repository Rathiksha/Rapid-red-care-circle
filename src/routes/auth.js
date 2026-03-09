const dynamoDB = require("../../config/dynamodb");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../models');
const userService = require('../services/userService');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { fullName, age, gender, email, mobileNumber, city, address, bloodGroup, password, isDonor, lastDonationDate, medicalHistory } = req.body;

    console.log('Registration request received:', { fullName, age, gender, email, mobileNumber, city, address, bloodGroup, isDonor });

    // Validate age
    if (age < 18 || age > 60) {
      return res.status(400).json({ error: 'Age must be between 18 and 60 years' });
    }

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if mobile number already exists
    const existingMobile = await db.User.findOne({
      where: { mobile_number: mobileNumber }
    });

    if (existingMobile) {
      return res.status(400).json({ error: 'Mobile number already registered' });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await db.User.findOne({
        where: { email: email }
      });

      if (existingEmail) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Parse medical history
    let medicalHistoryObj = {};
    if (medicalHistory && typeof medicalHistory === 'string') {
      medicalHistoryObj = { notes: medicalHistory };
    } else if (medicalHistory && typeof medicalHistory === 'object') {
      medicalHistoryObj = medicalHistory;
    }

    // Create user
    const user = await db.User.create({
      full_name: fullName,
      age,
      gender,
      email: email || null,
      mobile_number: mobileNumber,
      city,
      address: address || null,
      blood_group: bloodGroup,
      password_hash: passwordHash,
      medical_history: medicalHistoryObj,
      mobile_verified: true // Skip verification for demo
    });

    console.log('User created successfully:', user.id);

    // Create donor profile if requested
    if (isDonor) {
      await db.Donor.create({
        user_id: user.id,
        last_donation_date: lastDonationDate || null
      });
      console.log('Donor profile created for user:', user.id);
    }

    res.status(201).json({
      message: 'User registered successfully',
      userId: user.id,
      isDonor
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Registration failed', 
      message: error.message,
      details: error.errors ? error.errors.map(e => e.message) : []
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    console.log('Login attempt:', emailOrMobile);

    // Find user by email or mobile number
    const user = await db.User.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { email: emailOrMobile },
          { mobile_number: emailOrMobile }
        ]
      },
      include: [{
        model: db.Donor,
        as: 'donorProfile',
        required: false
      }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Password not set for this account. Please contact support.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Login successful for user:', user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        bloodGroup: user.blood_group,
        city: user.city,
        isDonor: !!user.donorProfile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

// Forgot Password - Send Reset Link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('Password reset request for:', email);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Find user by email
    const user = await db.User.findOne({
      where: { email: email }
    });

    if (!user) {
      // For security, don't reveal if email exists or not
      // Return success message anyway
      console.log('Email not found, but returning success for security');
      return res.json({ 
        message: 'If this email is registered, you will receive a password reset link shortly.' 
      });
    }

    // Generate reset token (in production, use crypto.randomBytes)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in user record (you may want to add these fields to the User model)
    // For now, we'll just log it
    console.log('Reset token generated:', resetToken);
    console.log('Reset token expiry:', resetTokenExpiry);

    // In production, you would:
    // 1. Store the reset token and expiry in the database
    // 2. Send an email with the reset link containing the token
    // 3. Create a password reset page that accepts the token
    
    // For demo purposes, we'll just return success
    console.log('✅ Password reset link would be sent to:', email);
    console.log('🔗 Reset link: http://localhost:3000/reset-password?token=' + resetToken);

    res.json({ 
      message: 'Password reset link sent to your email',
      // In production, don't send the token in the response
      // This is only for demo/testing purposes
      demo_reset_link: `http://localhost:3000/reset-password?token=${resetToken}`
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request', message: error.message });
  }
});

// Get Profile
router.get('/profile', async (req, res) => {
  try {
    const { email } = req.query;

    console.log('👤 [PROFILE] Get profile request for:', email);

    if (!email) {
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
      console.error('❌ [PROFILE] User not found:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ [PROFILE] User found:', user.id);

    res.json({
      user: {
        id: user.id,
        full_name: user.full_name,
        age: user.age,
        gender: user.gender,
        email: user.email,
        mobile_number: user.mobile_number,
        city: user.city,
        address: user.address,
        blood_group: user.blood_group,
        medical_history: user.medical_history,
        is_active: user.is_active
      },
      donor: user.donorProfile ? {
        id: user.donorProfile.id,
        last_donation_date: user.donorProfile.last_donation_date,
        eligibility_score: user.donorProfile.eligibility_score,
        reliability_score: user.donorProfile.reliability_score,
        total_donations: user.donorProfile.total_donations
      } : null
    });
  } catch (error) {
    console.error('❌ [PROFILE] Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile', message: error.message });
  }
});

// Update Profile
router.put('/profile', async (req, res) => {
  try {
    const { email, fullName, age, gender, bloodGroup, mobileNumber, city, address, lastDonationDate, medicalHistory, isDonor } = req.body;

    console.log('👤 [PROFILE] Update profile request for:', email);
    console.log('📋 [PROFILE] Update data:', { fullName, age, gender, bloodGroup, city, address });

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate age
    if (age < 18 || age > 60) {
      return res.status(400).json({ error: 'Age must be between 18 and 60 years' });
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
      console.error('❌ [PROFILE] User not found:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ [PROFILE] User found:', user.id);

    // Parse medical history
    let medicalHistoryObj = user.medical_history || {};
    if (medicalHistory && typeof medicalHistory === 'string') {
      medicalHistoryObj = { notes: medicalHistory };
    } else if (medicalHistory && typeof medicalHistory === 'object') {
      medicalHistoryObj = medicalHistory;
    }

    // Update user fields
    user.full_name = fullName;
    user.age = age;
    user.gender = gender;
    user.blood_group = bloodGroup;
    user.mobile_number = mobileNumber;
    user.city = city;
    user.address = address || null;
    user.medical_history = medicalHistoryObj;

    await user.save();
    console.log('✅ [PROFILE] User updated successfully');

    // Handle donor profile
    if (isDonor) {
      if (user.donorProfile) {
        // Update existing donor profile
        if (lastDonationDate) {
          user.donorProfile.last_donation_date = lastDonationDate;
          await user.donorProfile.save();
          console.log('✅ [PROFILE] Donor profile updated');
        }
      } else {
        // Create new donor profile
        await db.Donor.create({
          user_id: user.id,
          last_donation_date: lastDonationDate || null
        });
        console.log('✅ [PROFILE] Donor profile created');
      }
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        blood_group: user.blood_group,
        city: user.city,
        address: user.address
      }
    });
  } catch (error) {
    console.error('❌ [PROFILE] Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile', message: error.message });
  }
});

module.exports = router;
