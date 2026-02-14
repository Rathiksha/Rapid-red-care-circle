'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BloodRequest extends Model {
    static associate(models) {
      // BloodRequest belongs to User (requester)
      BloodRequest.belongsTo(models.User, {
        foreignKey: 'requester_id',
        as: 'requester'
      });

      // BloodRequest has many DonorNotifications
      BloodRequest.hasMany(models.DonorNotification, {
        foreignKey: 'request_id',
        as: 'notifications'
      });

      // BloodRequest has many DonationHistory
      BloodRequest.hasMany(models.DonationHistory, {
        foreignKey: 'request_id',
        as: 'donationHistory'
      });
    }

    /**
     * Get location as GeoJSON
     */
    getLocation() {
      if (!this.location) return null;
      
      // Parse PostGIS geography point
      const match = this.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) {
        return {
          type: 'Point',
          coordinates: [parseFloat(match[1]), parseFloat(match[2])]
        };
      }
      return null;
    }

    /**
     * Set location from coordinates
     */
    setLocation(longitude, latitude) {
      this.location = `POINT(${longitude} ${latitude})`;
    }
  }

  BloodRequest.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    requester_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'requester_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    blood_group: {
      type: DataTypes.STRING(5),
      allowNull: false,
      field: 'blood_group',
      validate: {
        isIn: {
          args: [['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']],
          msg: 'Invalid blood group'
        }
      }
    },
    urgency_band: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'urgency_band',
      validate: {
        isIn: {
          args: [['RED', 'PINK', 'WHITE']],
          msg: 'Urgency band must be RED, PINK, or WHITE'
        }
      }
    },
    required_timeframe: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'required_timeframe'
    },
    location: {
      type: DataTypes.GEOGRAPHY('POINT', 4326),
      allowNull: false
    },
    hospital_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'hospital_name'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'PENDING',
      validate: {
        isIn: {
          args: [['PENDING', 'DONOR_ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED']],
          msg: 'Invalid status'
        }
      }
    },
    is_private: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_private'
    },
    emergency_warning: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'emergency_warning'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at'
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    }
  }, {
    sequelize,
    modelName: 'BloodRequest',
    tableName: 'blood_requests',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return BloodRequest;
};
