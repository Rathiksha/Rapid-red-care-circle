'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Donor extends Model {
    static associate(models) {
      // Donor belongs to User
      Donor.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      // Donor has many DonorNotifications
      Donor.hasMany(models.DonorNotification, {
        foreignKey: 'donor_id',
        as: 'notifications'
      });

      // Donor has many DonationHistory
      Donor.hasMany(models.DonationHistory, {
        foreignKey: 'donor_id',
        as: 'donationHistory'
      });
    }

    /**
     * Get current location as GeoJSON
     */
    getLocation() {
      if (!this.current_location) return null;
      
      // Parse PostGIS geography point
      // Format: POINT(longitude latitude)
      const match = this.current_location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
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
      this.current_location = `POINT(${longitude} ${latitude})`;
    }
  }

  Donor.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    last_donation_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'last_donation_date'
    },
    eligibility_score: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 100.00,
      field: 'eligibility_score',
      validate: {
        min: 0,
        max: 100
      }
    },
    reliability_score: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 50.00,
      field: 'reliability_score',
      validate: {
        min: 0,
        max: 100
      }
    },
    total_donations: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_donations',
      validate: {
        min: 0
      }
    },
    completed_donations: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'completed_donations',
      validate: {
        min: 0
      }
    },
    cancelled_donations: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'cancelled_donations',
      validate: {
        min: 0
      }
    },
    current_location: {
      type: DataTypes.GEOGRAPHY('POINT', 4326),
      allowNull: true,
      field: 'current_location'
    },
    location_updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'location_updated_at'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'Donor',
    tableName: 'donors',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Donor;
};
