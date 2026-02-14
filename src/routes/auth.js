const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../models');
const userService = require('../services/userService');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { fullName, age, gender, mobileNumber, city, bloodGroup, password, isDonor, lastDonationDate } = req.body;

    // Validate age
    if (age < 18 || age > 60) {
      return res.status(400).json({ error: 'Age must be between 18 and 60 years' });
    }

    // Hash password
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    // Create user
    const user = await db.User.create({
      full_name: fullName,
      age,
      gender,
      mobile_number: mobileNumber,
      city,
      blood_group: bloodGroup,
      password_hash: passwordHash,
      mobile_verified: true // Skip verification for demo
    });

    // Create donor profile if requested
    if (isDonor) {
      await db.Donor.create({
        user_id: user.id,
        last_donation_date: lastDonationDate || null
      });
    }

    res.status(201).json({
      message: 'User registered successfully',
      userId: user.id,
      isDonor
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    const user = await db.User.findOne({
      where: { mobile_number: mobileNumber }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For demo, skip password check if no password set
    if (user.password_hash) {
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.full_name,
        bloodGroup: user.blood_group,
        city: user.city
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
