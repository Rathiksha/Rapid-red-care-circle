'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('donors', 'is_willing', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('donors', 'passed_eligibility', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('donors', 'eligibility_passed_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('donors', 'willingness_confirmed_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('donors', 'is_willing');
    await queryInterface.removeColumn('donors', 'passed_eligibility');
    await queryInterface.removeColumn('donors', 'eligibility_passed_at');
    await queryInterface.removeColumn('donors', 'willingness_confirmed_at');
  }
};
