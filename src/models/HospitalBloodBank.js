'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class HospitalBloodBank extends Model {
    static associate(models) {
      // No associations for HospitalBloodBank
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

    /**
     * Check if blood type is available
     */
    hasBloodType(bloodGroup) {
      if (!this.blood_availability || typeof this.blood_availability !== 'object') {
        return false;
      }
      const availability = this.blood_availability[bloodGroup];
      return availability && availability.units > 0;
    }

    /**
     * Get units available for blood type
     */
    getUnitsAvailable(bloodGroup) {
      if (!this.blood_availability || typeof this.blood_availability !== 'object') {
        return 0;
      }
      const availability = this.blood_availability[bloodGroup];
      return availability && availability.units ? availability.units : 0;
    }

    /**
     * Check if inventory data is stale (>24 hours old)
     */
    isInventoryStale(bloodGroup) {
      if (!this.blood_availability || typeof this.blood_availability !== 'object') {
        return true;
      }
      const availability = this.blood_availability[bloodGroup];
      if (!availability || !availability.updated_at) {
        return true;
      }
      const updatedAt = new Date(availability.updated_at);
      const now = new Date();
      const hoursDiff = (now - updatedAt) / (1000 * 60 * 60);
      return hoursDiff > 24;
    }

    /**
     * Calculate distance from given coordinates (in km)
     */
    calculateDistance(latitude, longitude) {
      const location = this.getLocation();
      if (!location) return null;

      const [lng, lat] = location.coordinates;
      
      // Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = (latitude - lat) * Math.PI / 180;
      const dLon = (longitude - lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
  }

  HospitalBloodBank.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    hospital_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'hospital_name'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: DataTypes.GEOGRAPHY('POINT', 4326),
      allowNull: false
    },
    contact_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'contact_number'
    },
    emergency_contact: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'emergency_contact'
    },
    blood_availability: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'blood_availability'
    },
    service_rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
      field: 'service_rating',
      validate: {
        min: 0,
        max: 5
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    operating_hours: {
      type: DataTypes.JSON,
      defaultValue: {},
      field: 'operating_hours'
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_updated'
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
    modelName: 'HospitalBloodBank',
    tableName: 'hospital_blood_banks',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return HospitalBloodBank;
};
