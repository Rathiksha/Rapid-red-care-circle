'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class DonorNotification extends Model {
    static associate(models) {
      // DonorNotification belongs to BloodRequest
      DonorNotification.belongsTo(models.BloodRequest, {
        foreignKey: 'request_id',
        as: 'request'
      });

      // DonorNotification belongs to Donor
      DonorNotification.belongsTo(models.Donor, {
        foreignKey: 'donor_id',
        as: 'donor'
      });
    }

    /**
     * Check if notification has been viewed
     */
    isViewed() {
      return this.viewed_at !== null;
    }

    /**
     * Check if notification has been responded to
     */
    isResponded() {
      return this.responded_at !== null;
    }

    /**
     * Check if notification has expired
     */
    hasExpired() {
      return this.is_expired || (this.timeout_at && new Date() > this.timeout_at);
    }
  }

  DonorNotification.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    request_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'request_id',
      references: {
        model: 'blood_requests',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    donor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'donor_id',
      references: {
        model: 'donors',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    sent_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'sent_at'
    },
    viewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'viewed_at'
    },
    responded_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'responded_at'
    },
    response_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'response_type',
      validate: {
        isIn: {
          args: [['ACCEPTED', 'DECLINED', 'IGNORED', 'FUTURE_DONATION']],
          msg: 'Invalid response type'
        }
      }
    },
    timeout_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'timeout_at'
    },
    is_expired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_expired'
    }
  }, {
    sequelize,
    modelName: 'DonorNotification',
    tableName: 'donor_notifications',
    timestamps: false
  });

  return DonorNotification;
};
