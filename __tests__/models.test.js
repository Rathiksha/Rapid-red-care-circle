const db = require('../src/models');

describe('Sequelize Models', () => {
  describe('Model Loading', () => {
    test('should load all models', () => {
      expect(db.User).toBeDefined();
      expect(db.Donor).toBeDefined();
      expect(db.BloodRequest).toBeDefined();
      expect(db.DonorNotification).toBeDefined();
      expect(db.DonationHistory).toBeDefined();
      expect(db.HospitalBloodBank).toBeDefined();
    });

    test('should have sequelize instance', () => {
      expect(db.sequelize).toBeDefined();
      expect(db.Sequelize).toBeDefined();
    });
  });

  describe('User Model', () => {
    test('should have correct table name', () => {
      expect(db.User.tableName).toBe('users');
    });

    test('should have age validation', () => {
      const ageField = db.User.rawAttributes.age;
      expect(ageField.validate).toBeDefined();
      expect(ageField.validate.min).toBeDefined();
      expect(ageField.validate.max).toBeDefined();
    });

    test('should have blood group validation', () => {
      const bloodGroupField = db.User.rawAttributes.blood_group;
      expect(bloodGroupField.validate).toBeDefined();
      expect(bloodGroupField.validate.isIn).toBeDefined();
    });

    test('should have associations', () => {
      expect(db.User.associations.donorProfile).toBeDefined();
      expect(db.User.associations.bloodRequests).toBeDefined();
      expect(db.User.associations.requestedDonations).toBeDefined();
    });
  });

  describe('Donor Model', () => {
    test('should have correct table name', () => {
      expect(db.Donor.tableName).toBe('donors');
    });

    test('should have score validations', () => {
      const eligibilityField = db.Donor.rawAttributes.eligibility_score;
      const reliabilityField = db.Donor.rawAttributes.reliability_score;
      
      expect(eligibilityField.validate).toBeDefined();
      expect(reliabilityField.validate).toBeDefined();
    });

    test('should have associations', () => {
      expect(db.Donor.associations.user).toBeDefined();
      expect(db.Donor.associations.notifications).toBeDefined();
      expect(db.Donor.associations.donationHistory).toBeDefined();
    });
  });

  describe('BloodRequest Model', () => {
    test('should have correct table name', () => {
      expect(db.BloodRequest.tableName).toBe('blood_requests');
    });

    test('should have urgency band validation', () => {
      const urgencyField = db.BloodRequest.rawAttributes.urgency_band;
      expect(urgencyField.validate).toBeDefined();
      expect(urgencyField.validate.isIn).toBeDefined();
      expect(urgencyField.validate.isIn.args[0]).toContain('RED');
      expect(urgencyField.validate.isIn.args[0]).toContain('PINK');
      expect(urgencyField.validate.isIn.args[0]).toContain('WHITE');
    });

    test('should have blood group validation', () => {
      const bloodGroupField = db.BloodRequest.rawAttributes.blood_group;
      expect(bloodGroupField.validate).toBeDefined();
      expect(bloodGroupField.validate.isIn).toBeDefined();
    });

    test('should have associations', () => {
      expect(db.BloodRequest.associations.requester).toBeDefined();
      expect(db.BloodRequest.associations.notifications).toBeDefined();
      expect(db.BloodRequest.associations.donationHistory).toBeDefined();
    });
  });

  describe('DonorNotification Model', () => {
    test('should have correct table name', () => {
      expect(db.DonorNotification.tableName).toBe('donor_notifications');
    });

    test('should have response type validation', () => {
      const responseField = db.DonorNotification.rawAttributes.response_type;
      expect(responseField.validate).toBeDefined();
      expect(responseField.validate.isIn).toBeDefined();
    });

    test('should have associations', () => {
      expect(db.DonorNotification.associations.request).toBeDefined();
      expect(db.DonorNotification.associations.donor).toBeDefined();
    });
  });

  describe('DonationHistory Model', () => {
    test('should have correct table name', () => {
      expect(db.DonationHistory.tableName).toBe('donation_history');
    });

    test('should have donation type validation', () => {
      const donationTypeField = db.DonationHistory.rawAttributes.donation_type;
      expect(donationTypeField.validate).toBeDefined();
      expect(donationTypeField.validate.isIn).toBeDefined();
    });

    test('should have status validation', () => {
      const statusField = db.DonationHistory.rawAttributes.status;
      expect(statusField.validate).toBeDefined();
      expect(statusField.validate.isIn).toBeDefined();
    });

    test('should have associations', () => {
      expect(db.DonationHistory.associations.request).toBeDefined();
      expect(db.DonationHistory.associations.donor).toBeDefined();
      expect(db.DonationHistory.associations.requester).toBeDefined();
    });
  });

  describe('HospitalBloodBank Model', () => {
    test('should have correct table name', () => {
      expect(db.HospitalBloodBank.tableName).toBe('hospital_blood_banks');
    });

    test('should have location field', () => {
      const locationField = db.HospitalBloodBank.rawAttributes.location;
      expect(locationField).toBeDefined();
      expect(locationField.allowNull).toBe(false);
    });
  });
});
