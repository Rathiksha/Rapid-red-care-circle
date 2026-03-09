'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add address field
    await queryInterface.addColumn('hospital_blood_banks', 'address', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Add emergency contact field
    await queryInterface.addColumn('hospital_blood_banks', 'emergency_contact', {
      type: Sequelize.STRING(20),
      allowNull: true
    });

    // Add service rating field
    await queryInterface.addColumn('hospital_blood_banks', 'service_rating', {
      type: Sequelize.DECIMAL(3, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    // Add is_active field
    await queryInterface.addColumn('hospital_blood_banks', 'is_active', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });

    // Add operating hours field (JSON)
    await queryInterface.addColumn('hospital_blood_banks', 'operating_hours', {
      type: Sequelize.JSON,
      defaultValue: {},
      allowNull: true
    });

    // Add created_at and updated_at timestamps
    await queryInterface.addColumn('hospital_blood_banks', 'created_at', {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      allowNull: false
    });

    await queryInterface.addColumn('hospital_blood_banks', 'updated_at', {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      allowNull: false
    });

    // Add index for is_active
    await queryInterface.addIndex('hospital_blood_banks', ['is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('hospital_blood_banks', 'address');
    await queryInterface.removeColumn('hospital_blood_banks', 'emergency_contact');
    await queryInterface.removeColumn('hospital_blood_banks', 'service_rating');
    await queryInterface.removeColumn('hospital_blood_banks', 'is_active');
    await queryInterface.removeColumn('hospital_blood_banks', 'operating_hours');
    await queryInterface.removeColumn('hospital_blood_banks', 'created_at');
    await queryInterface.removeColumn('hospital_blood_banks', 'updated_at');
    await queryInterface.removeIndex('hospital_blood_banks', ['is_active']);
  }
};
