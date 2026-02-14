'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class DonationHistory extends Model {
    static associate(models) {
      // DonationHistory belongs to BloodRequest
      DonationHistory.belongsTo(models.BloodRequest, {
        foreignKey: 'request_id',
        as: 'request'
      });

      // DonationHistory belongs to Donor
      DonationHistory.belongsTo(models.Donor, {
        foreignKey: 'donor_id',
        as: 'donor'
      });

      // DonationHistory belongs to User (requester)
      DonationHistory.belongsTo(models.User, {
        foreignKey: 'requester_id',
        as: 'requester'
      });
    }

    /**
     * Check if donation was completed
     */
    isCompleted() {
      return this.status === 'COMPLETED' && this.completed_at !== null;
    }

    /**
     * Check if donation was cancelled
     */
    isCancelled() {
      return this.status === 'CANCELLED' && this.cancelled_at !== null;
    }
  }

  DonationHistory.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    request_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'request_id',
      references: {
        model: 'blood_requests',
        key: 'id'
      }
    },
    donor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'donor_id',
      references: {
        model: 'donors',
        key: 'id'
      }
    },
    requester_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'requester_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    donation_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'donation_type',
      validate: {
        isIn: {
          args: [['SELF', 'FAMILY', 'FRIEND', 'OTHER']],
          msg: 'Invalid donation type'
        }
      }
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: {
          args: [['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']],
          msg: 'Invalid status'
        }
      }
    },
    accepted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'accepted_at'
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'cancelled_at'
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'cancellation_reason'
    }
  }, {
    sequelize,
    modelName: 'DonationHistory',
    tableName: 'donation_history',
    timestamps: false
  });

  return DonationHistory;
};
